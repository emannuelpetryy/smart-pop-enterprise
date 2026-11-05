import { PrismaClient } from "@prisma/client";
import { generateTotp, verifyTotp, createDynamicQrPayload } from "../src/lib/totp.ts";
import { evaluateGateAccess } from "../src/lib/gate-engine.ts";
import { generateOjtAuditHash, generateMesToken } from "../src/lib/audit-crypto.ts";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("🧪 STARTING SMART POP ENTERPRISE VERIFICATION SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database seed inspection
    console.log("--- 1. Database State Inspection ---");
    const userCount = await prisma.user.count();
    const assetCount = await prisma.asset.count();
    const popCount = await prisma.popDocument.count();

    assert(userCount >= 5, `Expected >= 5 seeded users, got ${userCount}`);
    assert(assetCount >= 3, `Expected >= 3 seeded assets, got ${assetCount}`);
    assert(popCount >= 2, `Expected >= 2 seeded POP documents, got ${popCount}`);

    // 2. TOTP & Dynamic QR Code Security
    console.log("\n--- 2. TOTP & Dynamic QR Code Security ---");
    const testSecret = "JBSWY3DPEHPK3PXP";
    const totpResult = generateTotp(testSecret);

    assert(totpResult.code.length === 6, `TOTP code length is 6 digits (${totpResult.code})`);
    assert(totpResult.remainingSeconds >= 1 && totpResult.remainingSeconds <= 30, `Remaining seconds within 1-30s window (${totpResult.remainingSeconds}s)`);

    const isCodeValid = verifyTotp(testSecret, totpResult.code);
    assert(isCodeValid === true, "verifyTotp accepts generated code in active window");

    const isBogusValid = verifyTotp(testSecret, "999999");
    assert(isBogusValid === false, "verifyTotp rejects incorrect code");

    const dynamicQr = createDynamicQrPayload("test-uid", "OP-10492", testSecret);
    const parsedQr = JSON.parse(dynamicQr.payloadString);
    assert(parsedQr.app === "SmartPOP_Passport", "Dynamic QR payload contains correct app identifier");
    assert(parsedQr.totp === dynamicQr.code, "Dynamic QR payload matches TOTP code");
    assert(parsedQr.sig && parsedQr.sig.length === 16, "Dynamic QR payload carries cryptographic signature");

    // 3. Zone Gating Logic & CLT Art. 4º Blindagem
    console.log("\n--- 3. Zone Gating & Labor Compliance Verification ---");

    // Case A: Mariana Costa (Nível 1 - Aprendiz Teórico, recém admitida)
    // Na Zona 0 (Portaria Externa), DEVE ser liberada (Início da jornada legal CLT)
    const marianaZona0 = await evaluateGateAccess({
      registrationNumber: "OP-20831",
      zone: "ZONA_0_PORTARIA",
    });
    assert(marianaZona0.accessGranted === true, "Zona 0 allows admitted employee to clock in (CLT Art. 4º)");
    assert(marianaZona0.statusCode === "GRANTED", "Zona 0 status code is GRANTED");

    // Na Zona 1 (Chão de Fábrica), Mariana DEVE ter BLOQUEIO RÍGIDO (Falta OJT presencial do supervisor)
    const marianaZona1 = await evaluateGateAccess({
      registrationNumber: "OP-20831",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
    });
    assert(marianaZona1.accessGranted === false, "Zona 1 HARD GATE blocks Level 1 trainee lacking OJT");
    assert(marianaZona1.statusCode === "BLOCKED_TRAINING", "Zona 1 status code is BLOCKED_TRAINING");

    // Case B: Roberto Silva (Nível 3 - Autônomo Habilitado com OJT aprovado)
    // Na Zona 1, DEVE ser liberado
    const robertoZona1 = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(robertoZona1.accessGranted === true, "Zona 1 allows Level 3 Autonomous operator");
    assert(robertoZona1.statusCode === "GRANTED", "Roberto Zona 1 status is GRANTED");

    // Sub-atividade de Manutenção Preventiva do Roberto Silva é Nível 0 (Revogada/Bloqueada)
    const robertoManutencao = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "MANUTENCAO_PREVENTIVA",
    });
    assert(robertoManutencao.accessGranted === false, "Zona 1 blocks operator on unauthorized sub-activity (3D matrix)");

    // Case C: Julia Antunes (Afastamento Médico S-2230)
    const juliaZona1 = await evaluateGateAccess({
      registrationNumber: "OP-50873",
      zone: "ZONA_1_CHAO_DE_FABRICA",
    });
    assert(juliaZona1.accessGranted === false, "Zona 1 blocks employee on medical leave (S-2230)");
    assert(juliaZona1.statusCode === "BLOCKED_HEALTH", "Julia Zona 1 status code is BLOCKED_HEALTH");

    // Case D: Latency Check (< 20ms local edge gateway)
    assert(robertoZona1.latencyMs < 30, `Edge turnstile latency < 30ms (${robertoZona1.latencyMs}ms measured)`);

    // 4. Cryptographic Sign-Off & MES Token
    console.log("\n--- 4. Cryptographic Sign-Off & MES Interlock ---");
    const sampleAuditHash = generateOjtAuditHash({
      operatorId: "op-1",
      supervisorId: "sp-1",
      assetId: "ast-1",
      popId: "pop-1",
      subActivity: "OPERACAO_CONTINUA",
      timestamp: new Date().toISOString(),
      safetyPointsValidated: "[]",
    });
    assert(typeof sampleAuditHash === "string" && sampleAuditHash.length === 64, "OJT audit hash is valid 64-char SHA-256");

    const mesTokenResult = generateMesToken("PRE-400T-01", "RFID-881920");
    assert(mesTokenResult.token.startsWith("MES-AUTH-PRE-400T-01-"), "MES token generated with proper asset prefix");
    assert(mesTokenResult.expiresAt > new Date(), "MES token expiration set in future (8-hour shift)");

    console.log("\n=================================================");
    console.log(`📊 TEST SUITE FINISHED: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

import { PrismaClient } from "@prisma/client";
import { generateTotp, verifyTotp, createDynamicQrPayload } from "../src/lib/totp.ts";
import { evaluateGateAccess } from "../src/lib/gate-engine.ts";
import { generateOjtAuditHash, generateMesToken } from "../src/lib/audit-crypto.ts";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("🧪 SMART POP ENTERPRISE RIGOROUS VERIFICATION SUITE");
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
    // 1. Database State Inspection
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
    const robertoZona1 = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(robertoZona1.accessGranted === true, "Zona 1 allows Level 3 Autonomous operator");
    assert(robertoZona1.statusCode === "GRANTED", "Roberto Zona 1 status is GRANTED");

    // 3D Matrix Granularity: Setup de Estampo é Nível 2 (Tutela/Shadowing)
    const robertoSetup = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "SETUP_ESTAMPO",
    });
    assert(robertoSetup.accessGranted === true, "Zona 1 conditionally allows Nível 2 Setup under Tutela");
    assert(robertoSetup.statusCode === "GRANTED_WITH_WARNING", "Roberto Setup status code is GRANTED_WITH_WARNING");

    // Sub-atividade de Manutenção Preventiva do Roberto Silva é Nível 0 (Revogada/Bloqueada)
    const robertoManutencao = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "MANUTENCAO_PREVENTIVA",
    });
    assert(robertoManutencao.accessGranted === false, "Zona 1 blocks operator on unauthorized sub-activity (3D matrix)");
    assert(robertoManutencao.statusCode === "BLOCKED_TRAINING", "Unauthorized sub-activity is BLOCKED_TRAINING");

    // Case C: Julia Antunes (Afastamento Médico S-2230)
    const juliaZona1 = await evaluateGateAccess({
      registrationNumber: "OP-50873",
      zone: "ZONA_1_CHAO_DE_FABRICA",
    });
    assert(juliaZona1.accessGranted === false, "Zona 1 blocks employee on medical leave (S-2230)");
    assert(juliaZona1.statusCode === "BLOCKED_HEALTH", "Julia Zona 1 status code is BLOCKED_HEALTH");

    // Case D: Unknown / Non-existent Badge or Registration
    const unknownBadge = await evaluateGateAccess({
      badgeNumber: "RFID-NONEXISTENT-99999",
      zone: "ZONA_0_PORTARIA",
    });
    assert(unknownBadge.accessGranted === false, "Unknown badge is strictly blocked");
    assert(unknownBadge.statusCode === "BLOCKED_LEGAL", "Unknown badge status code is BLOCKED_LEGAL");

    // Case E: Dynamic QR / TOTP Authentication at Turnstile
    const robertoTotp = generateTotp(testSecret).code;
    const gateWithValidTotp = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      totpCode: robertoTotp,
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(gateWithValidTotp.accessGranted === true, "Gate accepts valid Dynamic QR TOTP code");

    const gateWithInvalidTotp = await evaluateGateAccess({
      registrationNumber: "OP-10492",
      totpCode: "000000",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(gateWithInvalidTotp.accessGranted === false, "Gate rejects expired/invalid Dynamic QR TOTP code");
    assert(gateWithInvalidTotp.statusCode === "BLOCKED_LEGAL", "Invalid TOTP returns BLOCKED_LEGAL");

    // Case F: Security Check - Revoked Passport MUST NOT grant access even if TWI level was 3
    console.log("\n--- 4. Revocation & Expiration Edge Cases ---");
    const robertoUser = await prisma.user.findFirst({
      where: { registrationNumber: "OP-10492" },
      include: { passports: { include: { asset: true } } },
    });
    const robertoPassport = robertoUser.passports.find(
      (p) => p.asset.code === "PRE-400T-01" && p.subActivity === "OPERACAO_CONTINUA"
    );

    // Temporarily set to REVOGADO
    await prisma.qualificationPassport.update({
      where: { id: robertoPassport.id },
      data: { status: "REVOGADO" },
    });

    const revokedGateCheck = await evaluateGateAccess({
      userId: robertoUser.id,
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(revokedGateCheck.accessGranted === false, "Gate BLOCKS operator with REVOGADO passport despite TWI level 3");
    assert(revokedGateCheck.statusCode === "BLOCKED_TRAINING", "Revoked passport returns BLOCKED_TRAINING");

    // Temporarily set to expired annual renewal
    await prisma.qualificationPassport.update({
      where: { id: robertoPassport.id },
      data: { status: "HABILITADO", expiresAt: new Date(Date.now() - 3600 * 1000) },
    });

    const expiredGateCheck = await evaluateGateAccess({
      userId: robertoUser.id,
      zone: "ZONA_1_CHAO_DE_FABRICA",
      assetCode: "PRE-400T-01",
      subActivity: "OPERACAO_CONTINUA",
    });
    assert(expiredGateCheck.accessGranted === false, "Gate BLOCKS operator with expired periodic qualification (NR-12)");
    assert(expiredGateCheck.statusCode === "BLOCKED_DELTA_EXPIRED", "Expired qualification returns BLOCKED_DELTA_EXPIRED");

    // Restore roberto passport to normal valid state
    await prisma.qualificationPassport.update({
      where: { id: robertoPassport.id },
      data: { status: "HABILITADO", expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000) },
    });

    // Case G: Edge Gate Latency Check (< 20ms local edge gateway)
    assert(robertoZona1.latencyMs < 30, `Edge turnstile latency < 30ms (${robertoZona1.latencyMs}ms measured)`);

    // 5. Cryptographic Sign-Off & MES Token
    console.log("\n--- 5. Cryptographic Sign-Off & MES Interlock ---");
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

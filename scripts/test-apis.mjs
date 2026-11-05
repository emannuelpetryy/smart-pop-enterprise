import { PrismaClient } from "@prisma/client";
import { POST as completeTheoryHandler } from "../src/app/api/kiosk/complete-theory/route.ts";
import { POST as pokaYokeHandler } from "../src/app/api/poka-yoke/submit/route.ts";
import { POST as ojtHandler } from "../src/app/api/ojt/submit/route.ts";
import { POST as rhWebhookHandler } from "../src/app/api/rh/webhook/route.ts";
import { POST as deltaRecycleHandler } from "../src/app/api/passport/delta-recycle/route.ts";

const prisma = new PrismaClient();

function createMockRequest(body) {
  return {
    json: async () => body,
  };
}

async function runApiTests() {
  console.log("=================================================");
  console.log("🧪 TESTING API HANDLERS DIRECTLY");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Test Poka-Yoke Machine Unlock blocked for Medical Leave employee
    const julia = await prisma.user.findFirst({ where: { registrationNumber: "OP-50873" } });
    const pressAsset = await prisma.asset.findFirst({ where: { code: "PRE-400T-01" } });

    const pyRes = await pokaYokeHandler(createMockRequest({
      assetId: pressAsset.id,
      operatorId: julia.id,
      shift: "TURNO_1",
      checklistItems: [{ id: "1", checked: true }],
    }));
    assert(pyRes.status === 403, `Poka-Yoke blocks operator on medical leave (status: ${pyRes.status})`);
    const pyJson = await pyRes.json();
    assert(pyJson.error.includes("BLOQUEIO DE SEGURANÇA NR-01"), "Error message contains safety legal reference");

    // 2. Test Kiosk Complete Theory does not demote Level 3 operator (Roberto Silva)
    const roberto = await prisma.user.findFirst({ where: { registrationNumber: "OP-10492" } });
    const pop = await prisma.popDocument.findFirst({ where: { targetAssetId: pressAsset.id } });

    const kioskRes = await completeTheoryHandler(createMockRequest({
      userId: roberto.id,
      popId: pop.id,
      quizAnswers: { q1: 1, q2: 1 },
      score: 100,
    }));
    assert(kioskRes.status === 200, "Kiosk complete theory succeeds");
    const kioskJson = await kioskRes.json();
    assert(kioskJson.twiLevel === 3, `Roberto preserves Level 3 after completing theory/quiz (got Level ${kioskJson.twiLevel})`);
    assert(kioskJson.status === "HABILITADO", "Roberto maintains status HABILITADO");

    // 3. Test OJT Submit with REPROVADO verdict sets Level 2 (Tutela)
    const supervisor = await prisma.user.findFirst({ where: { role: "SUPERVISOR" } });
    const mariana = await prisma.user.findFirst({ where: { registrationNumber: "OP-20831" } });

    const ojtReprovadoRes = await ojtHandler(createMockRequest({
      operatorId: mariana.id,
      supervisorId: supervisor.id,
      assetId: pressAsset.id,
      popId: pop.id,
      subActivity: "OPERACAO_CONTINUA",
      safetyPointsValidated: [],
      evidencePhotoBase64: "data:image/test",
      verdict: "REPROVADO_NECESSITA_TUTELA",
      feedbackNotes: "Falta precisão no alinhamento da chapa.",
    }));
    assert(ojtReprovadoRes.status === 200, "OJT Reprovado recorded successfully");

    const marianaPassportAfterOjt = await prisma.qualificationPassport.findFirst({
      where: { userId: mariana.id, assetId: pressAsset.id, subActivity: "OPERACAO_CONTINUA" },
    });
    assert(marianaPassportAfterOjt.twiLevel === 2, `Mariana is placed in Level 2 Tutela after OJT reprovação (got ${marianaPassportAfterOjt.twiLevel})`);

    // 4. Test RH Webhook: Non-existent employee returns 404 cleanly instead of crashing 500
    const rhUnknownRes = await rhWebhookHandler(createMockRequest({
      eventType: "S2230_AFASTAMENTO",
      externalEmployeeId: "OP-DOES-NOT-EXIST-000",
      payload: {},
    }));
    assert(rhUnknownRes.status === 404, `RH Webhook returns 404 for unknown user (status: ${rhUnknownRes.status})`);

    // 5. Test RH Webhook: S2230_RETORNO reactivates user
    const rhRetornoRes = await rhWebhookHandler(createMockRequest({
      eventType: "S2230_RETORNO",
      externalEmployeeId: julia.registrationNumber,
      payload: { reason: "Retorno de afastamento médico (ASO Apto)" },
    }));
    assert(rhRetornoRes.status === 200, "S-2230 Retorno webhook executed");
    const juliaAfterRetorno = await prisma.user.findUnique({ where: { id: julia.id } });
    assert(juliaAfterRetorno.status === "ATIVO", `Julia status reactivated to ATIVO (got ${juliaAfterRetorno.status})`);

    // Put Julia back to medical leave for consistency with seed persona
    await prisma.user.update({ where: { id: julia.id }, data: { status: "AFASTADO_MEDICO" } });

    // 6. Test Delta Recycling API
    const valdir = await prisma.user.findFirst({ where: { registrationNumber: "OP-60124" } });
    const deltaRes = await deltaRecycleHandler(createMockRequest({
      userId: valdir.id,
      assetId: pressAsset.id,
      popId: pop.id,
      answerIndex: 1, // Correct 6.2 bar
    }));
    assert(deltaRes.status === 200, "Delta Recycling API accepted correct answer");
    const deltaJson = await deltaRes.json();
    assert(deltaJson.newStatus === "HABILITADO", "Delta Recycling restored status to HABILITADO");

    const valdirPassportAfter = await prisma.qualificationPassport.findFirst({
      where: { userId: valdir.id, assetId: pressAsset.id },
    });
    assert(valdirPassportAfter.status === "HABILITADO", "Valdir passport status in database is now HABILITADO");

    // Put Valdir back to RECICLAGEM_DELTA_PENDENTE for UI testing
    await prisma.qualificationPassport.update({
      where: { id: valdirPassportAfter.id },
      data: { status: "RECICLAGEM_DELTA_PENDENTE", deltaToleranceDeadline: new Date(Date.now() + 48 * 3600 * 1000) },
    });

    console.log("\n=================================================");
    console.log(`📊 API TEST SUITE: ${passed} Passed, ${failed} Failed`);
    console.log("=================================================\n");

    if (failed > 0) process.exit(1);
  } catch (e) {
    console.error("API test exception:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runApiTests();

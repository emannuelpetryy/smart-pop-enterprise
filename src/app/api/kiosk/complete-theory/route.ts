import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, popId, quizAnswers, score } = body;

    if (!userId || !popId || typeof score !== "number") {
      return NextResponse.json({ error: "Dados incompletos para conclusão da teoria." }, { status: 400 });
    }

    const pop = await prisma.popDocument.findUnique({
      where: { id: popId },
      include: { asset: true },
    });

    if (!pop || !pop.asset) {
      return NextResponse.json({ error: "POP ou Ativo correspondente não encontrado." }, { status: 404 });
    }

    const isApproved = score >= 80;

    if (!isApproved) {
      return NextResponse.json({
        approved: false,
        score,
        message: `Pontuação atingida: ${score}%. É necessário atingir o mínimo de 80% para concluir a etapa teórica do TWI. Revise os pontos críticos e tente novamente.`,
      });
    }

    // Look up existing qualification passport to prevent demoting qualified operators
    const existingPassport = await prisma.qualificationPassport.findUnique({
      where: {
        userId_assetId_subActivity: {
          userId,
          assetId: pop.asset.id,
          subActivity: "OPERACAO_CONTINUA",
        },
      },
    });

    let targetTwiLevel = 1;
    let targetStatus = "PENDENTE_TEORIA";

    if (existingPassport) {
      if (existingPassport.twiLevel >= 3) {
        // Keeps autonomous / multiplier level and restores/confirms HABILITADO
        targetTwiLevel = existingPassport.twiLevel;
        targetStatus = "HABILITADO";
      } else if (existingPassport.twiLevel === 2) {
        // Keeps Tutela level
        targetTwiLevel = 2;
        targetStatus = existingPassport.status === "RECICLAGEM_DELTA_PENDENTE" ? "HABILITADO" : existingPassport.status;
      } else {
        targetTwiLevel = 1;
        targetStatus = "PENDENTE_TEORIA";
      }
    }

    const passport = await prisma.qualificationPassport.upsert({
      where: {
        userId_assetId_subActivity: {
          userId,
          assetId: pop.asset.id,
          subActivity: "OPERACAO_CONTINUA",
        },
      },
      create: {
        userId,
        assetId: pop.asset.id,
        subActivity: "OPERACAO_CONTINUA",
        popId: pop.id,
        twiLevel: 1, // Concluiu teoria
        theoryCompletedAt: new Date(),
        theoryScore: score,
        status: "PENDENTE_TEORIA", // Aguarda OJT presencial
      },
      update: {
        theoryCompletedAt: new Date(),
        theoryScore: score,
        popId: pop.id,
        twiLevel: targetTwiLevel,
        status: targetStatus,
        deltaToleranceDeadline: null,
      },
    });

    const levelMessage = targetTwiLevel >= 3
      ? `Avaliação Teórica/Reciclagem concluída com ${score}%! Sua habilitação TWI Nível ${targetTwiLevel} permanece ativa e conforme para operação autônoma.`
      : `Etapa Teórica Concluída com ${score}% de assimilação! Sua habilitação avançou para Nível 1 (Aprendiz Teórico). Dirija-se ao posto para homologação prática (OJT) com o supervisor de linha.`;

    return NextResponse.json({
      approved: true,
      score,
      passportId: passport.id,
      twiLevel: targetTwiLevel,
      status: targetStatus,
      message: levelMessage,
    });
  } catch (error) {
    console.error("Kiosk completion error:", error);
    return NextResponse.json({ error: "Erro ao registrar conclusão teórica." }, { status: 500 });
  }
}

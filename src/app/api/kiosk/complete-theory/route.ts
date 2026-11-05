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

    // Upsert qualification passport to Nível 1 (Aprendiz Teórico)
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
        // Se estava em reciclagem delta, limpa e reabilita
        status: "PENDENTE_TEORIA",
        twiLevel: 1,
      },
    });

    return NextResponse.json({
      approved: true,
      score,
      passportId: passport.id,
      twiLevel: 1,
      message: `Etapa Teórica Concluída com ${score}% de assimilação! Sua habilitação avançou para Nível 1 (Aprendiz Teórico). Dirija-se ao posto para homologação prática (OJT) com o supervisor de linha.`,
    });
  } catch (error) {
    console.error("Kiosk completion error:", error);
    return NextResponse.json({ error: "Erro ao registrar conclusão teórica." }, { status: 500 });
  }
}

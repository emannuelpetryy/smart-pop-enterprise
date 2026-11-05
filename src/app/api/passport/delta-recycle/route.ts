import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, assetId, popId, answerIndex } = body;

    if (!userId || !assetId || typeof answerIndex !== "number") {
      return NextResponse.json(
        { error: "Dados incompletos para validação da reciclagem delta." },
        { status: 400 }
      );
    }

    // Pergunta de fixação da alteração v2.2 (Pressão pneumática alterada para 6,2 bar)
    // Opções: 0: 5,8 bar, 1: 6,2 bar, 2: 7,0 bar
    if (answerIndex !== 1) {
      return NextResponse.json(
        { error: "Resposta incorreta. A nova especificação mandatória é 6,2 bar." },
        { status: 400 }
      );
    }

    const passport = await prisma.qualificationPassport.findFirst({
      where: {
        userId,
        assetId,
        status: "RECICLAGEM_DELTA_PENDENTE",
      },
      include: {
        user: true,
        asset: true,
        pop: true,
      },
    });

    if (!passport) {
      return NextResponse.json(
        { error: "Passaporte em reciclagem delta pendente não encontrado para este ativo." },
        { status: 404 }
      );
    }

    // Revalida a habilitação para a nova versão do POP
    const updated = await prisma.qualificationPassport.update({
      where: { id: passport.id },
      data: {
        status: "HABILITADO",
        deltaToleranceDeadline: null,
        theoryCompletedAt: new Date(),
        theoryScore: 100.0,
      },
    });

    // Registra evento de auditoria
    await prisma.rhIntegrationEvent.create({
      data: {
        eventType: "RECICLAGEM_DELTA_CONCLUIDA",
        externalEmployeeId: passport.user.registrationNumber,
        payloadJson: JSON.stringify({
          assetCode: passport.asset.code,
          popVersion: passport.pop.version,
          score: 100,
        }),
        processed: true,
        effectDescription: `Reciclagem Delta da versão ${passport.pop.version} concluída com sucesso pelo operador ${passport.user.name}. Habilitação revalidada em Zona 1.`,
      },
    });

    return NextResponse.json({
      success: true,
      passportId: updated.id,
      newStatus: "HABILITADO",
      message: `Reciclagem Delta da versão ${passport.pop.version} concluída com sucesso! Sua habilitação foi revalidada para os próximos turnos.`,
    });
  } catch (error) {
    console.error("Delta recycle error:", error);
    return NextResponse.json({ error: "Erro interno ao processar reciclagem delta." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      auditorId,
      auditorRole,
      assetId,
      operatorId,
      popId,
      complianceScore,
      deviationsFound,
      actionPlan,
    } = body;

    if (!auditorId || !assetId || !operatorId || !popId || typeof complianceScore !== "number") {
      return NextResponse.json({ error: "Dados incompletos para a auditoria LPA." }, { status: 400 });
    }

    const hasCriticalDeviation = complianceScore < 75;

    // Record audit
    const audit = await prisma.lpaAudit.create({
      data: {
        auditorId,
        auditorRole: auditorRole || "SUPERVISOR",
        assetId,
        operatorId,
        popId,
        complianceScore,
        deviationsFound: JSON.stringify(deviationsFound || []),
        actionPlan: actionPlan || (hasCriticalDeviation ? "Rebaixamento temporário para reciclagem prática OJT." : "Processo conforme."),
        downgradedToLevel1: hasCriticalDeviation,
      },
    });

    // If critical deviation, rebaixa passaporte para Nível 1 (Aprendiz Teórico)
    if (hasCriticalDeviation) {
      await prisma.qualificationPassport.updateMany({
        where: {
          userId: operatorId,
          assetId,
        },
        data: {
          twiLevel: 1,
          status: "PENDENTE_TEORIA",
        },
      });
    }

    return NextResponse.json({
      success: true,
      auditId: audit.id,
      complianceScore,
      downgradedToLevel1: hasCriticalDeviation,
      message: hasCriticalDeviation
        ? `Auditoria concluída com pontuação de ${complianceScore}%. DESVIO CRÍTICO DETECTADO: Habilitação do operador foi preventivamente rebaixada para Nível 1 até reavaliação prática.`
        : `Auditoria LPA concluída com sucesso (${complianceScore}%). Conformidade operacional mantida.`,
    });
  } catch (error) {
    console.error("LPA submission error:", error);
    return NextResponse.json({ error: "Erro ao registrar auditoria LPA." }, { status: 500 });
  }
}

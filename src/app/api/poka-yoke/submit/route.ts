import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateMesToken } from "@/lib/audit-crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assetId, operatorId, shift, checklistItems } = body;

    if (!assetId || !operatorId || !checklistItems || !Array.isArray(checklistItems)) {
      return NextResponse.json(
        { error: "Dados inválidos para o checklist de pré-uso." },
        { status: 400 }
      );
    }

    // Verify operator has active Nível 3+ qualification for this machine
    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
      include: {
        passports: {
          where: { assetId, status: "HABILITADO" },
        },
      },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operador não cadastrado." }, { status: 404 });
    }

    // Safety lock: Verify employee is legally active (not on medical leave, fired, or on vacation)
    if (operator.status !== "ATIVO") {
      const statusLabels: Record<string, string> = {
        AFASTADO_MEDICO: "Colaborador com afastamento médico legal ativo (eSocial S-2230).",
        DESLIGADO: "Colaborador com rescisão contratual processada (eSocial S-2299).",
        FERIAS: "Colaborador em período de férias regulamentares.",
      };
      return NextResponse.json(
        {
          error: `BLOQUEIO DE SEGURANÇA NR-01/NR-12: ${statusLabels[operator.status] || "Colaborador inativo"}. Proibido acionamento ou liberação de máquinas industriais.`,
        },
        { status: 403 }
      );
    }

    const hasAutonomousAccess = operator.passports.some((p) => p.twiLevel >= 3);
    if (!hasAutonomousAccess && operator.role !== "SUPERVISOR") {
      return NextResponse.json(
        {
          error: "OPERADOR NÃO HABILITADO: Apenas operadores Nível 3 ou supervisores podem liberar a máquina.",
        },
        { status: 403 }
      );
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: "Ativo não encontrado." }, { status: 404 });
    }

    // Check that all mandatory safety items are checked
    const allApproved = checklistItems.every((item: { checked: boolean }) => item.checked === true);

    if (!allApproved) {
      // Record failed checklist
      await prisma.pokaYokePreUseChecklist.create({
        data: {
          assetId,
          operatorId,
          shift: shift || "TURNO_1",
          checklistData: JSON.stringify(checklistItems),
          allApproved: false,
        },
      });

      return NextResponse.json({
        success: false,
        mesStatus: "BLOQUEADA",
        message: "POKA-YOKE ATIVO: Não foi possível liberar o equipamento pois itens mandatórios de segurança falharam.",
      });
    }

    // Generate cryptographic MES unlock token
    const { token, expiresAt } = generateMesToken(asset.code, operator.badgeNumber);

    // Save successful checklist
    await prisma.pokaYokePreUseChecklist.create({
      data: {
        assetId,
        operatorId,
        shift: shift || "TURNO_1",
        checklistData: JSON.stringify(checklistItems),
        allApproved: true,
        mesUnlockToken: token,
        tokenValidUntil: expiresAt,
      },
    });

    // Update asset MES status to LIBERADA
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        currentMesStatus: "LIBERADA",
        activeUnlockToken: token,
        tokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      mesStatus: "LIBERADA",
      unlockToken: token,
      tokenExpiresAt: expiresAt.toISOString(),
      message: `Equipamento ${asset.name} (${asset.code}) liberado para produção durante o ${shift || "Turno 1"}. Ordem de Produção habilitada no MES.`,
    });
  } catch (error) {
    console.error("Poka-yoke error:", error);
    return NextResponse.json({ error: "Erro ao processar checklist pré-uso." }, { status: 500 });
  }
}

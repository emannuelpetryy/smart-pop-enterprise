import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, externalEmployeeId, payload } = body;

    if (!eventType || !externalEmployeeId) {
      return NextResponse.json(
        { error: "eventType e externalEmployeeId são obrigatórios." },
        { status: 400 }
      );
    }

    let effectDescription = "";

    // 1. Evento S-2200 (Admissão)
    if (eventType === "S2200_ADMISSAO") {
      const { name, email, department, plant, role, targetAssetCode } = payload || {};
      const reg = externalEmployeeId;
      const badge = `RFID-${Math.floor(100000 + Math.random() * 900000)}`;

      const user = await prisma.user.upsert({
        where: { registrationNumber: reg },
        create: {
          registrationNumber: reg,
          badgeNumber: badge,
          name: name || "Novo Colaborador",
          email: email || `${reg.toLowerCase()}@empresa.com`,
          role: role || "OPERADOR",
          department: department || "Estamparia Pesada",
          plant: plant || "Planta Principal",
          status: "ATIVO",
          zone0Access: true, // Entrada legal garantida CLT Art. 4º
          totpSecret: "JBSWY3DPEHPK3PXP",
          pinCode: reg.slice(-4) || "1234",
        },
        update: {
          status: "ATIVO",
          zone0Access: true,
        },
      });

      // Atribui automaticamente o POP padrão da área
      const asset = await prisma.asset.findFirst({
        where: targetAssetCode ? { code: targetAssetCode } : {},
        include: { pops: true },
      });

      if (asset && asset.pops.length > 0) {
        await prisma.qualificationPassport.upsert({
          where: {
            userId_assetId_subActivity: {
              userId: user.id,
              assetId: asset.id,
              subActivity: "OPERACAO_CONTINUA",
            },
          },
          create: {
            userId: user.id,
            assetId: asset.id,
            subActivity: "OPERACAO_CONTINUA",
            popId: asset.pops[0].id,
            twiLevel: 1, // Nível 1 - Aprendiz Teórico
            status: "PENDENTE_TEORIA",
          },
          update: {
            status: "PENDENTE_TEORIA",
          },
        });
      }

      effectDescription = `Colaborador ${user.name} admitido. Acesso Zona 0 liberado para cumprimento de jornada e trilha obrigatória vinculada.`;
    }

    // 2. Evento S-2206 (Transferência / Promoção de Posto)
    else if (eventType === "S2206_TRANSFERENCIA") {
      const { newDepartment, newAssetCode } = payload || {};
      const user = await prisma.user.findUnique({
        where: { registrationNumber: externalEmployeeId },
      });

      if (!user) {
        return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
      }

      // Revoga passaportes da linha anterior
      await prisma.qualificationPassport.updateMany({
        where: { userId: user.id },
        data: { status: "REVOGADO" },
      });

      // Aloca novo ativo se fornecido
      if (newAssetCode) {
        const asset = await prisma.asset.findUnique({
          where: { code: newAssetCode },
          include: { pops: true },
        });

        if (asset && asset.pops.length > 0) {
          await prisma.qualificationPassport.upsert({
            where: {
              userId_assetId_subActivity: {
                userId: user.id,
                assetId: asset.id,
                subActivity: "OPERACAO_CONTINUA",
              },
            },
            create: {
              userId: user.id,
              assetId: asset.id,
              subActivity: "OPERACAO_CONTINUA",
              popId: asset.pops[0].id,
              twiLevel: 1,
              status: "PENDENTE_TEORIA",
            },
            update: {
              assetId: asset.id,
              popId: asset.pops[0].id,
              twiLevel: 1,
              status: "PENDENTE_TEORIA",
            },
          });
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { department: newDepartment || user.department },
      });

      effectDescription = `Transferência efetuada. Habilitações anteriores revogadas e nova trilha atribuída para o posto ${newAssetCode || "novo"}.`;
    }

    // 3. Evento S-2230 (Afastamento Médico / Suspensão)
    else if (eventType === "S2230_AFASTAMENTO") {
      const user = await prisma.user.update({
        where: { registrationNumber: externalEmployeeId },
        data: { status: "AFASTADO_MEDICO" },
      });

      effectDescription = `Afastamento legal S-2230 registrado para ${user.name}. Bloqueio instantâneo do torniquete de chão de fábrica (Zona 1). Zona 0 mantida para perícia médica/RH.`;
    }

    // 4. Evento S-2299 (Desligamento / Rescisão)
    else if (eventType === "S2299_DESLIGAMENTO") {
      const user = await prisma.user.update({
        where: { registrationNumber: externalEmployeeId },
        data: {
          status: "DESLIGADO",
          zone0Access: false,
        },
      });

      await prisma.qualificationPassport.updateMany({
        where: { userId: user.id },
        data: { status: "REVOGADO" },
      });

      effectDescription = `Rescisão S-2299 processada para ${user.name}. Inativação imediata em 100% das catracas físicas e do passaporte digital.`;
    } else {
      effectDescription = `Evento ${eventType} registrado sem ação automática específica.`;
    }

    // Registra na auditoria de eventos
    await prisma.rhIntegrationEvent.create({
      data: {
        eventType,
        externalEmployeeId,
        payloadJson: JSON.stringify(payload || {}),
        processed: true,
        effectDescription,
      },
    });

    return NextResponse.json({
      success: true,
      eventType,
      effectDescription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("RH Webhook error:", error);
    return NextResponse.json({ error: "Erro ao processar evento de RH." }, { status: 500 });
  }
}

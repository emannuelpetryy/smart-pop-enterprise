import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOjtAuditHash } from "@/lib/audit-crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      operatorId,
      supervisorId,
      assetId,
      popId,
      subActivity,
      safetyPointsValidated,
      evidencePhotoBase64,
      supervisorSignature,
      operatorSignature,
      verdict,
      feedbackNotes,
    } = body;

    if (!operatorId || !supervisorId || !assetId || !popId || !subActivity || !verdict) {
      return NextResponse.json(
        { error: "Todos os campos mandatórios da homologação devem ser preenchidos." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const safetyPointsString = typeof safetyPointsValidated === "string" 
      ? safetyPointsValidated 
      : JSON.stringify(safetyPointsValidated);

    // Cryptographic audit hash for legal compliance (NR-01 and CLT)
    const cryptoHash = generateOjtAuditHash({
      operatorId,
      supervisorId,
      assetId,
      popId,
      subActivity,
      timestamp,
      safetyPointsValidated: safetyPointsString,
    });

    // 1. Create OJT record
    const ojtRecord = await prisma.ojtSignOffRecord.create({
      data: {
        userId: operatorId,
        supervisorId,
        assetId,
        popId,
        subActivity,
        safetyPointsValidated: safetyPointsString,
        evidencePhotoBase64: evidencePhotoBase64 || null,
        supervisorSignature: supervisorSignature || `Assinado por Supervisor #${supervisorId}`,
        operatorSignature: operatorSignature || `Assinado por Operador #${operatorId}`,
        cryptographicTimestamp: `sha256-${cryptoHash}`,
        verdict,
        feedbackNotes: feedbackNotes || "Homologação em posto realizada com sucesso.",
      },
    });

    // 2. If approved, promote qualification passport to Nível 3 (Autônomo Habilitado)
    if (verdict === "APROVADO") {
      await prisma.qualificationPassport.upsert({
        where: {
          userId_assetId_subActivity: {
            userId: operatorId,
            assetId,
            subActivity,
          },
        },
        create: {
          userId: operatorId,
          assetId,
          subActivity,
          popId,
          twiLevel: 3,
          theoryCompletedAt: new Date(),
          theoryScore: 100.0,
          ojtApprovedAt: new Date(),
          ojtSupervisorId: supervisorId,
          ojtEvidencePhotoUrl: evidencePhotoBase64 ? "data:image/stored" : null,
          ojtSignatureHash: `sha256-${cryptoHash}`,
          status: "HABILITADO",
          expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year periodic renewal
        },
        update: {
          twiLevel: 3,
          ojtApprovedAt: new Date(),
          ojtSupervisorId: supervisorId,
          ojtSignatureHash: `sha256-${cryptoHash}`,
          status: "HABILITADO",
          expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
        },
      });
    } else {
      // Reprovado - Define / Mantém Nível 2 (Regime de Tutela / Shadowing obrigatório com Padrinho)
      await prisma.qualificationPassport.upsert({
        where: {
          userId_assetId_subActivity: {
            userId: operatorId,
            assetId,
            subActivity,
          },
        },
        create: {
          userId: operatorId,
          assetId,
          subActivity,
          popId,
          twiLevel: 2,
          theoryCompletedAt: new Date(),
          theoryScore: 80.0,
          status: "PENDENTE_TEORIA",
        },
        update: {
          twiLevel: 2,
          ojtSupervisorId: supervisorId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      ojtRecordId: ojtRecord.id,
      verdict,
      cryptographicHash: `sha256-${cryptoHash}`,
      timestamp,
    });
  } catch (error) {
    console.error("OJT submission error:", error);
    return NextResponse.json({ error: "Erro ao registrar homologação OJT." }, { status: 500 });
  }
}

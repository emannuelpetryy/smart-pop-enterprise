import { NextRequest, NextResponse } from "next/server";
import { evaluateGateAccess } from "@/lib/gate-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { badgeNumber, registrationNumber, userId, qrPayload, totpCode, zone, assetCode, subActivity } = body;

    if (!zone) {
      return NextResponse.json({ error: "Parâmetro 'zone' é obrigatório." }, { status: 400 });
    }

    const result = await evaluateGateAccess({
      badgeNumber,
      registrationNumber,
      userId,
      qrPayload,
      totpCode,
      zone: zone as "ZONA_0_PORTARIA" | "ZONA_1_CHAO_DE_FABRICA",
      assetCode,
      subActivity,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Turnstile check error:", error);
    return NextResponse.json(
      { error: "Erro interno no gateway de catracas." },
      { status: 500 }
    );
  }
}

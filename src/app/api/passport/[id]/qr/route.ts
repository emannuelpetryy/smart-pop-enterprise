import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createDynamicQrPayload } from "@/lib/totp";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find user by id or registration number
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { registrationNumber: id }],
      },
      include: {
        passports: {
          include: {
            asset: true,
            pop: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    const { payloadString, code, remainingSeconds } = createDynamicQrPayload(
      user.id,
      user.registrationNumber,
      user.totpSecret
    );

    // Generate high contrast industrial QR code (Apple HIG / anti-slop: crisp black & white, no weird colors)
    const qrDataUrl = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      qrCodeImage: qrDataUrl,
      totpCode: code,
      remainingSeconds,
      timestamp: Date.now(),
      user: {
        id: user.id,
        name: user.name,
        registrationNumber: user.registrationNumber,
        badgeNumber: user.badgeNumber,
        role: user.role,
        department: user.department,
        status: user.status,
      },
      activePassportsCount: user.passports.filter((p) => p.status === "HABILITADO").length,
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return NextResponse.json({ error: "Erro ao gerar QR Code dinâmico." }, { status: 500 });
  }
}

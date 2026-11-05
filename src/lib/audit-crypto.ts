import crypto from "crypto";

export function generateOjtAuditHash(data: {
  operatorId: string;
  supervisorId: string;
  assetId: string;
  popId: string;
  subActivity: string;
  timestamp: string;
  safetyPointsValidated: string;
}): string {
  const secret = process.env.SMART_POP_SYSTEM_SECRET || "enterprise_industrial_secret_key_smart_pop_2026";
  const content = `${data.operatorId}|${data.supervisorId}|${data.assetId}|${data.popId}|${data.subActivity}|${data.timestamp}|${data.safetyPointsValidated}`;
  return crypto.createHmac("sha256", secret).update(content).digest("hex");
}

export function generateMesToken(assetCode: string, operatorBadge: string): {
  token: string;
  expiresAt: Date;
} {
  const secret = process.env.SMART_POP_SYSTEM_SECRET || "enterprise_industrial_secret_key_smart_pop_2026";
  const now = Date.now();
  const expiresAt = new Date(now + 8 * 3600 * 1000); // 8-hour shift
  const raw = `${assetCode}:${operatorBadge}:${now}:${expiresAt.getTime()}`;
  const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex").substring(0, 12).toUpperCase();
  const token = `MES-AUTH-${assetCode}-${signature}`;
  return { token, expiresAt };
}

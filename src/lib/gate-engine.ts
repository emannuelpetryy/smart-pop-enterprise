import prisma from "./prisma";

export interface GateDecisionResult {
  accessGranted: boolean;
  decisionReason: string;
  statusCode: "GRANTED" | "BLOCKED_LEGAL" | "BLOCKED_TRAINING" | "BLOCKED_HEALTH" | "BLOCKED_DELTA_EXPIRED" | "GRANTED_WITH_WARNING";
  zone: string;
  employeeName: string;
  registrationNumber: string;
  latencyMs: number;
  details?: {
    twiLevel?: number;
    subActivity?: string;
    targetAsset?: string;
    instructions?: string;
  };
}

export async function evaluateGateAccess(params: {
  userId?: string;
  badgeNumber?: string;
  registrationNumber?: string;
  zone: "ZONA_0_PORTARIA" | "ZONA_1_CHAO_DE_FABRICA";
  assetCode?: string;
  subActivity?: string;
}): Promise<GateDecisionResult> {
  const startTime = performance.now();

  // Find user by id, badge or registration
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        params.userId ? { id: params.userId } : {},
        params.badgeNumber ? { badgeNumber: params.badgeNumber } : {},
        params.registrationNumber ? { registrationNumber: params.registrationNumber } : {},
      ],
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
    const latency = Math.round(performance.now() - startTime);
    return {
      accessGranted: false,
      decisionReason: "CRACHÁ_OU_MATRICULA_INEXISTENTE_NO_CADASTRO",
      statusCode: "BLOCKED_LEGAL",
      zone: params.zone,
      employeeName: "Desconhecido",
      registrationNumber: params.registrationNumber || "N/A",
      latencyMs: latency,
    };
  }

  // --- REGRA ZONA 0: PORTARIA EXTERNA (BLINDAGEM JURÍDICA CLT ART. 4º) ---
  if (params.zone === "ZONA_0_PORTARIA") {
    const latency = Math.round(performance.now() - startTime);

    if (user.status === "DESLIGADO") {
      await logAccess(user.id, params.zone, false, "COLABORADOR_DESLIGADO_S2299", latency);
      return {
        accessGranted: false,
        decisionReason: "ACESSO RECUSADO: Colaborador com rescisão contratual processada (Evento eSocial S-2299).",
        statusCode: "BLOCKED_LEGAL",
        zone: params.zone,
        employeeName: user.name,
        registrationNumber: user.registrationNumber,
        latencyMs: latency,
      };
    }

    // Na Zona 0, mesmo recém-admitidos sem treinamento entram para bater ponto legalmente
    const reason = user.status === "AFASTADO_MEDICO"
      ? "ACESSO LIBERADO: Ponto ambulatorial / comparecimento de saúde (Afastamento S-2230 ativo)."
      : "ACESSO LIBERADO: Ponto eletrônico registrado. Jornada de trabalho iniciada nos termos da CLT.";

    await logAccess(user.id, params.zone, true, reason, latency);

    return {
      accessGranted: true,
      decisionReason: reason,
      statusCode: "GRANTED",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
    };
  }

  // --- REGRA ZONA 1: CHÃO DE FÁBRICA / ÁREA DE RISCO (HARD GATE) ---
  // 1. Verificação de Saúde e Vínculo Legal
  if (user.status === "DESLIGADO") {
    const latency = Math.round(performance.now() - startTime);
    await logAccess(user.id, params.zone, false, "BLOQUEIO_ZONA1_DESLIGAMENTO", latency);
    return {
      accessGranted: false,
      decisionReason: "BLOQUEIO RÍGIDO: Colaborador desligado da empresa.",
      statusCode: "BLOCKED_LEGAL",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
    };
  }

  if (user.status === "AFASTADO_MEDICO") {
    const latency = Math.round(performance.now() - startTime);
    await logAccess(user.id, params.zone, false, "BLOQUEIO_ZONA1_AFASTAMENTO_MEDICO", latency);
    return {
      accessGranted: false,
      decisionReason: "BLOQUEIO RÍGIDO NR-01: Colaborador com afastamento médico legal ativo (eSocial S-2230). Proibida permanência em área produtiva de risco.",
      statusCode: "BLOCKED_HEALTH",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
    };
  }

  if (user.status === "FERIAS") {
    const latency = Math.round(performance.now() - startTime);
    await logAccess(user.id, params.zone, false, "BLOQUEIO_ZONA1_FERIAS", latency);
    return {
      accessGranted: false,
      decisionReason: "BLOQUEIO RÍGIDO: Colaborador em período de férias regulamentares.",
      statusCode: "BLOCKED_LEGAL",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
    };
  }

  // 2. Verificação de Habilitação Operacional na Matriz 3D
  // Se especificado assetCode, busca o passaporte exato para o ativo
  const targetAssetCode = params.assetCode || "PRE-400T-01"; // Default para a principal linha de prensa
  const targetSubActivity = params.subActivity || "OPERACAO_CONTINUA";

  const passport = user.passports.find(
    (p) => p.asset.code === targetAssetCode && p.subActivity === targetSubActivity
  );

  const latency = Math.round(performance.now() - startTime);

  if (!passport) {
    const reason = `BLOQUEIO DE LINHA: Nenhuma habilitação cadastrada para o ativo [${targetAssetCode}] na sub-atividade [${targetSubActivity}].`;
    await logAccess(user.id, params.zone, false, reason, latency);
    return {
      accessGranted: false,
      decisionReason: reason,
      statusCode: "BLOCKED_TRAINING",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
      details: {
        targetAsset: targetAssetCode,
        instructions: "Compareça à Engenharia de Processos ou Sala de Integração para inclusão na trilha.",
      },
    };
  }

  // Verificar Reciclagem Delta Vencida
  if (passport.status === "RECICLAGEM_DELTA_PENDENTE") {
    const isToleranceExceeded =
      passport.deltaToleranceDeadline && new Date() > passport.deltaToleranceDeadline;

    if (isToleranceExceeded) {
      const reason = `BLOQUEIO DE RECICLAGEM: Tolerância de reciclagem expirada para a nova versão (${passport.pop.version}).`;
      await logAccess(user.id, params.zone, false, reason, latency);
      return {
        accessGranted: false,
        decisionReason: reason,
        statusCode: "BLOCKED_DELTA_EXPIRED",
        zone: params.zone,
        employeeName: user.name,
        registrationNumber: user.registrationNumber,
        latencyMs: latency,
        details: {
          twiLevel: passport.twiLevel,
          targetAsset: targetAssetCode,
          instructions: "Acesse o tablet ou quiosque da sala de capacitação para responder o micro-quiz de fixação da alteração (30 segundos).",
        },
      };
    } else {
      const reason = `ACESSO LIBERADO COM AVISO: Reciclagem delta pendente (${passport.pop.version}), dentro da janela de tolerância de 48h.`;
      await logAccess(user.id, params.zone, true, reason, latency);
      return {
        accessGranted: true,
        decisionReason: reason,
        statusCode: "GRANTED_WITH_WARNING",
        zone: params.zone,
        employeeName: user.name,
        registrationNumber: user.registrationNumber,
        latencyMs: latency,
        details: {
          twiLevel: passport.twiLevel,
          targetAsset: targetAssetCode,
          instructions: "Lembre-se de realizar a reciclagem delta até o fim do próximo turno.",
        },
      };
    }
  }

  // Verificar Níveis TWI
  if (passport.twiLevel >= 3) {
    // Nível 3 (Autônomo) ou Nível 4 (Multiplicador)
    const reason = `ACESSO LIBERADO TWI NÍVEL ${passport.twiLevel}: Operador habilitado com OJT presencial aprovado e teoria 100%.`;
    await logAccess(user.id, params.zone, true, reason, latency);
    return {
      accessGranted: true,
      decisionReason: reason,
      statusCode: "GRANTED",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
      details: {
        twiLevel: passport.twiLevel,
        targetAsset: targetAssetCode,
        subActivity: targetSubActivity,
      },
    };
  }

  if (passport.twiLevel === 2) {
    const reason = `ACESSO CONDICIONADO (TWI NÍVEL 2 - TUTELA): Permitida entrada acompanhado de padrinho Nível 4.`;
    await logAccess(user.id, params.zone, true, reason, latency);
    return {
      accessGranted: true,
      decisionReason: reason,
      statusCode: "GRANTED_WITH_WARNING",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
      details: {
        twiLevel: passport.twiLevel,
        targetAsset: targetAssetCode,
        instructions: "Operação sob regime de shadowing. Obrigatória presença do tutor.",
      },
    };
  }

  if (passport.twiLevel === 1) {
    const reason = `BLOQUEIO HARD GATE: Nível 1 (Aprendiz Teórico). Falta homologação prática de chão de fábrica (OJT Sign-Off pelo supervisor).`;
    await logAccess(user.id, params.zone, false, reason, latency);
    return {
      accessGranted: false,
      decisionReason: reason,
      statusCode: "BLOCKED_TRAINING",
      zone: params.zone,
      employeeName: user.name,
      registrationNumber: user.registrationNumber,
      latencyMs: latency,
      details: {
        twiLevel: 1,
        targetAsset: targetAssetCode,
        instructions: "Dirija-se à Sala de Acolhimento ou contate o Supervisor Carlos Mendes para realização da avaliação em bancada.",
      },
    };
  }

  // TWI 0 ou Revogado
  const reason = `BLOQUEIO DE SEGURANÇA: Habilitação não autorizada ou revogada pela Engenharia de Segurança.`;
  await logAccess(user.id, params.zone, false, reason, latency);
  return {
    accessGranted: false,
    decisionReason: reason,
    statusCode: "BLOCKED_TRAINING",
    zone: params.zone,
    employeeName: user.name,
    registrationNumber: user.registrationNumber,
    latencyMs: latency,
  };
}

async function logAccess(userId: string, zone: string, granted: boolean, reason: string, latency: number) {
  try {
    await prisma.turnstileAccessLog.create({
      data: {
        userId,
        zone,
        turnstileCode: zone === "ZONA_0_PORTARIA" ? "CATRACA-PORTARIA-01" : "TORNIQUETE-LINHA-02",
        accessGranted: granted,
        decisionReason: reason,
        latencyMs: latency || 10,
        source: "EDGE_GATEWAY_OFFLINE_CACHE",
      },
    });
  } catch (e) {
    console.error("Log access error:", e);
  }
}

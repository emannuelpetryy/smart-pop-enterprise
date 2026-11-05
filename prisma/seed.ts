import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Smart POP Enterprise database...");

  // Clean existing records
  await prisma.turnstileAccessLog.deleteMany({});
  await prisma.lpaAudit.deleteMany({});
  await prisma.pokaYokePreUseChecklist.deleteMany({});
  await prisma.ojtSignOffRecord.deleteMany({});
  await prisma.qualificationPassport.deleteMany({});
  await prisma.popDocument.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.rhIntegrationEvent.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Assets / Máquinas Industriais
  const assetPrensa = await prisma.asset.create({
    data: {
      code: "PRE-400T-01",
      name: "Prensa Excêntrica Mecânica 400 Toneladas",
      area: "Estamparia Pesada - Pavilhão 2",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      nrStandard: "NR-12",
      mesInterlock: true,
      currentMesStatus: "BLOQUEADA",
    },
  });

  const assetRobo = await prisma.asset.create({
    data: {
      code: "SOL-ROB-02",
      name: "Célula Robotizada de Solda MIG/MAG Kuka 6-Eixos",
      area: "Funilaria & Armação - Linha 03",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      nrStandard: "NR-10/NR-12",
      mesInterlock: true,
      currentMesStatus: "LIBERADA",
    },
  });

  const assetCNC = await prisma.asset.create({
    data: {
      code: "USI-CNC-05",
      name: "Centro de Usinagem CNC 5 Eixos DMG Mori",
      area: "Usinagem de Alta Precisão",
      zone: "ZONA_1_CHAO_DE_FABRICA",
      nrStandard: "NR-12",
      mesInterlock: true,
      currentMesStatus: "BLOQUEADA",
    },
  });

  // 2. POP Documents
  const popPrensa = await prisma.popDocument.create({
    data: {
      code: "POP-EST-042",
      title: "Operação e Setup Seguro de Prensa Excêntrica",
      version: "v2.2",
      category: "OPERACAO",
      summary: "Procedimento operacional padrão para inspeção prévia, acionamento bimanual e substituição de matriz de estampagem sob conformidade com a NR-12.",
      theoreticalDurationMinutes: 35,
      targetAssetId: assetPrensa.id,
      stepsContent: JSON.stringify([
        {
          stepNumber: 1,
          title: "Inspeção Visual e Teste de Cortina de Luz",
          instruction: "Com a chave mestra em modo de teste, introduza a haste de teste no feixe óptico da cortina de luz e verifique a parada instantânea do martelo em menos de 150ms.",
          criticalPoint: "Nunca opere a prensa se o led de falha óptica estiver aceso.",
          standardPhoto: "/images/step1-light-curtain.png"
        },
        {
          stepNumber: 2,
          title: "Conferência do Nível Hidráulico e Pressão de Ar",
          instruction: "Checar manômetro pneumático do freio-embreagem. Pressão mínima mandatória de 6,2 bar.",
          criticalPoint: "Pressões abaixo de 6 bar causam escorregamento do freio e risco severo de esmagamento.",
          standardPhoto: "/images/step2-pressure-check.png"
        },
        {
          stepNumber: 3,
          title: "Posicionamento da Chapa e Acionamento Bimanual",
          instruction: "Inserir o blank com pinça magnética anti-impacto. Pressionar ambos os botões bimanuais simultaneamente (sincronismo < 0,5s).",
          criticalPoint: "Manter as mãos fora da área de prensagem em todo o curso do martelo.",
          standardPhoto: "/images/step3-bimanual-cycle.png"
        }
      ]),
      safetyPoints: JSON.stringify([
        "Uso obrigatório de Protetor Auricular tipo Concha (NR-15)",
        "Óculos de proteção com vedação lateral anti-estilhaço",
        "Calçado de segurança com biqueira de composite",
        "Inspeção obrigatória da válvula de retenção de segurança antes da partida"
      ]),
      quizQuestions: JSON.stringify([
        {
          id: "q1",
          question: "Qual é a tolerância máxima de sincronismo entre os botões do comando bimanual?",
          options: ["0,5 segundos", "2,0 segundos", "5,0 segundos", "Não há tolerância"],
          correctIndex: 0
        },
        {
          id: "q2",
          question: "Em caso de falha intermitente na cortina de luz, qual a conduta imediata?",
          options: [
            "Continuar operando com atenção redobrada",
            "Paralisar a máquina, acionar o botão de emergência e notificar a manutenção",
            "Ajustar a sensibilidade do sensor por conta própria",
            "Aguardar o final do turno"
          ],
          correctIndex: 1
        },
        {
          id: "q3",
          question: "Qual a pressão mínima no manômetro pneumático para liberação segura do freio?",
          options: ["3,5 bar", "4,8 bar", "6,2 bar", "8,0 bar"],
          correctIndex: 2
        }
      ]),
      deltaChanges: JSON.stringify({
        previousVersion: "v2.1",
        updatedVersion: "v2.2",
        changeSummary: "Revisão do limiar de pressão pneumática de 5,8 bar para 6,2 bar conforme aditivo de engenharia do fabricante e inclusão do teste diário da haste de cortina de luz.",
        microQuiz: {
          question: "Qual foi a nova pressão mínima de freio estabelecida na revisão v2.2?",
          options: ["5,8 bar", "6,2 bar", "7,0 bar"],
          correctIndex: 1
        }
      }),
      status: "PUBLICADO",
    },
  });

  const popSolda = await prisma.popDocument.create({
    data: {
      code: "POP-SOL-018",
      title: "Parâmetros e Segurança em Célula de Solda Robotizada",
      version: "v1.4",
      category: "OPERACAO",
      summary: "Calibração de bico de solda, troca de carretel de arame e segurança perimetral com intertravamento de portas.",
      theoreticalDurationMinutes: 25,
      targetAssetId: assetRobo.id,
      stepsContent: JSON.stringify([
        {
          stepNumber: 1,
          title: "Checagem do Fechamento das Barreiras Físicas",
          instruction: "Garantir que as portas com chave de segurança codificada Schmersal estejam travadas.",
          criticalPoint: "Proibido bypass em microchaves.",
        }
      ]),
      safetyPoints: JSON.stringify([
        "Máscara com filtro para fumos metálicos",
        "Avental de raspa para reposição de arame",
        "Bloqueio de chave mestra LOTO durante manutenção"
      ]),
      quizQuestions: JSON.stringify([
        {
          id: "qs1",
          question: "Qual é a distância mínima de segurança da célula robótica em ciclo?",
          options: ["1 metro", "Perímetro externo delimitado pela cerca física", "20 centímetros", "Qualquer distância"],
          correctIndex: 1
        }
      ]),
      status: "PUBLICADO"
    }
  });

  // 3. Usuários / Colaboradores
  // Operador Nível 3 (Pleno Autônomo)
  const userRoberto = await prisma.user.create({
    data: {
      registrationNumber: "OP-10492",
      badgeNumber: "RFID-881920",
      name: "Roberto Silva",
      email: "roberto.silva@industria-smart.com",
      role: "OPERADOR",
      department: "Estamparia Pesada",
      plant: "Planta São Bernardo - SP",
      status: "ATIVO",
      zone0Access: true,
      totpSecret: "JBSWY3DPEHPK3PXP",
      pinCode: "1049",
    },
  });

  // Operadora Nível 1 (Aprendiz Teórico - recém admitida, na sala de integração / quiosque)
  const userMariana = await prisma.user.create({
    data: {
      registrationNumber: "OP-20831",
      badgeNumber: "RFID-449102",
      name: "Mariana Costa",
      email: "mariana.costa@industria-smart.com",
      role: "OPERADOR",
      department: "Estamparia Pesada",
      plant: "Planta São Bernardo - SP",
      status: "ATIVO",
      zone0Access: true,
      totpSecret: "HXDMVJECJJWSRZ3U",
      pinCode: "2083",
    },
  });

  // Supervisor de Chão de Fábrica Nível 4 (Multiplicador e Auditor)
  const userSupervisor = await prisma.user.create({
    data: {
      registrationNumber: "SP-30119",
      badgeNumber: "RFID-990142",
      name: "Carlos Mendes",
      email: "carlos.mendes@industria-smart.com",
      role: "SUPERVISOR",
      department: "Estamparia e Montagem",
      plant: "Planta São Bernardo - SP",
      status: "ATIVO",
      zone0Access: true,
      totpSecret: "GEZDGNBVGY3TQOJQ",
      pinCode: "3011",
    },
  });

  // Operador em Tutela Nível 2
  const userLucas = await prisma.user.create({
    data: {
      registrationNumber: "OP-40912",
      badgeNumber: "RFID-771890",
      name: "Lucas Rocha",
      email: "lucas.rocha@industria-smart.com",
      role: "OPERADOR",
      department: "Estamparia Pesada",
      plant: "Planta São Bernardo - SP",
      status: "ATIVO",
      zone0Access: true,
      totpSecret: "MFRGGZDFMZTWQ2LK",
      pinCode: "4091",
    },
  });

  // Colaboradora Afastada Médica (S-2230)
  const userJulia = await prisma.user.create({
    data: {
      registrationNumber: "OP-50873",
      badgeNumber: "RFID-112344",
      name: "Julia Antunes",
      email: "julia.antunes@industria-smart.com",
      role: "OPERADOR",
      department: "Soldagem Robotizada",
      plant: "Planta São Bernardo - SP",
      status: "AFASTADO_MEDICO",
      zone0Access: true, // Pode entrar na portaria para perícia/RH
      totpSecret: "O5XW45DFOZXWIZLS",
      pinCode: "5087",
    },
  });

  // Operador com Reciclagem Delta Pendente
  const userValdir = await prisma.user.create({
    data: {
      registrationNumber: "OP-60124",
      badgeNumber: "RFID-334589",
      name: "Valdir Souza",
      email: "valdir.souza@industria-smart.com",
      role: "OPERADOR",
      department: "Estamparia Pesada",
      plant: "Planta São Bernardo - SP",
      status: "ATIVO",
      zone0Access: true,
      totpSecret: "NRUWEZLTOBQXIZJA",
      pinCode: "6012",
    },
  });

  // 4. Passaportes Operacionais (Matriz 3D)
  // Roberto Silva: Nível 3 (Operação Contínua) na Prensa
  await prisma.qualificationPassport.create({
    data: {
      userId: userRoberto.id,
      assetId: assetPrensa.id,
      subActivity: "OPERACAO_CONTINUA",
      twiLevel: 3,
      popId: popPrensa.id,
      theoryCompletedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      theoryScore: 100.0,
      ojtApprovedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000),
      ojtSupervisorId: userSupervisor.id,
      ojtEvidencePhotoUrl: "/evidence/sample-ojt-roberto.jpg",
      ojtSignatureHash: "sha256-a8f4c2e9d3b1e7f6c4b2a19830291abc90",
      status: "HABILITADO",
      expiresAt: new Date(Date.now() + 335 * 24 * 3600 * 1000),
    },
  });

  // Roberto Silva: Nível 2 (Setup de Estampo) na Prensa (Ainda sob Tutela)
  await prisma.qualificationPassport.create({
    data: {
      userId: userRoberto.id,
      assetId: assetPrensa.id,
      subActivity: "SETUP_ESTAMPO",
      twiLevel: 2,
      popId: popPrensa.id,
      theoryCompletedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      theoryScore: 90.0,
      status: "EM_TUTELA",
    },
  });

  // Roberto Silva: Nível 0 (Manutenção Preventiva) - Bloqueado
  await prisma.qualificationPassport.create({
    data: {
      userId: userRoberto.id,
      assetId: assetPrensa.id,
      subActivity: "MANUTENCAO_PREVENTIVA",
      twiLevel: 0,
      popId: popPrensa.id,
      status: "REVOGADO",
    },
  });

  // Mariana Costa: Nível 1 (Aprendiz Teórico) - Concluiu teoria na sala de integração, aguardando OJT prático
  await prisma.qualificationPassport.create({
    data: {
      userId: userMariana.id,
      assetId: assetPrensa.id,
      subActivity: "OPERACAO_CONTINUA",
      twiLevel: 1,
      popId: popPrensa.id,
      theoryCompletedAt: new Date(Date.now() - 2 * 3600 * 1000),
      theoryScore: 95.0,
      status: "PENDENTE_TEORIA",
    },
  });

  // Carlos Mendes (Supervisor): Nível 4 (Multiplicador / Auditor)
  await prisma.qualificationPassport.create({
    data: {
      userId: userSupervisor.id,
      assetId: assetPrensa.id,
      subActivity: "OPERACAO_CONTINUA",
      twiLevel: 4,
      popId: popPrensa.id,
      theoryCompletedAt: new Date(Date.now() - 180 * 24 * 3600 * 1000),
      theoryScore: 100.0,
      ojtApprovedAt: new Date(Date.now() - 175 * 24 * 3600 * 1000),
      status: "HABILITADO",
    },
  });

  // Valdir Souza: Reciclagem Delta Pendente (POP v2.1 -> v2.2)
  await prisma.qualificationPassport.create({
    data: {
      userId: userValdir.id,
      assetId: assetPrensa.id,
      subActivity: "OPERACAO_CONTINUA",
      twiLevel: 3,
      popId: popPrensa.id,
      theoryCompletedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000),
      theoryScore: 90.0,
      ojtApprovedAt: new Date(Date.now() - 85 * 24 * 3600 * 1000),
      status: "RECICLAGEM_DELTA_PENDENTE",
      deltaToleranceDeadline: new Date(Date.now() + 2 * 24 * 3600 * 1000), // 2 dias restantes de tolerância
    },
  });

  // 5. OJT Sign-off Record
  await prisma.ojtSignOffRecord.create({
    data: {
      userId: userRoberto.id,
      supervisorId: userSupervisor.id,
      assetId: assetPrensa.id,
      popId: popPrensa.id,
      subActivity: "OPERACAO_CONTINUA",
      safetyPointsValidated: JSON.stringify([
        { item: "Checagem de bimanual sincronizado", approved: true },
        { item: "Uso correto de pinça magnética anti-esmagamento", approved: true },
        { item: "Conferência visual de EPI auricular e botina", approved: true },
        { item: "Teste prático da parada de emergência no martelo", approved: true },
      ]),
      evidencePhotoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      supervisorSignature: "Assinado digitalmente por Carlos Mendes (Registro Eng. CREA-SP 90210)",
      operatorSignature: "Assinado por Roberto Silva (Matrícula OP-10492)",
      cryptographicTimestamp: "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      verdict: "APROVADO",
      feedbackNotes: "Operador demonstrou perfeito domínio da postura ergonômica e atenção rigorosa ao ciclo do bimanual. Apto à operação autônoma Nível 3.",
    },
  });

  // 6. Poka-Yoke Checklist Pré-Uso de Linha
  await prisma.pokaYokePreUseChecklist.create({
    data: {
      assetId: assetPrensa.id,
      operatorId: userRoberto.id,
      shift: "TURNO_1",
      checklistData: JSON.stringify([
        { id: "chk_oil", label: "Nível de óleo lubrificante da caixa de engrenagens no nível verde", checked: true },
        { id: "chk_air", label: "Pressão de ar comprimido acima de 6,2 bar no manômetro", checked: true },
        { id: "chk_curtain", label: "Teste da cortina de luz com haste padronizada aprovado", checked: true },
        { id: "chk_e_stop", label: "Botão cogumelo de emergência desarmado e funcional", checked: true },
      ]),
      allApproved: true,
      mesUnlockToken: "MES-AUTH-991823-PRE400",
      tokenValidUntil: new Date(Date.now() + 8 * 3600 * 1000), // Válido por 8 horas do turno
    },
  });

  // 7. Turnstile Access Logs (Demonstração do Zone Gating)
  await prisma.turnstileAccessLog.create({
    data: {
      userId: userRoberto.id,
      zone: "ZONA_0_PORTARIA",
      turnstileCode: "CATRACA-PORTARIA-01",
      accessGranted: true,
      decisionReason: "ACESSO_CLT_LIBERADO_PONTO_INICIADO",
      latencyMs: 9,
      source: "EDGE_GATEWAY_OFFLINE_CACHE",
    },
  });

  await prisma.turnstileAccessLog.create({
    data: {
      userId: userRoberto.id,
      zone: "ZONA_1_CHAO_DE_FABRICA",
      turnstileCode: "TORNIQUETE-LINHA-02",
      accessGranted: true,
      decisionReason: "HABILITADO_NIVEL_3_OPERACAO_CONTINUA",
      latencyMs: 14,
      source: "EDGE_GATEWAY_OFFLINE_CACHE",
    },
  });

  await prisma.turnstileAccessLog.create({
    data: {
      userId: userMariana.id,
      zone: "ZONA_0_PORTARIA",
      turnstileCode: "CATRACA-PORTARIA-01",
      accessGranted: true,
      decisionReason: "ACESSO_CLT_LIBERADO_SALA_INTEGRACAO",
      latencyMs: 8,
      source: "EDGE_GATEWAY_OFFLINE_CACHE",
    },
  });

  await prisma.turnstileAccessLog.create({
    data: {
      userId: userMariana.id,
      zone: "ZONA_1_CHAO_DE_FABRICA",
      turnstileCode: "TORNIQUETE-LINHA-02",
      accessGranted: false,
      decisionReason: "BLOQUEIO_HARD_GATE_OJT_PENDENTE_COMPARECER_SALA_TREINAMENTO",
      latencyMs: 11,
      source: "EDGE_GATEWAY_OFFLINE_CACHE",
    },
  });

  // 8. Eventos de RH Mockados
  await prisma.rhIntegrationEvent.create({
    data: {
      eventType: "S2200_ADMISSAO",
      externalEmployeeId: "OP-20831",
      payloadJson: JSON.stringify({
        sourceSystem: "TOTVS Protheus",
        employeeName: "Mariana Costa",
        jobTitle: "Operador de Produção Trainee",
        admissionDate: new Date().toISOString(),
      }),
      effectDescription: "Colaborador admitido. Liberado acesso Zona 0 e atribuída trilha POP-EST-042.",
    },
  });

  await prisma.rhIntegrationEvent.create({
    data: {
      eventType: "S2230_AFASTAMENTO",
      externalEmployeeId: "OP-50873",
      payloadJson: JSON.stringify({
        sourceSystem: "Senior Vetorh",
        employeeName: "Julia Antunes",
        reason: "Licença Médica CID M54",
        startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      }),
      effectDescription: "Afastamento médico registrado. Revogada permissão de catraca na Zona 1.",
    },
  });

  console.log("✅ Database successfully seeded with Enterprise realistic data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

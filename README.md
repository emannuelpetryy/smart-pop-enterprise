# Smart POP & Operational Passport (Enterprise Platform)

> **Plataforma Enterprise de POPs Dinâmicos, Carteira Digital de Habilitações e Controle de Execução Operacional**  
> *Conformidade Legal CLT (Art. 4º), eSocial (S-2200 a S-2299) e Normas Regulamentadoras (NR-01, NR-12).*

---

## 🏛️ Os Três Pilares Implementados

### 1. Habilitação Operacional Inteligente (Passaporte Digital)
- **Matriz Tridimensional de Permissões**: Autorização granular calculada por `f(Colaborador, Ativo, Sub-Atividade)` (ex.: opera, mas não faz setup ou manutenção).
- **Escala TWI de 4 Níveis**:
  - **Nível 1 (Aprendiz Teórico)**: Concluiu a carga horária na sala de quiosque e atingiu nota mínima de 80% no quiz.
  - **Nível 2 (Operador em Tutela / Shadowing)**: Opera sob acompanhamento de padrinho Nível 4.
  - **Nível 3 (Operador Autônomo)**: Homologado presencialmente em campo pelo supervisor com foto e assinatura digital.
  - **Nível 4 (Multiplicador / Auditor)**: Apto a treinar e realizar auditorias LPA.
- **QR Code Dinâmico com TOTP**: Rotação anti-fraude a cada 30 segundos com carimbo criptográfico SHA-256 (RFC 6238).
- **Reciclagem Delta**: Quando um POP passa por revisão (ex: v2.1 para v2.2), exibe para o operador apenas o que mudou com pergunta rápida de fixação (30 segundos).

### 2. Integração Contínua com RH & Blindagem Trabalhista (Art. 4º CLT)
- **Zone Gating Físico**:
  - **Zona 0 (Portaria Externa)**: Todos os admitidos (S-2200) têm acesso liberado para registro do ponto eletrônico. Início imediato da jornada legal remunerada.
  - **Sala de Integração / Modo Quiosque**: Tablets corporativos fixos onde o colaborador cumpre a carga horária em horário pago, sem exigir smartphone pessoal (blindagem contra passivo de horas extras e tempo à disposição).
  - **Zona 1 (Chão de Fábrica / Área de Risco)**: *Hard Gate*. Catraca e torniquete barram colaboradores com treinamento teórico pendente ou sem OJT presencial do supervisor.
- **Sincronização ERP**: Eventos S-2200 (Admissão), S-2206 (Transferência), S-2230 (Afastamento Médico) e S-2299 (Desligamento imediato em todas as catracas).

### 3. Controle de Execução e Não Apenas de Treinamento
- **Homologação Presencial em Posto (OJT Sign-Off)**: Checklist prático em campo pelo supervisor com captura obrigatória de foto de evidência e assinatura digital em tela com hash criptográfico SHA-256.
- **Poka-Yoke Digital Pré-Uso**: Checklist mandatório de 30 segundos no início do turno (nível de óleo, pressão pneumática, cortina de luz, botão de emergência). Intertravamento com MES/SCADA gerando token de liberação da Ordem de Produção.
- **Auditorias Escalonadas de Processo (LPA)**: Amostragem diária do supervisor, semanal da qualidade e mensal do gerente. Rebaixamento automático para Nível 1 em caso de desvio crítico.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ (testado e homologado no Node v24)
- npm

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Banco de Dados e Carga de Dados Inicial (Seed)
O projeto conta com banco SQLite zero-configuração pronto para uso imediato em desenvolvimento e testes:
```bash
npm run db:setup
```

Para produção com **PostgreSQL** (AWS RDS, Neon, Supabase):
1. Altere o `provider = "postgresql"` no arquivo `prisma/schema.prisma` (ou utilize o modelo em `prisma/schema.postgresql.prisma`).
2. Ajuste o `.env`:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/smartpop_db?schema=public"
   ```
3. Execute `npx prisma db push`.

### 3. Execução dos Testes Automatizados
```bash
npm test
```
*Executa 23 asserções validando banco de dados, algoritmos TOTP, Zone Gating CLT (Zona 0 vs Zona 1) e hashes criptográficos.*

### 4. Execução do Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📱 Módulos e Rotas Disponíveis

- **`/`**: Dashboard Executivo com KPIs industriais em tempo real.
- **`/passport`**: Carteira Digital de Habilitações, Matriz 3D e QR Code Dinâmico TOTP.
- **`/kiosk`**: Modo Quiosque / Tablet Corporativo para Sala de Integração.
- **`/ojt-signoff`**: Homologação Prática em Campo com foto de evidência e assinatura digital do supervisor.
- **`/poka-yoke`**: Checklist Pré-Uso de Linha e Desbloqueio Lógico MES.
- **`/turnstile-gate`**: Simulador de Catraca Edge (&lt; 20ms) testando Zone Gating.
- **`/rh-lifecycle`**: Governança de RH, simulador de eventos TOTVS/Senior/SAP e Dossiê Jurídico Forense.
- **`/lpa-audits`**: Auditoria Escalonada de Processo com rebaixamento de segurança.

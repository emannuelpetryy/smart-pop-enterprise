import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Cpu, 
  DoorClosed, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Tablet,
  FileCheck2,
  Lock,
  Unlock,
  Building
} from "lucide-react";
import { formatTwiBadge } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Query platform statistics
  const [
    totalUsers,
    totalAssets,
    totalPassports,
    totalOjtRecords,
    activeTurnstilesLogs,
    users,
    assets
  ] = await Promise.all([
    prisma.user.count(),
    prisma.asset.count(),
    prisma.qualificationPassport.count({ where: { status: "HABILITADO" } }),
    prisma.ojtSignOffRecord.count(),
    prisma.turnstileAccessLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.user.findMany({
      take: 5,
      include: { passports: { include: { asset: true } } },
    }),
    prisma.asset.findMany(),
  ]);

  const lockedMachines = assets.filter((a) => a.currentMesStatus === "BLOQUEADA").length;
  const unlockedMachines = assets.filter((a) => a.currentMesStatus === "LIBERADA").length;

  return (
    <div className="space-y-8">
      {/* Hero Executive Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-industrial-50 text-industrial-700 dark:bg-industrial-950 dark:text-industrial-300 border border-industrial-200 dark:border-industrial-800">
              <ShieldCheck className="h-4 w-4 text-industrial-600" />
              <span>Conformidade Legal NR-01, NR-12 e CLT Artigo 4º</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Smart POP & Operational Passport
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Sistema corporativo de controle de execução em tempo real, passaporte de habilidades por matriz 3D (Colaborador x Máquina x Sub-atividade) e blindagem jurídica contra horas extras e acidentes graves.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <Link
              href="/passport"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-industrial-600 hover:bg-industrial-700 text-white font-medium text-sm transition-all shadow-sm"
            >
              <span>Ver Passaporte Operacional</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/turnstile-gate"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all"
            >
              <DoorClosed className="h-4 w-4" />
              <span>Testar Catraca Edge</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Industrial Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Habilitações Autônomas
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{totalPassports}</span>
            <span className="text-xs text-emerald-600 font-medium">Nível 3 e 4 TWI</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Validadas com prova prática OJT em campo</p>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Intertravamento MES
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <Sliders className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{lockedMachines}</span>
            <span className="text-xs text-amber-600 font-medium">de {totalAssets} Bloqueadas</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Exigem checklist pré-uso e crachá Nível 3</p>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Latência Catraca Edge
            </span>
            <div className="p-2 rounded-lg bg-industrial-50 dark:bg-industrial-950 text-industrial-600">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-600">9 ms</span>
            <span className="text-xs text-slate-500 font-medium">(Meta &lt; 20ms)</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">100% autônomo offline em memória flash</p>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Blindagem Jurídica CLT
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">100%</span>
            <span className="text-xs text-purple-600 font-medium">Zona 0 Segregada</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Zero treinamento em celular pessoal fora da jornada</p>
        </div>
      </div>

      {/* Os 3 Pilares Centrais do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pilar 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Habilitação Operacional Inteligente
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Matriz 3D granular por Ativo e Sub-atividade (Operação, Setup, Manutenção). QR Code Dinâmico com rotação TOTP de 30 segundos anti-fraude e gestão de reciclagem delta.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/passport"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-industrial-600 dark:text-industrial-400 hover:underline"
            >
              <span>Acessar Passaportes e QR Code</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Integração RH & Blindagem CLT
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Arquitetura de Segregação por Zonas Físicas: Portaria Externa (Zona 0) garante ponto inicial. Sala de acolhimento e quiosques corporativos eliminam passivo de hora extra no smartphone.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-industrial-600 dark:text-industrial-400 hover:underline"
            >
              <span>Abrir Modo Quiosque</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/rh-lifecycle"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:underline"
            >
              <span>Eventos RH</span>
            </Link>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Controle de Execução em Chão
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Homologação Presencial de Campo (OJT Sign-off) com foto de evidência e assinatura criptográfica. Checklists Poka-Yoke de pré-uso e Auditorias Escalonadas de Processo (LPA).
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              href="/ojt-signoff"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-industrial-600 dark:text-industrial-400 hover:underline"
            >
              <span>OJT em Campo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/poka-yoke"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:underline"
            >
              <span>Poka-Yoke Pré-Uso</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Snapshot de Colaboradores e Eventos de Acesso Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Colaboradores de Demonstração */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Colaboradores & Habilitações TWI</h2>
              <p className="text-xs text-slate-500">Matriz tridimensional ativa na fábrica</p>
            </div>
            <Link href="/passport" className="text-xs text-industrial-600 font-semibold hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {users.map((u) => {
              const primaryPassport = u.passports[0];
              const twiInfo = primaryPassport ? formatTwiBadge(primaryPassport.twiLevel) : formatTwiBadge(0);

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{u.name}</span>
                      <span className="font-mono text-[11px] text-slate-500">[{u.registrationNumber}]</span>
                      {u.status === "AFASTADO_MEDICO" && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-medium">
                          Afastado S-2230
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {u.department} • Crachá: <span className="font-mono">{u.badgeNumber}</span>
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${twiInfo.color}`}
                    >
                      {twiInfo.label.split(":")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feed de Acesso em Tempo Real (Zone Gating) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Acessos em Tempo Real (Catraca Edge)</h2>
              <p className="text-xs text-slate-500">Decisões tomadas em &lt; 20ms localmente</p>
            </div>
            <Link href="/turnstile-gate" className="text-xs text-industrial-600 font-semibold hover:underline">
              Simulador
            </Link>
          </div>

          <div className="space-y-3">
            {activeTurnstilesLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="space-y-1 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        log.accessGranted ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {log.user.name} ({log.user.registrationNumber})
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {log.zone === "ZONA_0_PORTARIA" ? "Zona 0 (Portaria)" : "Zona 1 (Linha)"}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{log.decisionReason}</p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">{log.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

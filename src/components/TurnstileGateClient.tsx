"use client";

import { useState } from "react";
import { 
  DoorClosed, 
  DoorOpen, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Zap,
  Building,
  Factory
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TurnstileProps {
  users: any[];
  assets: any[];
  initialLogs: any[];
}

export default function TurnstileGateClient({
  users,
  assets,
  initialLogs,
}: TurnstileProps) {
  const [selectedZone, setSelectedZone] = useState<"ZONA_0_PORTARIA" | "ZONA_1_CHAO_DE_FABRICA">("ZONA_1_CHAO_DE_FABRICA");
  const [selectedAssetCode, setSelectedAssetCode] = useState<string>("PRE-400T-01");
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || "");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastDecision, setLastDecision] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [pulseActive, setPulseActive] = useState<boolean>(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleSimulateBadgeSwipe = async (userIdToTest?: string) => {
    const targetUserId = userIdToTest || selectedUser.id;
    const targetUser = users.find((u) => u.id === targetUserId) || selectedUser;

    try {
      setIsEvaluating(true);
      setPulseActive(true);

      const res = await fetch("/api/turnstile/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          badgeNumber: targetUser.badgeNumber,
          registrationNumber: targetUser.registrationNumber,
          zone: selectedZone,
          assetCode: selectedAssetCode,
        }),
      });

      const data = await res.json();
      setLastDecision(data);

      // Append to local logs
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user: targetUser,
          zone: selectedZone,
          accessGranted: data.accessGranted,
          decisionReason: data.decisionReason,
          latencyMs: data.latencyMs || 9,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (e) {
      console.error(e);
      alert("Erro ao consultar Edge Gateway.");
    } finally {
      setIsEvaluating(false);
      setTimeout(() => setPulseActive(false), 800);
    }
  };

  return (
    <div className="space-y-8">
      {/* Simulation Controls: Zone & Machine Selector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Configuração da Catraca Física / Torniquete
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Zone Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">
              Selecione a Zona Física de Acesso:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedZone("ZONA_0_PORTARIA");
                  setLastDecision(null);
                }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedZone === "ZONA_0_PORTARIA"
                    ? "border-industrial-600 bg-industrial-50 text-industrial-900 dark:bg-industrial-950 dark:text-industrial-100 ring-2 ring-industrial-600"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Building className="h-4 w-4 text-industrial-600" />
                <span>Zona 0 (Portaria Externa)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedZone("ZONA_1_CHAO_DE_FABRICA");
                  setLastDecision(null);
                }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedZone === "ZONA_1_CHAO_DE_FABRICA"
                    ? "border-rose-600 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-100 ring-2 ring-rose-600"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Factory className="h-4 w-4 text-rose-600" />
                <span>Zona 1 (Chão de Fábrica)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {selectedZone === "ZONA_0_PORTARIA"
                ? "Portaria da rua: Entrada legal garantida pelo Art. 4º CLT. Bate ponto inicial de jornada."
                : "Torniquete da linha produtiva: Hard Gate. Exige Trilha Teórica 100% e OJT Aprovado pelo Supervisor."}
            </p>
          </div>

          {/* Asset/Line Selector for Zona 1 */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-2">
              Linha Fabril / Posto Alvo (para Zona 1):
            </label>
            <select
              value={selectedAssetCode}
              onChange={(e) => setSelectedAssetCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.code}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              A catraca valida a habilitação do operador especificamente para esta máquina.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Catraca Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Turnstile Unit Visual */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm flex flex-col items-center justify-between text-center space-y-6">
          <div className="flex items-center justify-between w-full text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              Edge Access Agent (Control iD / Dimep)
            </span>
            <span>OSDP / Wiegand 34-bit</span>
          </div>

          {/* Turnstile LED Ring & Arm Status */}
          <div className="relative my-4">
            <div
              className={`h-40 w-40 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                lastDecision === null
                  ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400"
                  : lastDecision.accessGranted
                  ? lastDecision.statusCode === "GRANTED_WITH_WARNING"
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 ring-8 ring-amber-100 dark:ring-amber-900/40"
                    : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 ring-8 ring-emerald-100 dark:ring-emerald-900/40"
                  : "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 ring-8 ring-rose-100 dark:ring-rose-900/40"
              }`}
            >
              {lastDecision === null ? (
                <DoorClosed className="h-16 w-16" />
              ) : lastDecision.accessGranted ? (
                <DoorOpen className="h-16 w-16 animate-in zoom-in duration-200" />
              ) : (
                <XCircle className="h-16 w-16 animate-in zoom-in duration-200" />
              )}
            </div>

            {/* Simulated Turnstile Arms */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div
                className={`h-2.5 w-16 rounded-full transition-all duration-300 ${
                  lastDecision?.accessGranted
                    ? "bg-emerald-500 rotate-45 transform"
                    : "bg-slate-400 dark:bg-slate-600"
                }`}
              />
              <div
                className={`h-2.5 w-16 rounded-full transition-all duration-300 ${
                  lastDecision?.accessGranted
                    ? "bg-emerald-500 -rotate-45 transform"
                    : "bg-slate-400 dark:bg-slate-600"
                }`}
              />
            </div>
          </div>

          {/* Decision Verdict Display */}
          <div className="space-y-1 w-full">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {lastDecision === null
                ? "Aproxime o Crachá RFID ou QR Code"
                : lastDecision.accessGranted
                ? "PASSAGEM LIBERADA (TORNIQUETE DESTRANCADO)"
                : "ACESSO RECUSADO (BLOQUEIO RÍGIDO DE CATRACA)"}
            </h4>

            {lastDecision && (
              <p
                className={`text-xs max-w-md mx-auto leading-relaxed ${
                  lastDecision.accessGranted
                    ? "text-emerald-700 dark:text-emerald-300 font-medium"
                    : "text-rose-700 dark:text-rose-300 font-medium"
                }`}
              >
                {lastDecision.decisionReason}
              </p>
            )}

            {lastDecision?.details?.instructions && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mt-2">
                <strong>Orientação Operacional:</strong> {lastDecision.details.instructions}
              </div>
            )}
          </div>

          {/* Measured Latency in Milliseconds */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Tempo de Resposta Local:
            </span>
            <span className="font-bold text-emerald-600 text-sm">
              {lastDecision?.latencyMs || 8} ms
            </span>
          </div>
        </div>

        {/* Test Cases Panel: Quick Employee Personas */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Testar com Casos Reais de Chão de Fábrica
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em qualquer colaborador para simular a leitura do crachá na catraca:
            </p>
          </div>

          <div className="space-y-3">
            {users.map((u) => {
              const passport = u.passports.find((p: any) => p.asset?.code === selectedAssetCode);
              const isSelected = selectedUser.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    handleSimulateBadgeSwipe(u.id);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-industrial-600 bg-industrial-50/60 dark:bg-industrial-950/40 ring-1 ring-industrial-600"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {u.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          [{u.registrationNumber}]
                        </span>
                        {u.status === "AFASTADO_MEDICO" && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                            Afastado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Crachá: <span className="font-mono">{u.badgeNumber}</span> • Matriz:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {passport ? `Nível ${passport.twiLevel} TWI` : "Sem Habilitação"}
                        </strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      Bater Crachá
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Access Log Stream */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Registro em Memória do Edge Gateway (Últimos Eventos)
          </h4>
          <span className="text-xs text-emerald-600 font-mono font-medium">Sincronização mTLS Ativa</span>
        </div>

        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    log.accessGranted ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{log.user?.name}</span>
                  <span className="text-slate-500 ml-2">[{log.zone}]</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{log.decisionReason}</p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">{log.latencyMs}ms</span>
                <span>{formatDate(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

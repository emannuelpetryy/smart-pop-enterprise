"use client";

import { useState } from "react";
import { 
  Sliders, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PokaYokeProps {
  assets: any[];
  users: any[];
  pastChecklists: any[];
}

export default function PokaYokeClient({
  assets: initialAssets,
  users,
  pastChecklists: initialChecklists,
}: PokaYokeProps) {
  const [assets, setAssets] = useState<any[]>(initialAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || "");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(users[0]?.id || "");
  const [shift, setShift] = useState<string>("TURNO_1");
  const [checklists, setChecklists] = useState<any[]>(initialChecklists);

  // Pre-use checklist items
  const [items, setItems] = useState([
    { id: "oil", label: "Nível de óleo lubrificante da caixa de transmissão verificado no visor verde", checked: false },
    { id: "air", label: "Pressão pneumática mínima de 6,2 bar no manômetro de freio (NR-12)", checked: false },
    { id: "light", label: "Teste da cortina de luz com haste padronizada (parada < 150ms)", checked: false },
    { id: "emergency", label: "Botão cogumelo de emergência desarmado e livre de obstrução mecânica", checked: false },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<any | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const selectedOperator = users.find((u) => u.id === selectedOperatorId) || users[0];

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleSelectAll = () => {
    setItems((prev) => prev.map((it) => ({ ...it, checked: true })));
  };

  const handleSubmitChecklist = async () => {
    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      const res = await fetch("/api/poka-yoke/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          operatorId: selectedOperator.id,
          shift,
          checklistItems: items,
        }),
      });

      const data = await res.json();
      setFeedbackMessage(data);

      if (data.success && data.mesStatus === "LIBERADA") {
        // Update local asset status
        setAssets((prev) =>
          prev.map((a) =>
            a.id === selectedAsset.id
              ? {
                  ...a,
                  currentMesStatus: "LIBERADA",
                  activeUnlockToken: data.unlockToken,
                  tokenExpiresAt: data.tokenExpiresAt,
                }
              : a
          )
        );

        // Add to past checklists
        setChecklists((prev) => [
          {
            id: `chk-${Date.now()}`,
            asset: selectedAsset,
            operator: selectedOperator,
            shift,
            allApproved: true,
            mesUnlockToken: data.unlockToken,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar checklist de pré-uso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Asset & Operator Selector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Seleção do Posto de Trabalho e Operador do Turno
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Máquina / Ativo Industrial:
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                setFeedbackMessage(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Operador em Chão:
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => {
                setSelectedOperatorId(e.target.value);
                setFeedbackMessage(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.registrationNumber}) - {u.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Turno de Trabalho:
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="TURNO_1">Turno 1 (06:00 - 14:20)</option>
              <option value="TURNO_2">Turno 2 (14:20 - 22:40)</option>
              <option value="TURNO_3">Turno 3 (22:40 - 06:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Machine Status Card + Pre-Use Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Real-Time MES Lock Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Status MES / SCADA
              </span>
              <span className="font-mono text-xs text-slate-400">{selectedAsset.code}</span>
            </div>

            <div className="text-center py-6 space-y-3">
              <div
                className={`inline-flex p-4 rounded-3xl ${
                  selectedAsset.currentMesStatus === "LIBERADA"
                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900"
                    : "bg-rose-50 dark:bg-rose-950 text-rose-600 ring-4 ring-rose-100 dark:ring-rose-900"
                }`}
              >
                {selectedAsset.currentMesStatus === "LIBERADA" ? (
                  <Unlock className="h-10 w-10 animate-bounce" />
                ) : (
                  <Lock className="h-10 w-10" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedAsset.currentMesStatus === "LIBERADA"
                    ? "Máquina Liberada para Operação"
                    : "Intertravamento Lógico Ativo"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedAsset.currentMesStatus === "LIBERADA"
                    ? "Ordem de Produção autorizada no terminal IHM."
                    : "Aguardando checklist pré-uso diário mandatório."}
                </p>
              </div>
            </div>

            {selectedAsset.activeUnlockToken && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Token MES Ativo:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-[11px] block break-all">
                  {selectedAsset.activeUnlockToken}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Norma de Segurança:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{selectedAsset.nrStandard}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Área Fabril:</span>
              <span>{selectedAsset.area}</span>
            </div>
          </div>
        </div>

        {/* Pre-Use Checklist Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-600" />
                <span>Checklist Pré-Uso de Linha (30 Segundos)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Validação física antes do acionamento mecânico do equipamento.
              </p>
            </div>

            <button
              onClick={handleSelectAll}
              className="text-xs text-industrial-600 font-semibold hover:underline"
            >
              Marcar todos como conformes
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it) => (
              <label
                key={it.id}
                onClick={() => handleToggleItem(it.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  it.checked
                    ? "border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-medium"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={it.checked}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="leading-relaxed">{it.label}</span>
              </label>
            ))}
          </div>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                feedbackMessage.success
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                  : "border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {feedbackMessage.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                )}
                <span>{feedbackMessage.success ? "Checklist Aprovado!" : "Bloqueio Poka-Yoke"}</span>
              </div>
              <p>{feedbackMessage.message || feedbackMessage.error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              disabled={isSubmitting}
              onClick={handleSubmitChecklist}
              className="px-6 py-3 rounded-xl bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Submeter Checklist e Liberar Máquina</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Pré-Uso */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Últimas Liberações de Início de Turno (Poka-Yoke Logs)
        </h4>

        <div className="space-y-3">
          {checklists.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.asset?.name} ({c.asset?.code})
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {c.shift}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.allApproved ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {c.allApproved ? "Aprovado" : "Reprovado"}
                  </span>
                </div>
                <p className="text-slate-500">
                  Operador: {c.operator?.name} • Timestamp: {formatDate(c.createdAt)}
                </p>
              </div>

              {c.mesUnlockToken && (
                <div className="font-mono text-[10px] text-slate-500">
                  Token: <span className="font-bold text-emerald-600">{c.mesUnlockToken}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

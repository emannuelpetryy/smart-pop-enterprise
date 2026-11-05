"use client";

import { useState } from "react";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingDown, 
  Clock, 
  UserCheck, 
  ArrowRight
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LpaClientProps {
  operators: any[];
  auditors: any[];
  assets: any[];
  pops: any[];
  initialAudits: any[];
}

export default function LpaAuditsClient({
  operators,
  auditors,
  assets,
  pops,
  initialAudits,
}: LpaClientProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || "");
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>(auditors[0]?.id || "");
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || "");
  const [selectedPopId, setSelectedPopId] = useState<string>(pops[0]?.id || "");
  const [audits, setAudits] = useState<any[]>(initialAudits);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [auditFeedback, setAuditFeedback] = useState<any | null>(null);

  // LPA Inspection Questions
  const [questions, setQuestions] = useState([
    { id: "lpa1", label: "Operador realiza o ciclo de trabalho estritamente conforme a sequência do POP", compliant: true },
    { id: "lpa2", label: "Todos os EPIs obrigatórios (auditivo, ocular e calçado) estão em uso correto", compliant: true },
    { id: "lpa3", label: "Gabarito de controle dimensional está calibrado e em uso a cada 50 peças", compliant: true },
    { id: "lpa4", label: "Ausência total de travas manuais, fitas ou bypass em dispositivos de segurança", compliant: true },
  ]);

  const selectedOperator = operators.find((o) => o.id === selectedOperatorId) || operators[0];
  const selectedAuditor = auditors.find((a) => a.id === selectedAuditorId) || auditors[0];
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const selectedPop = pops.find((p) => p.id === selectedPopId) || pops[0];

  const handleToggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, compliant: !q.compliant } : q))
    );
  };

  const calculateScore = () => {
    const compliantCount = questions.filter((q) => q.compliant).length;
    return Math.round((compliantCount / questions.length) * 100);
  };

  const handleSubmitAudit = async () => {
    const complianceScore = calculateScore();
    const deviations = questions.filter((q) => !q.compliant).map((q) => q.label);

    try {
      setIsSubmitting(true);
      setAuditFeedback(null);

      const res = await fetch("/api/lpa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditorId: selectedAuditor.id,
          auditorRole: selectedAuditor.role || "SUPERVISOR",
          assetId: selectedAsset.id,
          operatorId: selectedOperator.id,
          popId: selectedPop.id,
          complianceScore,
          deviationsFound: deviations,
          actionPlan:
            deviations.length > 0
              ? `Ação Corretiva: ${deviations.join("; ")}. Reciclagem imediata em bancada.`
              : "Sem desvios detectados. Operação em total conformidade.",
        }),
      });

      const data = await res.json();
      setAuditFeedback(data);

      if (res.ok) {
        setAudits((prev) => [
          {
            id: data.auditId || `lpa-${Date.now()}`,
            auditor: selectedAuditor,
            operator: selectedOperator,
            asset: selectedAsset,
            pop: selectedPop,
            complianceScore,
            deviationsFound: JSON.stringify(deviations),
            downgradedToLevel1: data.downgradedToLevel1,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao registrar auditoria LPA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentScore = calculateScore();

  return (
    <div className="space-y-8">
      {/* Top Configuration */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Configuração da Amostragem Escalonada
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Auditor Escalonado:
            </label>
            <select
              value={selectedAuditorId}
              onChange={(e) => setSelectedAuditorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {auditors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Operador sob Inspeção:
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Ativo / Posto de Trabalho:
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
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
              Procedimento Auditado:
            </label>
            <select
              value={selectedPopId}
              onChange={(e) => setSelectedPopId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {pops.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.version})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main LPA Inspection Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-teal-600" />
                <span>Checklist Rápido de Amostragem (5 Minutos)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifique os comportamentos e pontos de checagem física em tempo real no posto.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Índice Calculado</span>
              <span
                className={`font-mono text-xl font-bold ${
                  currentScore >= 75 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {currentScore}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  q.compliant
                    ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                    : "border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleQuestion(q.id)}
                    className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center text-[10px] font-bold text-white transition-colors ${
                      q.compliant ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {q.compliant ? "✓" : "✕"}
                  </button>
                  <span className="leading-relaxed font-medium">{q.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleQuestion(q.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    q.compliant
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                  }`}
                >
                  {q.compliant ? "Conforme" : "Não Conforme"}
                </button>
              </div>
            ))}
          </div>

          {/* Feedback & Actions */}
          {auditFeedback && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                auditFeedback.downgradedToLevel1
                  ? "border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200"
                  : "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {auditFeedback.downgradedToLevel1 ? (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                <span>{auditFeedback.downgradedToLevel1 ? "DESVIO GRAVE REGISTRADO" : "LPA Conforme"}</span>
              </div>
              <p>{auditFeedback.message}</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={isSubmitting}
              onClick={handleSubmitAudit}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Registrar Auditoria Escalonada</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info Column: LPA Hierarchy & Governance */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Hierarquia de Auditorias LPA (Camadas)
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-teal-700 dark:text-teal-300">Camada 1: Supervisor Diário</strong>
                <span className="font-mono text-[10px] text-slate-400">1x por dia</span>
              </div>
              <p className="text-slate-500">
                Audita 1 POP por turno por amostragem (foco em Key Safety Points e postura do operador).
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-blue-700 dark:text-blue-300">Camada 2: Engenharia de Qualidade</strong>
                <span className="font-mono text-[10px] text-slate-400">Semanal</span>
              </div>
              <p className="text-slate-500">
                Verificação minuciosa de gabaritos dimensionais, desgaste de ferramental e parâmetros técnicos.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-purple-700 dark:text-purple-300">Camada 3: Gerência de Planta</strong>
                <span className="font-mono text-[10px] text-slate-400">Mensal</span>
              </div>
              <p className="text-slate-500">
                Auditorias em postos críticos com risco de parada de linha ou acidentes graves (NR-12).
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Regra de Proteção Operacional:</strong> Se o índice de conformidade for menor que 75%, o operador é preventivamente rebaixado para Nível 1 até que nova prova prática OJT seja realizada.
            </p>
          </div>
        </div>
      </div>

      {/* Audit History Log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Histórico Consolidado de Auditorias Escalonadas
        </h4>

        <div className="space-y-3">
          {audits.map((a) => (
            <div
              key={a.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {a.operator?.name}
                  </span>
                  <span className="text-slate-400 font-mono">[{a.operator?.registrationNumber}]</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    Ativo: {a.asset?.code}
                  </span>
                  {a.downgradedToLevel1 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                      Rebaixado p/ Nível 1
                    </span>
                  )}
                </div>
                <p className="text-slate-500">
                  Auditor: {a.auditor?.name} ({a.auditorRole || a.auditor?.role}) • POP: {a.pop?.code}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`font-mono font-bold text-sm ${
                    a.complianceScore >= 75 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {a.complianceScore}%
                </span>
                <span className="text-[10px] text-slate-400 block">{formatDate(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

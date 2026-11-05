"use client";

import { useState, useRef } from "react";
import { 
  FileCheck2, 
  Camera, 
  PenTool, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  Stamp,
  Clock
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface OjtClientProps {
  operators: any[];
  supervisors: any[];
  assets: any[];
  pops: any[];
  pastRecords: any[];
}

export default function OjtSignOffClient({
  operators,
  supervisors,
  assets,
  pops,
  pastRecords: initialRecords,
}: OjtClientProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || "");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(supervisors[0]?.id || "");
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || "");
  const [subActivity, setSubActivity] = useState<string>("OPERACAO_CONTINUA");
  const [feedback, setFeedback] = useState<string>(
    "Operador demonstrou postura ergonômica correta, respeitou o ciclo bimanual da prensa e validou os EPIs mandatórios conforme a NR-12."
  );

  // Safety items checklist
  const [safetyChecks, setSafetyChecks] = useState([
    { id: "ksp1", label: "Teste prático da parada instantânea da cortina de luz com haste de teste", checked: true },
    { id: "ksp2", label: "Inspeção visual e sincronismo do comando bimanual (< 0,5s de tolerância)", checked: true },
    { id: "ksp3", label: "Utilização obrigatória da pinça magnética na alimentação de blanks", checked: true },
    { id: "ksp4", label: "Uso correto de protetor auricular tipo concha e óculos com vedação", checked: true },
  ]);

  // Evidence photo simulation
  const [photoCaptured, setPhotoCaptured] = useState<boolean>(true);
  const [photoPreview, setPhotoPreview] = useState<string>(
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='400' height='260' fill='%230f172a'/><text x='50%' y='45%' fill='%2338bdf8' font-size='14' font-family='sans-serif' text-anchor='middle'>EVIDENCIA OJT: POSTO PRE-400T-01</text><text x='50%' y='58%' fill='%2394a3b8' font-size='11' font-family='sans-serif' text-anchor='middle'>Operador com EPI completo e haste de cortina validada</text><circle cx='200' cy='180' r='20' fill='%2310b981'/><path d='M192 180 l5 5 l10 -10' stroke='white' stroke-width='2' fill='none'/></svg>"
  );

  // Signatures
  const [supervisorSigned, setSupervisorSigned] = useState<boolean>(false);
  const [operatorSigned, setOperatorSigned] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>(initialRecords);

  const selectedOperator = operators.find((o) => o.id === selectedOperatorId) || operators[0];
  const selectedSupervisor = supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];
  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const activePop = pops.find((p) => p.targetAssetId === selectedAsset?.id) || pops[0];

  const handleToggleCheck = (id: string) => {
    setSafetyChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleCapturePhoto = () => {
    setPhotoCaptured(true);
    setPhotoPreview(
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='400' height='260' fill='%230f172a'/><text x='50%' y='45%' fill='%2310b981' font-size='14' font-family='sans-serif' text-anchor='middle'>NOVA FOTO REGISTRADA PELO TABLET</text><text x='50%' y='58%' fill='%2394a3b8' font-size='11' font-family='sans-serif' text-anchor='middle'>Registro com Geo-Timestamp de Chão de Fábrica</text></svg>"
    );
  };

  const handleSubmitOjt = async (verdict: "APROVADO" | "REPROVADO_NECESSITA_TUTELA") => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/ojt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: selectedOperator.id,
          supervisorId: selectedSupervisor.id,
          assetId: selectedAsset.id,
          popId: activePop?.id || pops[0]?.id,
          subActivity,
          safetyPointsValidated: safetyChecks,
          evidencePhotoBase64: photoPreview,
          supervisorSignature: `Assinado digitalmente por ${selectedSupervisor.name} (CREA/Matrícula: ${selectedSupervisor.registrationNumber})`,
          operatorSignature: `Assinado digitalmente por ${selectedOperator.name} (Matrícula: ${selectedOperator.registrationNumber})`,
          verdict,
          feedbackNotes: feedback,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionResult(data);
        // Refresh past records locally
        setRecords((prev) => [
          {
            id: data.ojtRecordId,
            user: selectedOperator,
            supervisor: selectedSupervisor,
            asset: selectedAsset,
            verdict,
            feedbackNotes: feedback,
            cryptographicTimestamp: data.cryptographicHash,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        alert(data.error || "Erro ao registrar OJT.");
      }
    } catch (e) {
      console.error(e);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration Card: Select Operator and Asset */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
          Configuração da Homologação em Campo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Operador Avaliado:
            </label>
            <select
              value={selectedOperatorId}
              onChange={(e) => {
                setSelectedOperatorId(e.target.value);
                setSubmissionResult(null);
                setSupervisorSigned(false);
                setOperatorSigned(false);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Supervisor Validador:
            </label>
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {supervisors.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Ativo / Máquina:
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
              Sub-Atividade Granular:
            </label>
            <select
              value={subActivity}
              onChange={(e) => setSubActivity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="OPERACAO_CONTINUA">Operação de Produção Contínua</option>
              <option value="SETUP_ESTAMPO">Troca de Ferramental / Setup</option>
              <option value="MANUTENCAO_PREVENTIVA">Manutenção Preventiva / Limpeza</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main OJT Evaluation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Key Safety Points & Photo Evidence */}
        <div className="space-y-6">
          {/* Key Safety Points Check */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Key Safety Points Mandatórios (NR-12)</span>
              </h4>
              <span className="text-[10px] uppercase font-bold text-slate-400">Inspeção Visual em Posto</span>
            </div>

            <div className="space-y-2.5">
              {safetyChecks.map((item) => (
                <label
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    item.checked
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-medium"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photo Evidence Capture */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="h-4 w-4 text-industrial-600" />
                <span>Evidência Fotográfica Obrigatória de Bancada</span>
              </h4>
              <span className="text-[10px] font-bold text-rose-600 uppercase">Exigência Forense</span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-2">
              <img
                src={photoPreview}
                alt="Foto de Evidência OJT"
                className="w-full h-44 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span>Capturar Nova Foto com Tablet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Signatures & Verdict */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="h-4 w-4 text-purple-600" />
              <span>Assinatura Digital Cruzada na Tela (Dual Sign-Off)</span>
            </h4>

            {/* Supervisor Signature Pad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  1. Assinatura do Supervisor ({selectedSupervisor.name})
                </span>
                <span className="font-mono text-[10px] text-slate-400">CREA-SP / Registro Eng.</span>
              </div>
              <div
                onClick={() => setSupervisorSigned(true)}
                className={`h-24 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  supervisorSigned
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-400"
                }`}
              >
                {supervisorSigned ? (
                  <div className="text-center space-y-1">
                    <span className="font-serif italic text-lg font-bold">Carlos Mendes (CREA 90210)</span>
                    <span className="text-[10px] block font-mono text-emerald-600">Assinado Eletronicamente</span>
                  </div>
                ) : (
                  <span className="text-xs">Clique para simular assinatura na tela do tablet</span>
                )}
              </div>
            </div>

            {/* Operator Signature Pad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  2. Assinatura do Operador ({selectedOperator.name})
                </span>
                <span className="font-mono text-[10px] text-slate-400">Matrícula: {selectedOperator.registrationNumber}</span>
              </div>
              <div
                onClick={() => setOperatorSigned(true)}
                className={`h-24 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                  operatorSigned
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-400"
                }`}
              >
                {operatorSigned ? (
                  <div className="text-center space-y-1">
                    <span className="font-serif italic text-lg font-bold">{selectedOperator.name}</span>
                    <span className="text-[10px] block font-mono text-emerald-600">Assinado Eletronicamente</span>
                  </div>
                ) : (
                  <span className="text-xs">Clique para simular assinatura na tela do tablet</span>
                )}
              </div>
            </div>

            {/* Feedback & Observations */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Parecer Técnico do Supervisor:</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Actions: Approve (Promotes to Level 3) or Reject (Tutela) */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting || !supervisorSigned || !operatorSigned}
                onClick={() => handleSubmitOjt("REPROVADO_NECESSITA_TUTELA")}
                className="flex-1 py-3 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors disabled:opacity-40"
              >
                Reprovar (Manter Tutela Nível 2)
              </button>

              <button
                type="button"
                disabled={isSubmitting || !supervisorSigned || !operatorSigned}
                onClick={() => handleSubmitOjt("APROVADO")}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Aprovar OJT (Promover a Nível 3)</span>
              </button>
            </div>
          </div>

          {/* Submission Result Box */}
          {submissionResult && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 ${
                submissionResult.verdict === "APROVADO"
                  ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 text-amber-950 dark:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {submissionResult.verdict === "APROVADO" ? (
                  <Stamp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <h5 className="font-bold text-sm">
                  {submissionResult.verdict === "APROVADO"
                    ? "Homologação OJT Aprovada e Selada Criptograficamente!"
                    : "Homologação OJT Registrada com Restrição de Tutela (Nível 2)"}
                </h5>
              </div>
              <p>
                {submissionResult.verdict === "APROVADO" ? (
                  <>
                    O operador <strong>{selectedOperator.name}</strong> foi promovido formalmente a{" "}
                    <strong>Nível 3 (Autônomo Habilitado)</strong>. Seu QR Code e crachá agora destravam a catraca da linha (Zona 1) de forma independente.
                  </>
                ) : (
                  <>
                    O operador <strong>{selectedOperator.name}</strong> permanecerá em{" "}
                    <strong>Nível 2 (Operador em Tutela / Shadowing)</strong>. O acesso à Zona 1 exigirá acompanhamento presencial do padrinho Nível 4.
                  </>
                )}
              </p>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
                <div>Hash de Auditoria: {submissionResult.cryptographicHash}</div>
                <div>Carimbo de Tempo: {submissionResult.timestamp}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Recente de OJT Sign-Offs */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Dossiê Forense • Homologações Práticas Registradas
        </h4>

        <div className="space-y-3">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{rec.user?.name}</span>
                  <span className="text-slate-400 font-mono">[{rec.user?.registrationNumber}]</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                    Ativo: {rec.asset?.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rec.verdict === "APROVADO"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {rec.verdict}
                  </span>
                </div>
                <p className="text-slate-500">{rec.feedbackNotes}</p>
                <div className="text-[10px] font-mono text-slate-400">
                  Supervisor: {rec.supervisor?.name} • Timestamp: {formatDate(rec.createdAt)}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-[10px] text-emerald-600 block">
                  {rec.cryptographicTimestamp.substring(0, 24)}...
                </span>
                <span className="text-[10px] text-slate-400">Hash SHA-256</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

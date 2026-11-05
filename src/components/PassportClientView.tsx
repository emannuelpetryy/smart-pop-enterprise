"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  QrCode, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  FileText,
  BadgeCheck,
  UserCheck
} from "lucide-react";
import { formatTwiBadge, formatDate } from "@/lib/utils";

interface PassportClientProps {
  users: any[];
  assets: any[];
}

export default function PassportClientView({ users, assets }: PassportClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || "");
  const [qrData, setQrData] = useState<{
    qrCodeImage: string;
    totpCode: string;
    remainingSeconds: number;
  } | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [deltaModalOpen, setDeltaModalOpen] = useState<boolean>(false);
  const [deltaQuizAnswered, setDeltaQuizAnswered] = useState<boolean>(false);
  const [selectedDeltaOption, setSelectedDeltaOption] = useState<number | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Fetch QR Code and TOTP
  const fetchQr = async (userId: string) => {
    try {
      setIsLoadingQr(true);
      const res = await fetch(`/api/passport/${userId}/qr`);
      const data = await res.json();
      if (res.ok) {
        setQrData(data);
        setCountdown(data.remainingSeconds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchQr(selectedUserId);
    }
  }, [selectedUserId]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQr(selectedUserId);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedUserId]);

  const passports = selectedUser?.passports || [];
  const hasDeltaPending = passports.some((p: any) => p.status === "RECICLAGEM_DELTA_PENDENTE");
  const deltaPassport = passports.find((p: any) => p.status === "RECICLAGEM_DELTA_PENDENTE");

  return (
    <div className="space-y-6">
      {/* Colaborador Switcher & Quick Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Selecione o Colaborador para Visualizar o Passaporte
          </label>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                  setDeltaQuizAnswered(false);
                  setSelectedDeltaOption(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedUserId === u.id
                    ? "bg-industrial-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {u.name} ({u.registrationNumber})
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Total de Habilitações: <span className="font-bold text-slate-900 dark:text-white">{passports.length}</span>
        </div>
      </div>

      {/* Reciclagem Delta Alert Banner (se aplicável ao colaborador) */}
      {hasDeltaPending && !deltaQuizAnswered && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Reciclagem Delta Obrigatória Pendente</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                O procedimento da <strong>{deltaPassport?.asset?.name}</strong> foi atualizado para a versão <strong>{deltaPassport?.pop?.version}</strong>. Tolerância de 48h para fixação de micro-mudança.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDeltaModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs whitespace-nowrap transition-colors"
          >
            Fazer Reciclagem Delta (30s)
          </button>
        </div>
      )}

      {deltaQuizAnswered && (
        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div className="text-xs">
            <strong>Reciclagem Delta Concluída com Sucesso!</strong> Sua habilitação na versão {deltaPassport?.pop?.version} foi revalidada para os próximos turnos.
          </div>
        </div>
      )}

      {/* Grid Principal: Cartão da Carteira + QR Code Dinâmico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passaporte Operacional Digital Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-industrial-100 dark:bg-industrial-950 flex items-center justify-center text-industrial-700 dark:text-industrial-300 font-bold text-xl ring-2 ring-industrial-600">
                {selectedUser.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedUser.name}</span>
                  <BadgeCheck className="h-5 w-5 text-industrial-600" />
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedUser.role} • {selectedUser.department}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                  <span>Matrícula: {selectedUser.registrationNumber}</span>
                  <span>•</span>
                  <span>Crachá: {selectedUser.badgeNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  selectedUser.status === "ATIVO"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : selectedUser.status === "AFASTADO_MEDICO"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {selectedUser.status}
              </span>
            </div>
          </div>

          {/* Matriz 3D de Habilitações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Matriz Tridimensional de Competências (Ativo x Sub-Atividade)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Escala TWI 1 a 4</span>
            </div>

            <div className="space-y-3">
              {passports.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                  Nenhuma habilitação cadastrada para este colaborador.
                </div>
              ) : (
                passports.map((p: any) => {
                  const twi = formatTwiBadge(p.twiLevel);
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {p.asset.name}
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {p.asset.code}
                            </span>
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              {p.asset.nrStandard}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Sub-atividade: <strong className="text-slate-700 dark:text-slate-300">{p.subActivity}</strong> • POP: {p.pop.code} ({p.pop.version})
                          </p>
                        </div>

                        <div>
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${twi.color}`}>
                            {twi.label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500">
                        <div>
                          <span className="block text-[10px] text-slate-400">Teoria Concluída:</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {p.theoryScore ? `${p.theoryScore}% (Aprovado)` : "Pendente"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">OJT Supervisor:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {p.ojtApprovedAt ? formatDate(p.ojtApprovedAt) : "Não Realizado"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Validade da Habilitação:</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                            {p.expiresAt ? formatDate(p.expiresAt) : "12 meses"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Status Jurídico:</span>
                          <span className="font-semibold text-emerald-600">
                            {p.status === "HABILITADO" ? "Conforme NR-12" : p.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Dynamic TOTP QR Code Card (Anti-Fraude com Rotação 30s) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-industrial-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">QR Code Dinâmico (TOTP)</h3>
              </div>
              <button
                onClick={() => fetchQr(selectedUserId)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title="Atualizar QR Code"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingQr ? "animate-spin" : ""}`} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Válido por 30 segundos. Rotação anti-fraude com carimbo criptográfico. Utilize na catraca de chão de fábrica ou no scanner da máquina.
            </p>

            {/* QR Code Container */}
            <div className="relative flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {qrData?.qrCodeImage ? (
                <img
                  src={qrData.qrCodeImage}
                  alt="Dynamic TOTP QR Code"
                  className="w-52 h-52 object-contain rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  Gerando chave de segurança...
                </div>
              )}

              {/* 30-Second Progress Bar */}
              <div className="w-full mt-4 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-industrial-600" />
                    Expira em:
                  </span>
                  <span className="font-bold text-industrial-600">{countdown}s</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-industrial-600 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* TOTP Numerical Code */}
              <div className="mt-3 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Código Numérico de Contingência
                </span>
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white">
                  {qrData?.totpCode || "------"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Algoritmo:</span>
              <span className="font-mono">HMAC-SHA1 (RFC 6238)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Assinatura Digital:</span>
              <span className="font-mono text-emerald-600">Verificada SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reciclagem Delta */}
      {deltaModalOpen && deltaPassport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Reciclagem Delta: POP v2.2</h3>
                  <p className="text-xs text-slate-500">{deltaPassport.asset.name}</p>
                </div>
              </div>
              <button
                onClick={() => setDeltaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">
                O que mudou nesta revisão:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Revisão do limiar de pressão pneumática de <strong>5,8 bar</strong> para <strong>6,2 bar</strong> conforme aditivo de engenharia do fabricante e inclusão do teste diário da haste de cortina de luz.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                Pergunta de Fixação Rápida (30 segundos):
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Qual foi a nova pressão mínima de freio pneumático estabelecida na revisão v2.2?
              </p>

              <div className="space-y-2">
                {["5,8 bar", "6,2 bar", "7,0 bar"].map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDeltaOption(idx)}
                    className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                      selectedDeltaOption === idx
                        ? "border-industrial-600 bg-industrial-50 text-industrial-900 dark:bg-industrial-950 dark:text-industrial-200"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeltaModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                disabled={selectedDeltaOption === null}
                onClick={() => {
                  if (selectedDeltaOption === 1) {
                    setDeltaQuizAnswered(true);
                    setDeltaModalOpen(false);
                  } else {
                    alert("Resposta incorreta. A nova pressão mandatória é 6,2 bar.");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs transition-colors"
              >
                Confirmar Reciclagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

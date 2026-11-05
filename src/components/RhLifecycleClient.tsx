"use client";

import { useState } from "react";
import { 
  Users, 
  UserPlus, 
  ArrowRightLeft, 
  UserMinus, 
  Stethoscope, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  RefreshCw
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RhClientProps {
  users: any[];
  initialEvents: any[];
  assets: any[];
}

export default function RhLifecycleClient({
  users: initialUsers,
  initialEvents,
  assets,
}: RhClientProps) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [events, setEvents] = useState<any[]>(initialEvents);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<string>(users[0]?.registrationNumber || "");
  const [newAssetCode, setNewAssetCode] = useState<string>("SOL-ROB-02");
  const [dossierVisible, setDossierVisible] = useState<boolean>(false);
  const [dossierUser, setDossierUser] = useState<any | null>(null);

  // Trigger ERP webhook events
  const handleTriggerEvent = async (eventType: string, externalEmployeeId: string, payload: any) => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/rh/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          externalEmployeeId,
          payload,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Prepend new event
        setEvents((prev) => [
          {
            id: `evt-${Date.now()}`,
            eventType,
            externalEmployeeId,
            payloadJson: JSON.stringify(payload),
            effectDescription: data.effectDescription,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        // Update local user state
        if (eventType === "S2230_AFASTAMENTO") {
          setUsers((prev) =>
            prev.map((u) =>
              u.registrationNumber === externalEmployeeId
                ? { ...u, status: "AFASTADO_MEDICO" }
                : u
            )
          );
        } else if (eventType === "S2230_RETORNO" || eventType === "S2230_REATIVACAO") {
          setUsers((prev) =>
            prev.map((u) =>
              u.registrationNumber === externalEmployeeId
                ? { ...u, status: "ATIVO" }
                : u
            )
          );
        } else if (eventType === "S2299_DESLIGAMENTO") {
          setUsers((prev) =>
            prev.map((u) =>
              u.registrationNumber === externalEmployeeId
                ? { ...u, status: "DESLIGADO", zone0Access: false }
                : u
            )
          );
        } else if (eventType === "S2200_ADMISSAO") {
          setUsers((prev) => [
            {
              id: `usr-${Date.now()}`,
              name: payload.name,
              registrationNumber: externalEmployeeId,
              badgeNumber: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
              role: payload.role || "OPERADOR",
              department: payload.department,
              status: "ATIVO",
              zone0Access: true,
              passports: [],
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } else {
        alert(data.error || "Erro ao processar evento de RH.");
      }
    } catch (e) {
      console.error(e);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenDossier = (user: any) => {
    setDossierUser(user);
    setDossierVisible(true);
  };

  return (
    <div className="space-y-8">
      {/* Action Triggers: ERP Event Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <span>Simulador de Eventos de ERP (TOTVS Protheus / Senior / SAP)</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">eSocial v1.2 Compliant</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* S-2200 Admissão */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">S-2200: Admissão</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gera cadastro, libera Zona 0 e aloca trilha teórica em quiosque.
              </p>
            </div>
            <button
              disabled={isProcessing}
              onClick={() => {
                const regNum = `OP-${Math.floor(70000 + Math.random() * 9000)}`;
                handleTriggerEvent("S2200_ADMISSAO", regNum, {
                  name: `Colaborador Novo ${regNum}`,
                  department: "Estamparia Pesada",
                  role: "OPERADOR",
                  plant: "Planta São Bernardo",
                });
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm min-h-[44px]"
            >
              Simular Admissão
            </button>
          </div>

          {/* S-2206 Transferência de Posto */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">S-2206: Transferência</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Revoga linha anterior e aloca nova matriz de posto.
              </p>
            </div>
            <button
              disabled={isProcessing}
              onClick={() => {
                handleTriggerEvent("S2206_TRANSFERENCIA", selectedUserForTransfer, {
                  newDepartment: "Soldagem Robotizada",
                  newAssetCode,
                });
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm min-h-[44px]"
            >
              Simular Transferência
            </button>
          </div>

          {/* S-2230 Afastamento Médico */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-amber-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">S-2230: Afastamento</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Bloqueia Zona 1 (área de risco) para evitar acidentes em licença.
              </p>
            </div>
            <button
              disabled={isProcessing}
              onClick={() => {
                handleTriggerEvent("S2230_AFASTAMENTO", selectedUserForTransfer, {
                  reason: "Licença Médica Ortopédica CID M54",
                });
              }}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm min-h-[44px]"
            >
              Simular Afastamento
            </button>
          </div>

          {/* S-2230 Retorno de Afastamento (ASO Apto) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">S-2230: Retorno (Apto)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                ASO de retorno emitido (NR-07). Restabelece acessos às catracas.
              </p>
            </div>
            <button
              disabled={isProcessing}
              onClick={() => {
                handleTriggerEvent("S2230_RETORNO", selectedUserForTransfer, {
                  reason: "Retorno de Afastamento com ASO Apto (Medicina do Trabalho)",
                });
              }}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm min-h-[44px]"
            >
              Simular Retorno Apto
            </button>
          </div>

          {/* S-2299 Desligamento */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-rose-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">S-2299: Rescisão</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Corte imediato de crachás físicos, QR Codes e catracas em 100% das áreas.
              </p>
            </div>
            <button
              disabled={isProcessing}
              onClick={() => {
                handleTriggerEvent("S2299_DESLIGAMENTO", selectedUserForTransfer, {
                  reason: "Rescisão Contratual sem Justa Causa",
                });
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm min-h-[44px]"
            >
              Simular Desligamento
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Colaboradores Ativos & Dossiê Jurídico Forense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Colaboradores com Status Legal */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Quadro de Colaboradores & Status Jurídico CLT
            </h4>
            <span className="text-xs text-slate-400 font-mono">Total: {users.length}</span>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">[{u.registrationNumber}]</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === "ATIVO"
                          ? "bg-emerald-100 text-emerald-700"
                          : u.status === "AFASTADO_MEDICO"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    {u.department} • Crachá: <span className="font-mono">{u.badgeNumber}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedUserForTransfer(u.registrationNumber)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-[11px] font-medium"
                  >
                    Alvo ERP
                  </button>
                  <button
                    onClick={() => handleOpenDossier(u)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-bold"
                  >
                    Dossiê Forense
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico de Eventos Ingeridos do ERP */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Log de Auditoria de Integração ERP / eSocial
            </h4>
            <span className="text-xs text-indigo-600 font-mono font-medium">Webhook S-2200+</span>
          </div>

          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                    {evt.eventType}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(evt.createdAt)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">
                  {evt.effectDescription}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Matrícula: {evt.externalEmployeeId}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Dossiê Jurídico Forense (1-Clique MTE / Fiscalização do Trabalho) */}
      {dossierVisible && dossierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Dossiê Jurídico Forense de Conformidade (NR-01 & CLT)
                  </h3>
                  <p className="text-xs text-slate-500">Documento Oficial de Comprovação Perante MTE</p>
                </div>
              </div>
              <button
                onClick={() => setDossierVisible(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Colaborador:</span>
                    <strong className="text-slate-900 dark:text-white">{dossierUser.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Matrícula / Crachá:</span>
                    <span className="font-mono">{dossierUser.registrationNumber} / {dossierUser.badgeNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Departamento:</span>
                    <span>{dossierUser.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Contratual CLT:</span>
                    <span className="font-bold text-emerald-600">{dossierUser.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 dark:text-white">
                  Histórico de Habilitações & Blindagem de Horas Extras:
                </h5>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Carga horária teórica realizada 100% dentro do estabelecimento empresarial em quiosque corporativo (Conforme Portaria MTE nº 671).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Inexistência de cursos em smartphone pessoal ou fora da jornada (Inaplicabilidade da tese de tempo à disposição do empregador).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Validação prática em posto (OJT) com foto e assinatura criptográfica do supervisor de linha.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-mono text-[11px]">
                Selo de Autenticidade Digital: SHA-256: 7f8b92c4...e109a (Armazenado na nuvem para guarda legal de 20 anos)
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDossierVisible(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  alert("Dossiê baixado no formato PDF criptografado para apresentação em fiscalização.");
                  setDossierVisible(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Exportar Certificado PDF Forense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

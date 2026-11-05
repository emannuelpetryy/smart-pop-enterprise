"use client";

import { useState } from "react";
import { 
  Tablet, 
  UserCheck, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldAlert, 
  LogOut, 
  BookOpen, 
  Award,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

interface KioskClientProps {
  users: any[];
  pops: any[];
}

export default function KioskTabletClient({ users, pops }: KioskClientProps) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [selectedPopId, setSelectedPopId] = useState<string>(pops[0]?.id || "");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activePop = pops.find((p) => p.id === selectedPopId) || pops[0];
  const steps = activePop ? JSON.parse(activePop.stepsContent || "[]") : [];
  const safetyPoints = activePop ? JSON.parse(activePop.safetyPoints || "[]") : [];
  const questions = activePop ? JSON.parse(activePop.quizQuestions || "[]") : [];

  // Handlers for PIN pad
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleLogin = (userToLogin?: any) => {
    const targetUser = userToLogin || users.find((u) => u.pinCode === pinInput || u.registrationNumber === pinInput);
    if (targetUser) {
      setCurrentUser(targetUser);
      setPinInput("");
      setActiveStepIndex(0);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
    } else {
      alert("PIN ou Matrícula não encontrado. Tente selecionar um operador de teste abaixo.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPinInput("");
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const handleQuizOption = (questionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    questions.forEach((q: any) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/kiosk/complete-theory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          popId: activePop.id,
          quizAnswers,
          score,
        }),
      });
      const data = await res.json();
      setQuizResult(data);
      setQuizSubmitted(true);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Tela de Login no Quiosque
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-900">
              <Tablet className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Terminal Quiosque • Sala de Integração
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Digite seu PIN de 4 dígitos ou selecione seu nome para iniciar o cumprimento da carga horária obrigatória nos termos do Art. 4º da CLT.
            </p>
          </div>

          {/* PIN Input Display */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center font-mono text-xl font-bold transition-all ${
                  pinInput.length > idx
                    ? "border-industrial-600 bg-industrial-50 text-industrial-900 dark:bg-industrial-950 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                }`}
              >
                {pinInput.length > idx ? "●" : ""}
              </div>
            ))}
          </div>

          {/* Touch-Friendly PIN Pad (≥ 48px touch targets) */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handlePinDigit(num)}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-900 dark:text-white active:scale-95 transition-all shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handlePinDelete}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sm font-semibold text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
            >
              Limpar
            </button>
            <button
              onClick={() => handlePinDigit("0")}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-lg font-bold text-slate-900 dark:text-white active:scale-95 transition-all"
            >
              0
            </button>
            <button
              onClick={() => handleLogin()}
              disabled={pinInput.length !== 4}
              className="h-14 rounded-2xl bg-industrial-600 hover:bg-industrial-700 disabled:opacity-40 text-sm font-bold text-white active:scale-95 transition-all shadow-sm"
            >
              Entrar
            </button>
          </div>

          {/* Quick Select for Demonstration */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2 text-center">
              Acesso Rápido para Demonstração:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {u.name} (PIN: {u.pinCode})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tela Principal do Tablet (Usuário Conectado)
  return (
    <div className="space-y-6">
      {/* Top Tablet Header Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-industrial-600 text-white font-bold flex items-center justify-center text-base">
            {currentUser.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
              <span className="font-mono text-xs text-slate-500">[{currentUser.registrationNumber}]</span>
            </div>
            <p className="text-xs text-slate-500">
              Sessão de Capacitação Ativa • Tablet Quiosque #04 (Sala de Acolhimento)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Jornada Remunerada</span>
            <span className="text-xs text-slate-400">Ponto Zona 0 Registrado</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>

      {/* POP Selection Dropdown */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-industrial-600" />
          <span className="font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-200">
            Procedimento Operacional Padrão Selecionado:
          </span>
        </div>

        <select
          value={selectedPopId}
          onChange={(e) => {
            setSelectedPopId(e.target.value);
            setActiveStepIndex(0);
            setQuizSubmitted(false);
            setQuizResult(null);
          }}
          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
        >
          {pops.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.title} ({p.version})
            </option>
          ))}
        </select>
      </div>

      {/* Interactive POP Study / Step Viewer */}
      {!quizSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Step Viewer */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-industrial-600 uppercase tracking-wider">
                Passo {activeStepIndex + 1} de {steps.length}
              </span>
              <span className="text-xs font-mono text-slate-400">Tempo estimado: 35 min</span>
            </div>

            {steps[activeStepIndex] && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {steps[activeStepIndex].title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {steps[activeStepIndex].instruction}
                </p>

                {/* Key Safety Point Warning */}
                {steps[activeStepIndex].criticalPoint && (
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs uppercase tracking-wide block font-bold text-rose-700 dark:text-rose-300">
                        Ponto Crítico de Segurança (Key Safety Point):
                      </strong>
                      <p className="text-xs mt-1 leading-relaxed">
                        {steps[activeStepIndex].criticalPoint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step Navigation Controls (Touch Ergonomics) */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => prev - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Passo Anterior</span>
              </button>

              {activeStepIndex < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStepIndex((prev) => prev + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-industrial-600 hover:bg-industrial-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span>Próximo Passo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Todos os passos lidos
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Key Safety Points & Micro-Quiz Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            {/* EPIs e Segurança Obrigatória */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pontos de Atenção NR-12 & EPIs
              </h4>
              <ul className="space-y-2">
                {safetyPoints.map((pt: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Assimilation Quiz */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Quiz de Fixação Cognitiva
                </h4>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Mínimo 80%
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q: any, qIdx: number) => (
                  <div key={q.id} className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt: string, optIdx: number) => (
                        <button
                          key={optIdx}
                          onClick={() => handleQuizOption(q.id, optIdx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                            quizAnswers[q.id] === optIdx
                              ? "border-industrial-600 bg-industrial-50 text-industrial-900 dark:bg-industrial-950 dark:text-industrial-100 font-medium"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled={Object.keys(quizAnswers).length < questions.length || isSubmitting}
                onClick={handleSubmitQuiz}
                className="w-full py-3 rounded-xl bg-industrial-600 hover:bg-industrial-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-sm"
              >
                {isSubmitting ? "Validando Respostas..." : "Concluir Etapa Teórica"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Result & Next Step Screen */
        <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md text-center space-y-6">
          <div
            className={`inline-flex p-4 rounded-3xl ${
              quizResult?.approved
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-900"
                : "bg-rose-50 dark:bg-rose-950 text-rose-600 ring-4 ring-rose-100 dark:ring-rose-900"
            }`}
          >
            {quizResult?.approved ? <Award className="h-10 w-10" /> : <AlertOctagon className="h-10 w-10" />}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {quizResult?.approved ? "Avaliação Teórica Aprovada!" : "Atenção: Nota Insuficiente"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              {quizResult?.message}
            </p>
          </div>

          <div className="inline-block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm">
            Nota de Fixação: <strong className="text-industrial-600 text-lg">{quizResult?.score}%</strong>
          </div>

          {quizResult?.approved && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 text-left space-y-1">
              <strong>Próximo Passo Obrigatório (Pilar 3):</strong>
              <p>
                Sua habilitação agora está em <strong>Nível 1 (Aprendiz Teórico)</strong>. A catraca do chão de fábrica (Zona 1) permanecerá em <em>Hard Gate</em> até que o Supervisor Carlos Mendes realize o teste prático de bancada com assinatura digital e foto de evidência (OJT Sign-off).
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setQuizSubmitted(false);
                setQuizAnswers({});
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Revisar Procedimento
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-xl bg-industrial-600 hover:bg-industrial-700 text-white text-xs font-bold shadow-sm"
            >
              Liberar Tablet para Próximo Colaborador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

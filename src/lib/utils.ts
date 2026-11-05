import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTwiBadge(level: number): { label: string; color: string; desc: string } {
  switch (level) {
    case 4:
      return {
        label: "Nível 4: Multiplicador / Auditor",
        color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        desc: "Apto a treinar operadores e conduzir auditorias LPA de chão de fábrica.",
      };
    case 3:
      return {
        label: "Nível 3: Autônomo Habilitado",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        desc: "Aprovado em avaliação teórica e OJT presencial do supervisor. Acesso total liberado.",
      };
    case 2:
      return {
        label: "Nível 2: Operador em Tutela",
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        desc: "Autorizado a operar apenas acompanhado por padrinho Nível 4 (Shadowing).",
      };
    case 1:
      return {
        label: "Nível 1: Aprendiz Teórico",
        color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
        desc: "Carga horária teórica cumprida. Pendente homologação prática de campo (OJT).",
      };
    default:
      return {
        label: "Nível 0: Não Autorizado",
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        desc: "Operação estritamente vedada perante a NR-12.",
      };
  }
}

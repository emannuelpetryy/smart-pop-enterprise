import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { 
  ShieldCheck, 
  QrCode, 
  Tablet, 
  FileCheck2, 
  Sliders, 
  DoorClosed, 
  Users, 
  ClipboardCheck,
  Building2,
  Cpu
} from "lucide-react";

export const metadata: Metadata = {
  title: "Smart POP & Operational Passport | Enterprise Platform",
  description: "Plataforma Enterprise de POPs Dinâmicos, Carteira Digital de Habilitações e Controle de Execução Industrial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-industrial-500 selection:text-white">
        {/* Top Enterprise Bar */}
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand and System Identity */}
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="h-9 w-9 rounded-xl bg-industrial-700 flex items-center justify-center text-white shadow-sm ring-1 ring-industrial-600 transition-transform group-hover:scale-105">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-base tracking-tight flex items-center gap-2">
                      <span>Smart POP</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-industrial-100 text-industrial-700 dark:bg-industrial-950 dark:text-industrial-300 px-1.5 py-0.5 rounded border border-industrial-200 dark:border-industrial-800">
                        Enterprise
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                      Operational Passport & Execution Control
                    </p>
                  </div>
                </Link>
              </div>

              {/* Edge Gateway Status */}
              <div className="hidden lg:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Edge Agent:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">&lt; 15ms (Online)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-industrial-600" />
                  <span className="text-slate-600 dark:text-slate-300">Planta:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">São Bernardo (Matriz)</span>
                </div>
              </div>
            </div>

            {/* Navigation Strip */}
            <nav className="flex items-center gap-1 overflow-x-auto py-2 -mx-4 px-4 sm:mx-0 sm:px-0 border-t border-slate-100 dark:border-slate-800/60 no-scrollbar text-xs font-medium">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="h-4 w-4 text-industrial-600" />
                <span>Dashboard Executivo</span>
              </Link>

              <Link
                href="/passport"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <QrCode className="h-4 w-4 text-purple-600" />
                <span>Passaporte & QR Dinâmico</span>
              </Link>

              <Link
                href="/kiosk"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Tablet className="h-4 w-4 text-blue-600" />
                <span>Sala de Integração / Quiosque</span>
              </Link>

              <Link
                href="/ojt-signoff"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <span>OJT Sign-Off Presencial</span>
              </Link>

              <Link
                href="/poka-yoke"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Sliders className="h-4 w-4 text-amber-600" />
                <span>Poka-Yoke & Desbloqueio MES</span>
              </Link>

              <Link
                href="/turnstile-gate"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <DoorClosed className="h-4 w-4 text-rose-600" />
                <span>Simulador Catraca (Edge &lt;20ms)</span>
              </Link>

              <Link
                href="/rh-lifecycle"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Governança RH & CLT</span>
              </Link>

              <Link
                href="/lpa-audits"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <ClipboardCheck className="h-4 w-4 text-teal-600" />
                <span>Auditoria Escalonada (LPA)</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Industrial Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Smart POP & Operational Passport</span>
              <span>•</span>
              <span>Conformidade NR-01, NR-12 e CLT Art. 4º</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Edge Gateway v2.4 (SQLite Memory / Postgres Sync)</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Zero Cloud Bottleneck</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

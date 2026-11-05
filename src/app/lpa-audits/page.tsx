import prisma from "@/lib/prisma";
import LpaAuditsClient from "@/components/LpaAuditsClient";

export const dynamic = "force-dynamic";

export default async function LpaAuditsPage() {
  const [users, supervisors, assets, pops, pastAudits] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OPERADOR" },
      include: {
        passports: {
          include: { asset: true, pop: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERVISOR", "ENGENHEIRO_QUALIDADE", "GERENTE_PLANTA"] } },
    }),
    prisma.asset.findMany(),
    prisma.popDocument.findMany(),
    prisma.lpaAudit.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        auditor: true,
        operator: true,
        asset: true,
        pop: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Auditorias Escalonadas de Processo (LPA)</span>
              <span className="text-xs bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Pilar 3 • TWI & Poka-Yoke
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspeção por amostragem diária do supervisor, semanal da qualidade e mensal da gerência. Desvios críticos rebaixam preventivamente a habilitação para Nível 1.
            </p>
          </div>
        </div>
      </div>

      <LpaAuditsClient
        operators={users}
        auditors={supervisors}
        assets={assets}
        pops={pops}
        initialAudits={pastAudits}
      />
    </div>
  );
}

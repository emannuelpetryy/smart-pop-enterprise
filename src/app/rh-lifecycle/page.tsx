import prisma from "@/lib/prisma";
import RhLifecycleClient from "@/components/RhLifecycleClient";

export const dynamic = "force-dynamic";

export default async function RhLifecyclePage() {
  const [users, events, assets] = await Promise.all([
    prisma.user.findMany({
      include: {
        passports: {
          include: { asset: true, pop: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rhIntegrationEvent.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.findMany(),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Governança de RH & Ciclo de Vida do Colaborador</span>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Pilar 2 • TOTVS / Senior / SAP & eSocial
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sincronização em tempo real com sistemas HCM para admissão, transferência, afastamento médico (S-2230) e rescisão (S-2299), garantindo blindagem trabalhista estrita sob o Art. 4º da CLT.
            </p>
          </div>
        </div>
      </div>

      <RhLifecycleClient users={users} initialEvents={events} assets={assets} />
    </div>
  );
}

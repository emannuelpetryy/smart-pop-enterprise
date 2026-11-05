import prisma from "@/lib/prisma";
import TurnstileGateClient from "@/components/TurnstileGateClient";

export const dynamic = "force-dynamic";

export default async function TurnstileGatePage() {
  const [users, assets, accessLogs] = await Promise.all([
    prisma.user.findMany({
      include: {
        passports: {
          include: { asset: true },
        },
      },
      orderBy: { registrationNumber: "asc" },
    }),
    prisma.asset.findMany(),
    prisma.turnstileAccessLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Simulador de Catraca On-Premise (Access Edge Gateway)</span>
              <span className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                Latência &lt; 20ms • Offline-First
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Validação das regras de Zone Gating: Zona 0 (Portaria Externa - Art. 4º CLT) versus Zona 1 (Chão de Fábrica - Hard Gate com bloqueio por TWI / OJT).
            </p>
          </div>
        </div>
      </div>

      <TurnstileGateClient users={users} assets={assets} initialLogs={accessLogs} />
    </div>
  );
}

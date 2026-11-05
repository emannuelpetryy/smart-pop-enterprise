import prisma from "@/lib/prisma";
import PokaYokeClient from "@/components/PokaYokeClient";

export const dynamic = "force-dynamic";

export default async function PokaYokePage() {
  const [assets, users, recentChecklists] = await Promise.all([
    prisma.asset.findMany({
      include: { pops: true },
    }),
    prisma.user.findMany({
      where: { status: "ATIVO" },
      include: { passports: { include: { asset: true } } },
    }),
    prisma.pokaYokePreUseChecklist.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        asset: true,
        operator: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Poka-Yoke Digital & Desbloqueio MES</span>
              <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Pilar 3 • Controle Pré-Uso
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Checklist rápido de início de turno (30s) com intertravamento lógico no software MES. A máquina só inicia a ordem de produção após checklist aprovado por operador Nível 3.
            </p>
          </div>
        </div>
      </div>

      <PokaYokeClient assets={assets} users={users} pastChecklists={recentChecklists} />
    </div>
  );
}

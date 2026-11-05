import prisma from "@/lib/prisma";
import KioskTabletClient from "@/components/KioskTabletClient";

export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const users = await prisma.user.findMany({
    where: { status: "ATIVO" },
    include: {
      passports: {
        include: {
          asset: true,
          pop: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const pops = await prisma.popDocument.findMany({
    include: {
      asset: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Sala de Integração / Modo Quiosque Corporativo</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Pilar 2 • Blindagem CLT Art. 4º
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Interface tátil otimizada para tablets corporativos em quiosques de sala de capacitação. Elimina a necessidade de celular pessoal e cômputo indevido de horas extras.
            </p>
          </div>
        </div>
      </div>

      <KioskTabletClient users={users} pops={pops} />
    </div>
  );
}

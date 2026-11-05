import prisma from "@/lib/prisma";
import PassportClientView from "@/components/PassportClientView";

export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const users = await prisma.user.findMany({
    include: {
      passports: {
        include: {
          asset: true,
          pop: true,
        },
      },
    },
    orderBy: { registrationNumber: "asc" },
  });

  const assets = await prisma.asset.findMany({
    include: {
      pops: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Habilitação Operacional Inteligente</span>
              <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                Pilar 1
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Carteira digital granular por sub-atividade, 4 níveis TWI de proficiência e QR Code dinâmico com rotação TOTP de 30 segundos.
            </p>
          </div>
        </div>
      </div>

      <PassportClientView users={users} assets={assets} />
    </div>
  );
}

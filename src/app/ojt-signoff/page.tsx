import prisma from "@/lib/prisma";
import OjtSignOffClient from "@/components/OjtSignOffClient";

export const dynamic = "force-dynamic";

export default async function OjtSignoffPage() {
  const [users, supervisors, assets, pops, pastRecords] = await Promise.all([
    prisma.user.findMany({
      where: { role: "OPERADOR" },
      include: {
        passports: {
          include: { asset: true, pop: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "SUPERVISOR" },
    }),
    prisma.asset.findMany(),
    prisma.popDocument.findMany(),
    prisma.ojtSignOffRecord.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        supervisor: true,
        asset: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Homologação Presencial em Posto (OJT Sign-Off)</span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Pilar 3 • Controle de Execução
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Avaliação prática no chão de fábrica conduzida pelo supervisor de linha, com checagem de Key Safety Points, foto comprobatória e assinatura digital criptografada.
            </p>
          </div>
        </div>
      </div>

      <OjtSignOffClient
        operators={users}
        supervisors={supervisors}
        assets={assets}
        pops={pops}
        pastRecords={pastRecords}
      />
    </div>
  );
}

import type { SaldoConsolidado } from "@/lib/mock/computations";

import { ModuleCard } from "./module-card";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_PRECISE = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function SaldoCard({ saldo }: { saldo: SaldoConsolidado }) {
  return (
    <ModuleCard title="Saldo consolidado" subtitle="Patrimônio líquido total">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="tabular text-norte-primary font-mono text-4xl font-semibold tracking-tight dark:text-white">
            {BRL.format(saldo.total)}
          </p>
          <p className="text-muted-foreground tabular text-sm">
            Líquido: <span className="font-mono">{BRL_PRECISE.format(saldo.liquid)}</span>
          </p>
        </div>
        <ul className="border-border divide-border divide-y border-t pt-3">
          {saldo.byBank.map((b) => (
            <li key={b.bank} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">{b.bank}</span>
              <span className="tabular font-mono">{BRL_PRECISE.format(b.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ModuleCard>
  );
}

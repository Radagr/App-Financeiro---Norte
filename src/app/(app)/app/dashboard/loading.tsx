import { ModuleCard } from "@/components/dashboard/module-card";
import { ModuleSkeleton, StatSkeleton } from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="bg-muted h-3 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-56 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-9 w-72 animate-pulse rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ModuleCard title="Saldo consolidado">
            <StatSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-8">
          <ModuleCard title="Evolução patrimonial">
            <ModuleSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-8">
          <ModuleCard title="Fluxo de caixa">
            <ModuleSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-4">
          <ModuleCard title="Alocação">
            <ModuleSkeleton height="h-44" />
          </ModuleCard>
        </div>
        <div className="lg:col-span-12">
          <ModuleCard title="Metas">
            <ModuleSkeleton height="h-32" />
          </ModuleCard>
        </div>
      </div>
    </div>
  );
}

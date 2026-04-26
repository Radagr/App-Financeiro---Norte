import { ModuleCard } from "@/components/dashboard/module-card";
import { ModuleSkeleton, StatSkeleton } from "@/components/dashboard/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-3 w-20 animate-pulse rounded" />
        <div className="bg-muted h-9 w-56 animate-pulse rounded" />
        <div className="bg-muted/60 h-3 w-72 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ModuleCard title="Patrimônio">
            <StatSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-4">
          <ModuleCard title="Fluxo do mês">
            <StatSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-4">
          <ModuleCard title="Metas">
            <StatSkeleton />
          </ModuleCard>
        </div>
        <div className="lg:col-span-8">
          <ModuleCard title="Onde foi seu dinheiro">
            <ModuleSkeleton height="h-32" />
          </ModuleCard>
        </div>
        <div className="lg:col-span-4">
          <ModuleCard title="Insights">
            <ModuleSkeleton height="h-24" />
          </ModuleCard>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.2em] uppercase">
          em construção
        </p>
        <h1 className="text-norte-primary text-5xl font-semibold tracking-tight md:text-6xl">
          Norte
        </h1>
        <p className="text-muted-foreground max-w-md text-base text-balance md:text-lg">
          Sua vida financeira em um só lugar — saldo, fluxo, patrimônio e metas.
        </p>
      </div>
      <Button className="bg-norte-primary hover:bg-norte-secondary text-white">Em breve</Button>
      <p className="tabular text-muted-foreground text-xs">v0.0.1 · M0 foundation</p>
    </main>
  );
}

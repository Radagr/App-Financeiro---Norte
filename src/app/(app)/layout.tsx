import { redirect } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="bg-background min-h-screen">
      {/* App shell header */}
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          {/* Minimal compass mark — same SVG motif as login */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-norte-primary dark:text-primary shrink-0"
            aria-hidden
          >
            <path
              d="M10 2L12.5 9.5H18L13.5 13.5L15.5 18L10 14.5L4.5 18L6.5 13.5L2 9.5H7.5L10 2Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          </svg>

          <span className="text-norte-primary dark:text-primary text-sm font-semibold tracking-tight">
            Norte
          </span>
        </div>

        <ThemeToggle />
      </header>

      <main className="px-6 py-8">{children}</main>
    </div>
  );
}

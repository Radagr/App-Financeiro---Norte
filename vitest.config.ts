import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    env: {
      // Provide stub values for env validation during unit tests.
      // Real DB is never hit in unit tests; prisma is mocked or unused.
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test",
      DIRECT_URL: process.env.DIRECT_URL ?? "postgresql://test:test@localhost:5432/test",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "test-service-role-key",
    },
  },
});

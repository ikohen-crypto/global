import { NavLink, Outlet } from "react-router-dom";

import { APP_NAME, APP_TAGLINE } from "@/config/app";
import { useTheme } from "@/hooks/useTheme";

const navItems = [{ to: "/", label: "Scanner" }, { to: "/results", label: "Resultados" }];

export function AppShell() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen text-ink dark:text-stone-100">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/78 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/88">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pine text-sm font-bold tracking-[0.22em] text-white shadow-card">
              MOS
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-pine dark:text-stone-50">
                {APP_NAME}
              </p>
              <p className="text-xs text-slate-500 dark:text-stone-400">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
              Google Trends + autocompletado + heuristicas
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pine hover:text-pine dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-100 dark:hover:border-stone-500 dark:hover:text-stone-50"
            >
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-pine text-white shadow-card dark:bg-stone-700 dark:text-stone-50"
                        : "bg-white/80 text-slate-600 hover:bg-white hover:text-pine dark:bg-stone-900/90 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="card-surface px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-stone-500">
              Motor de tendencia
            </p>
            <p className="mt-1 text-sm font-semibold text-pine dark:text-stone-100">
              Momentum, aceleracion y consistencia
            </p>
          </div>
          <div className="card-surface px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-stone-500">
              Motor de saturacion
            </p>
            <p className="mt-1 text-sm font-semibold text-pine dark:text-stone-100">
              Genericidad, ruido y madurez del mercado
            </p>
          </div>
          <div className="card-surface px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-stone-500">
              Resultado
            </p>
            <p className="mt-1 text-sm font-semibold text-pine dark:text-stone-100">
              Movimiento, oportunidades y desventajas
            </p>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

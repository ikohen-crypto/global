import { getHeaderCountries } from "@/lib/countries";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const countries = await getHeaderCountries();

  return (
    <div className="min-h-screen notranslate" translate="no" suppressHydrationWarning>
      <Header countries={countries} />
      <main className="notranslate" translate="no" suppressHydrationWarning>
        {children}
      </main>
      <Footer />
    </div>
  );
}

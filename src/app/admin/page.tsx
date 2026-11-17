import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Editor · Martin",
  // Nunca en buscadores.
  robots: { index: false, follow: false },
};

/** Editor de la tienda: todo pasa en el navegador, con la sesión de Supabase. */
export default function AdminPage() {
  return (
    <main className="min-h-svh bg-paper text-ink">
      <AdminApp />
    </main>
  );
}

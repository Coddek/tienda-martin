"use client";

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from "react";
import { refrescarCatalogo } from "@/app/admin/actions";
import { WordmarkImage } from "@/components/brand/Wordmark";
import { loadProductos, type Producto } from "@/lib/admin-data";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { IngresoTab } from "./IngresoTab";
import { MovimientosTab } from "./MovimientosTab";
import { ProductosTab } from "./ProductosTab";
import { btn, ErrorText, Field, inputClass } from "./ui";

type Tab = "cargar" | "productos" | "historial";

const TABS: { id: Tab; label: string }[] = [
  { id: "cargar", label: "Cargar" },
  { id: "productos", label: "Productos" },
  { id: "historial", label: "Historial" },
];

/** Las categorías de siempre, más las que ya se usaron. */
const BASE_CATEGORIES = ["Sandalias", "Zapatos", "Botas", "Zapatillas"];

/**
 * Editor de la tienda. Entran las mismas personas que usan Cierre Caja, con el
 * mismo mail y contraseña: una sesión de Supabase no alcanza (el proyecto lo
 * comparten otras apps), tiene que estar en la lista usuarios_caja.
 */
export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const handle = async (next: Session | null) => {
      if (!next) {
        setSession(null);
        setNombre(null);
        return;
      }
      const { data } = await supabase.from("usuarios_caja").select("nombre").eq("id", next.user.id).maybeSingle();
      if (data?.nombre) {
        setAuthError(null);
        setSession(next);
        setNombre(data.nombre as string);
      } else {
        setAuthError("Esta cuenta no tiene acceso al editor de la tienda.");
        setSession(null);
        setNombre(null);
        await supabase.auth.signOut();
      }
    };
    supabase.auth.getSession().then(({ data }) => handle(data.session).finally(() => setChecking(false)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      // Fuera del callback: Supabase recomienda no esperar otras consultas adentro.
      window.setTimeout(() => handle(next), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return <p className="py-24 text-center text-ink-soft">Cargando…</p>;
  }
  if (!session) return <Login error={authError} />;
  return <Editor session={session} nombre={nombre} />;
}

function Login({ error }: { error: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error: signInError } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (signInError) {
      setMessage(
        /invalid login/i.test(signInError.message)
          ? "Mail o contraseña incorrectos. Son los mismos de Cierre Caja."
          : "No se pudo entrar. Revisá la conexión y probá de nuevo.",
      );
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-5 py-12">
      <WordmarkImage label="Martin" className="h-8 self-center text-ink" />
      <h1 className="text-center font-display text-3xl">Editor de la tienda</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Mail">
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Contraseña" hint="La misma de Cierre Caja.">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <ErrorText>{message ?? error}</ErrorText>
        <button type="submit" disabled={busy} className={btn.cta}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function Editor({ session, nombre }: { session: Session; nombre: string | null }) {
  const [tab, setTab] = useState<Tab>("cargar");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setProductos(await loadProductos());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los productos.");
    }
  }, []);

  useEffect(() => {
    // Primera carga de la lista (es una consulta a Supabase, no un estado derivado).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  /** Después de cada cambio: lista al día y la página pública refrescada al instante. */
  const onSaved = useCallback(async () => {
    await reload();
    try {
      await refrescarCatalogo(session.access_token);
    } catch {
      // Si falla, la página igual se actualiza sola en un minuto.
    }
  }, [reload, session.access_token]);

  const categorias = useMemo(
    () => Array.from(new Set([...BASE_CATEGORIES, ...productos.map((p) => p.categoria)])),
    [productos],
  );

  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 pt-4 pb-28">
      <header className="flex items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <WordmarkImage label="Martin" className="h-5 text-ink" />
          <span className="text-xs font-medium tracking-[0.14em] text-ink-soft uppercase">Editor</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-ink-soft sm:inline">{nombre}</span>
          <a href="/" target="_blank" rel="noopener noreferrer" className={btn.link}>
            Ver página
          </a>
          <button type="button" onClick={() => supabaseBrowser().auth.signOut()} className={btn.link}>
            Salir
          </button>
        </div>
      </header>

      <ErrorText>{error}</ErrorText>

      {tab === "cargar" ? <IngresoTab productos={productos} categorias={categorias} onSaved={onSaved} /> : null}
      {tab === "productos" ? <ProductosTab productos={productos} categorias={categorias} onSaved={onSaved} /> : null}
      {tab === "historial" ? <MovimientosTab /> : null}

      {/* Pestañas abajo, a mano del pulgar. */}
      <nav
        aria-label="Secciones del editor"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-mint bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-xl grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
              className={`min-h-16 text-sm font-semibold tracking-[0.06em] uppercase ${
                tab === t.id ? "text-ink" : "text-ink-soft"
              }`}
            >
              <span className={`inline-block border-b-2 pb-1 ${tab === t.id ? "border-rust" : "border-transparent"}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

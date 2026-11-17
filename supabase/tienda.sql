-- Tienda Martin: catálogo y stock por modelo, color y talle.
--
-- Vive en el mismo proyecto de Supabase que Cierre Caja (y Asiento Contable):
-- todas las tablas llevan prefijo tienda_ y no se toca nada ajeno. Quién puede
-- editar sale de la lista de Cierre Caja (usuarios_caja, función is_usuario_caja).
--
-- Cómo se aplica: SQL Editor de Supabase, pegar este archivo completo y correr.
-- Se puede correr más de una vez (usa IF NOT EXISTS / CREATE OR REPLACE).

-- ---------- TABLAS ----------

-- Un modelo (ej. ref. 6291.900, "Sandalia Paris").
CREATE TABLE IF NOT EXISTS tienda_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parte final de la dirección: /producto/<slug>.
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ref TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  -- Pesos, sin decimales.
  precio INTEGER NOT NULL CHECK (precio > 0),
  precio_anterior INTEGER CHECK (precio_anterior IS NULL OR precio_anterior > precio),
  etiqueta TEXT CHECK (etiqueta IN ('nuevo', 'ultimos', 'oferta')),
  -- Aparece en la pasarela "Lo más elegido" de la portada.
  destacado BOOLEAN NOT NULL DEFAULT false,
  -- false = no se muestra en la página (sin borrar el historial).
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un color de un modelo, con su foto (ej. "Negro 01", código de color 15745).
CREATE TABLE IF NOT EXISTS tienda_colores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES tienda_productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  -- Color del botón redondo en la página (#RRGGBB).
  muestra TEXT NOT NULL DEFAULT '#1E1E1E' CHECK (muestra ~ '^#[0-9A-Fa-f]{6}$'),
  -- Código de color del fabricante, el último número de la etiqueta (opcional).
  codigo_color TEXT,
  -- Ruta dentro del bucket tienda-fotos; null = todavía sin foto.
  foto_path TEXT,
  foto_ancho INTEGER CHECK (foto_ancho IS NULL OR foto_ancho > 0),
  foto_alto INTEGER CHECK (foto_alto IS NULL OR foto_alto > 0),
  foto_alt TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (producto_id, nombre)
);

-- Un talle de un color: es la unidad de stock.
CREATE TABLE IF NOT EXISTS tienda_talles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_id UUID NOT NULL REFERENCES tienda_colores(id) ON DELETE CASCADE,
  -- El talle que se muestra (argentino) y su equivalente brasileño de la etiqueta.
  talle_ar SMALLINT NOT NULL CHECK (talle_ar BETWEEN 15 AND 50),
  talle_br SMALLINT CHECK (talle_br IS NULL OR talle_br BETWEEN 14 AND 49),
  -- Lo mantiene el trigger de tienda_movimientos: no se edita a mano.
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (color_id, talle_ar)
);

-- Código de barras (EAN-13 de la caja) → par. Verificado con dos cajas de
-- Vizzano: cada talle trae su propio código. Si algún día aparece un código
-- compartido entre talles, se guarda con talle_id null y la app pide el talle.
CREATE TABLE IF NOT EXISTS tienda_codigos (
  codigo TEXT PRIMARY KEY CHECK (codigo ~ '^[0-9]{8,14}$'),
  color_id UUID NOT NULL REFERENCES tienda_colores(id) ON DELETE CASCADE,
  talle_id UUID REFERENCES tienda_talles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial: cada entrada o salida de un par. El stock es la suma de esto.
CREATE TABLE IF NOT EXISTS tienda_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talle_id UUID NOT NULL REFERENCES tienda_talles(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad <> 0),
  motivo TEXT NOT NULL CHECK (motivo IN ('ingreso', 'venta', 'devolucion', 'ajuste')),
  -- Venta de Cierre Caja que lo originó (fase 3).
  venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
  codigo TEXT,
  -- true cuando se vendió un par que el sistema tenía en 0: hay que revisar el conteo.
  diferencia BOOLEAN NOT NULL DEFAULT false,
  nota TEXT,
  usuario_id UUID DEFAULT auth.uid() REFERENCES usuarios_caja(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tienda_colores_producto ON tienda_colores(producto_id);
CREATE INDEX IF NOT EXISTS idx_tienda_talles_color ON tienda_talles(color_id);
CREATE INDEX IF NOT EXISTS idx_tienda_codigos_color ON tienda_codigos(color_id);
CREATE INDEX IF NOT EXISTS idx_tienda_codigos_talle ON tienda_codigos(talle_id);
CREATE INDEX IF NOT EXISTS idx_tienda_movimientos_talle ON tienda_movimientos(talle_id);
CREATE INDEX IF NOT EXISTS idx_tienda_movimientos_venta ON tienda_movimientos(venta_id);
CREATE INDEX IF NOT EXISTS idx_tienda_movimientos_usuario ON tienda_movimientos(usuario_id);

-- ---------- STOCK ----------

-- Cada movimiento suma o resta al talle. Si se vende un par que figuraba en 0,
-- la venta no se bloquea (la caja nunca se traba): el stock queda en 0 y el
-- movimiento se marca como diferencia para revisar el conteo.
CREATE OR REPLACE FUNCTION tienda_aplicar_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  -- Quién lo hizo y si hubo diferencia los decide la base, no quien carga:
  -- así nadie puede anotar un movimiento a nombre de otra persona.
  NEW.usuario_id := auth.uid();
  SELECT stock INTO v_stock FROM tienda_talles WHERE id = NEW.talle_id FOR UPDATE;
  NEW.diferencia := v_stock + NEW.cantidad < 0;
  UPDATE tienda_talles SET stock = GREATEST(v_stock + NEW.cantidad, 0) WHERE id = NEW.talle_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tienda_aplicar_movimiento ON tienda_movimientos;
CREATE TRIGGER trg_tienda_aplicar_movimiento
  BEFORE INSERT ON tienda_movimientos
  FOR EACH ROW EXECUTE FUNCTION tienda_aplicar_movimiento();

-- El historial no se edita ni se borra: un error se corrige con otro movimiento.
CREATE OR REPLACE FUNCTION tienda_movimientos_inmutables()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Los movimientos de stock no se modifican: cargá un ajuste.';
END;
$$;

DROP TRIGGER IF EXISTS trg_tienda_movimientos_inmutables ON tienda_movimientos;
CREATE TRIGGER trg_tienda_movimientos_inmutables
  BEFORE UPDATE OR DELETE ON tienda_movimientos
  FOR EACH ROW
  -- El borrado en cascada al eliminar un talle sí se permite: corre dentro de
  -- un trigger de clave foránea (pg_trigger_depth >= 1).
  WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION tienda_movimientos_inmutables();

-- El stock solo cambia por movimientos: un talle nuevo arranca en 0 y un
-- UPDATE directo de stock se rechaza. El trigger de movimientos corre un nivel
-- más adentro (pg_trigger_depth = 2), y ese sí puede.
CREATE OR REPLACE FUNCTION tienda_proteger_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stock := 0;
  ELSIF NEW.stock IS DISTINCT FROM OLD.stock AND pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION 'El stock no se edita directo: cargá un ingreso o un ajuste.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tienda_proteger_stock ON tienda_talles;
CREATE TRIGGER trg_tienda_proteger_stock
  BEFORE INSERT OR UPDATE ON tienda_talles
  FOR EACH ROW EXECUTE FUNCTION tienda_proteger_stock();

CREATE OR REPLACE FUNCTION tienda_tocar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tienda_productos_updated_at ON tienda_productos;
CREATE TRIGGER trg_tienda_productos_updated_at
  BEFORE UPDATE ON tienda_productos
  FOR EACH ROW EXECUTE FUNCTION tienda_tocar_updated_at();

-- ---------- CATÁLOGO PÚBLICO ----------

-- Lo único que ve la página (sin sesión): modelos activos con al menos un
-- color con foto. El stock sale como nivel, nunca como número exacto.
CREATE OR REPLACE FUNCTION tienda_catalogo_publico()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(p.item ORDER BY p.orden, p.created_at), '[]'::jsonb)
  FROM (
    SELECT
      pr.orden,
      pr.created_at,
      jsonb_build_object(
        'id', pr.slug,
        'ref', pr.ref,
        'name', pr.nombre,
        'category', pr.categoria,
        'price', pr.precio,
        'compareAtPrice', pr.precio_anterior,
        'tag', pr.etiqueta,
        'featured', pr.destacado,
        'variants', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'color', c.nombre,
              'swatch', c.muestra,
              'photoPath', c.foto_path,
              'photoWidth', c.foto_ancho,
              'photoHeight', c.foto_alto,
              'photoAlt', COALESCE(c.foto_alt, pr.nombre || ' ' || c.nombre),
              'sizes', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'size', t.talle_ar,
                    'sizeBr', t.talle_br,
                    'stock', CASE
                      WHEN t.stock <= 0 THEN 'agotado'
                      WHEN t.stock = 1 THEN 'ultimo'
                      WHEN t.stock = 2 THEN 'quedan2'
                      ELSE 'disponible'
                    END
                  )
                  ORDER BY t.talle_ar
                )
                FROM tienda_talles t
                WHERE t.color_id = c.id
              ), '[]'::jsonb)
            )
            ORDER BY c.orden, c.created_at
          )
          FROM tienda_colores c
          WHERE c.producto_id = pr.id AND c.foto_path IS NOT NULL
        )
      ) AS item
    FROM tienda_productos pr
    WHERE pr.activo
      AND EXISTS (
        SELECT 1 FROM tienda_colores c
        WHERE c.producto_id = pr.id AND c.foto_path IS NOT NULL
      )
  ) p;
$$;

-- ---------- RLS ----------

ALTER TABLE tienda_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_colores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_talles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_codigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_movimientos ENABLE ROW LEVEL SECURITY;

-- Las mismas personas que usan Cierre Caja manejan la tienda.
DROP POLICY IF EXISTS "tienda_productos_usuarios_caja" ON tienda_productos;
CREATE POLICY "tienda_productos_usuarios_caja" ON tienda_productos
  FOR ALL TO authenticated
  USING (is_usuario_caja((select auth.uid())))
  WITH CHECK (is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_colores_usuarios_caja" ON tienda_colores;
CREATE POLICY "tienda_colores_usuarios_caja" ON tienda_colores
  FOR ALL TO authenticated
  USING (is_usuario_caja((select auth.uid())))
  WITH CHECK (is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_talles_usuarios_caja" ON tienda_talles;
CREATE POLICY "tienda_talles_usuarios_caja" ON tienda_talles
  FOR ALL TO authenticated
  USING (is_usuario_caja((select auth.uid())))
  WITH CHECK (is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_codigos_usuarios_caja" ON tienda_codigos;
CREATE POLICY "tienda_codigos_usuarios_caja" ON tienda_codigos
  FOR ALL TO authenticated
  USING (is_usuario_caja((select auth.uid())))
  WITH CHECK (is_usuario_caja((select auth.uid())));

-- Movimientos: se leen y se agregan, nunca se editan (ver trigger).
DROP POLICY IF EXISTS "tienda_movimientos_select" ON tienda_movimientos;
CREATE POLICY "tienda_movimientos_select" ON tienda_movimientos
  FOR SELECT TO authenticated
  USING (is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_movimientos_insert" ON tienda_movimientos;
CREATE POLICY "tienda_movimientos_insert" ON tienda_movimientos
  FOR INSERT TO authenticated
  WITH CHECK (is_usuario_caja((select auth.uid())));

-- ---------- PERMISOS ----------

-- Sin sesión no se toca ninguna tabla: la página lee solo por la función pública.
REVOKE ALL ON tienda_productos, tienda_colores, tienda_talles, tienda_codigos, tienda_movimientos FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON tienda_productos, tienda_colores, tienda_talles, tienda_codigos, tienda_movimientos FROM authenticated;
REVOKE UPDATE, DELETE ON tienda_movimientos FROM authenticated;

REVOKE EXECUTE ON FUNCTION tienda_catalogo_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION tienda_catalogo_publico() TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION tienda_aplicar_movimiento() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION tienda_movimientos_inmutables() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION tienda_tocar_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION tienda_proteger_stock() FROM PUBLIC, anon, authenticated;

-- ---------- FOTOS ----------

-- Bucket público de lectura (las fotos se ven en la página); suben y borran
-- solo los usuarios de Cierre Caja. Máximo 2 MB por foto (se comprimen antes).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tienda-fotos', 'tienda-fotos', true, 2097152, ARRAY['image/webp', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tienda_fotos_insert" ON storage.objects;
CREATE POLICY "tienda_fotos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tienda-fotos' AND is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_fotos_update" ON storage.objects;
CREATE POLICY "tienda_fotos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tienda-fotos' AND is_usuario_caja((select auth.uid())));

DROP POLICY IF EXISTS "tienda_fotos_delete" ON storage.objects;
CREATE POLICY "tienda_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tienda-fotos' AND is_usuario_caja((select auth.uid())));

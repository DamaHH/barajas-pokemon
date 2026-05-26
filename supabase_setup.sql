-- =======================================================
-- CONFIGURACIÓN DE TABLAS Y POLÍTICAS RLS PARA DAMARIS TCG
-- Copia y pega este script completo en el SQL Editor de tu Supabase
-- =======================================================

-- 1. Limpieza previa (opcional por si se ejecuta de nuevo)
DROP TABLE IF EXISTS public.partidas CASCADE;
DROP TABLE IF EXISTS public.mazos CASCADE;
DROP TABLE IF EXISTS public.inventario CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 2. Creación de la Tabla: usuarios (Pérfil público de entrenadores)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS para usuarios
CREATE POLICY "Lectura pública de perfiles" ON public.usuarios
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insertar propio perfil" ON public.usuarios
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Actualizar propio perfil" ON public.usuarios
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 3. Creación de la Tabla: inventario (Cartas obtenidas y sobres)
CREATE TABLE public.inventario (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cartas JSONB DEFAULT '[]'::jsonb NOT NULL,
    sobres_disponibles INTEGER DEFAULT 3 NOT NULL,
    recargas INTEGER DEFAULT 0 NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en inventario
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS para inventario
CREATE POLICY "Lectura del propio inventario" ON public.inventario
    FOR SELECT TO authenticated USING (auth.uid() = id_usuario);

CREATE POLICY "Inserción del propio inventario" ON public.inventario
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Modificación del propio inventario" ON public.inventario
    FOR UPDATE TO authenticated USING (auth.uid() = id_usuario) WITH CHECK (auth.uid() = id_usuario);


-- 4. Creación de la Tabla: mazos (Mazo activo de 5 cartas)
CREATE TABLE public.mazos (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cartas JSONB DEFAULT '[]'::jsonb NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en mazos
ALTER TABLE public.mazos ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS para mazos
CREATE POLICY "Lectura del propio mazo" ON public.mazos
    FOR SELECT TO authenticated USING (auth.uid() = id_usuario);

CREATE POLICY "Inserción del propio mazo" ON public.mazos
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Modificación del propio mazo" ON public.mazos
    FOR UPDATE TO authenticated USING (auth.uid() = id_usuario) WITH CHECK (auth.uid() = id_usuario);


-- 5. Creación de la Tabla: partidas (Duelos online sincronizados)
CREATE TABLE public.partidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_jugador1 UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    id_jugador2 UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'esperando'::text NOT NULL,
    ganador UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    estado_juego JSONB DEFAULT '{}'::jsonb NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT partidas_estado_check CHECK (estado = ANY (ARRAY['esperando'::text, 'en_curso'::text, 'finalizada'::text]))
);

-- Habilitar RLS en partidas
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS para partidas
CREATE POLICY "Lectura pública de partidas" ON public.partidas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Creación de partidas" ON public.partidas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_jugador1 OR auth.uid() = id_jugador2);

CREATE POLICY "Actualizar partidas" ON public.partidas
    FOR UPDATE TO authenticated 
    USING (
        auth.uid() = id_jugador1 OR 
        id_jugador2 IS NULL OR 
        auth.uid() = id_jugador2
    )
    WITH CHECK (
        auth.uid() = id_jugador1 OR 
        auth.uid() = id_jugador2
    );

-- 6. Habilitar Replicación en Tiempo Real (Realtime) para las partidas
-- Esto es crucial para sincronizar las jugadas al instante
alter publication supabase_realtime add table public.partidas;

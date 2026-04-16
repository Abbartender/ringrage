-- =============================================
-- Ring Rage — Schema de base de datos Supabase
-- Ejecutar en: Supabase > SQL Editor
-- =============================================

-- Tabla de residentes (adultos mayores)
create table residentes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  ciudad text,
  pais text default 'MX',
  telefono text,
  creado_en timestamptz default now()
);

-- Contactos de confianza de cada residente (familiares)
create table contactos (
  id uuid primary key default gen_random_uuid(),
  residente_id uuid references residentes(id) on delete cascade,
  nombre text not null,
  telefono text not null,  -- formato: +5491112345678
  relacion text,           -- hijo, hija, nieto, cuidador, etc.
  creado_en timestamptz default now()
);

-- Empresas verificadas
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rubro text,
  antiguedad text,
  telefono text unique not null,
  contacto_previo text,
  cobro_efectivo text,
  identificacion text,
  datos_bancarios text,
  codigo text unique not null,
  activa boolean default true,
  creado_en timestamptz default now()
);

-- Historial de visitas (activo de datos clave)
create table visitas (
  id uuid primary key default gen_random_uuid(),
  residente_id uuid references residentes(id),
  empresa_id uuid references empresas(id),
  codigo_presentado text,
  nivel_riesgo text check (nivel_riesgo in ('bajo', 'medio', 'alto')),
  motivos_riesgo text[],
  video_url text,
  timestamp timestamptz default now()
);

-- Índices para performance
create index on contactos(residente_id);
create index on visitas(residente_id);
create index on visitas(empresa_id);
create index on visitas(timestamp desc);
create index on empresas(codigo);

-- =============================================
-- Datos de prueba para el demo
-- =============================================

insert into residentes (nombre, direccion, ciudad, pais, telefono)
values ('María González', 'Av. Corrientes 1234', 'Buenos Aires', 'AR', '+5491112345678');

insert into contactos (residente_id, nombre, telefono, relacion)
select id, 'Carlos González', '+5491187654321', 'hijo'
from residentes where nombre = 'María González';

insert into empresas (nombre, rubro, antiguedad, telefono, contacto_previo, cobro_efectivo, identificacion, datos_bancarios, codigo)
values 
  ('Plomería García', 'Plomería / gas', 'Más de 3 años', '+5491155556666', 'Turno previo', 'Solo si hay acuerdo previo', 'Sí, uniforme + credencial', 'Jamás', 'GAR-4872'),
  ('Delivery Rápido', 'Delivery', '1 a 3 años', '+5491177778888', 'WhatsApp', 'Nunca', 'Solo credencial', 'Jamás', 'DEL-2341');

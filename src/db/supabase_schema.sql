-- ====================================================================
-- BFP GARAGE - SCHEMA POSTGRESQL / SUPABASE
-- RÈGLE ABSOLUE : AUCUN CHAMP MÉTIER OBLIGATOIRE (TOUTES COLONNES NULLABLES)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE: CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLE: VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    license_plate TEXT,
    brand TEXT,
    model TEXT,
    year INTEGER,
    motorisation TEXT,
    engine_code TEXT,
    fuel_type TEXT,
    power_ch INTEGER,
    power_fiscal INTEGER,
    vin TEXT,
    mileage INTEGER,
    color TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLE: RECEPTIONS
CREATE TABLE IF NOT EXISTS public.receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    reception_date DATE DEFAULT CURRENT_DATE,
    reception_time TEXT,
    mileage_in INTEGER,
    fuel_level TEXT,
    general_state TEXT,
    damages_noted TEXT,
    damages_points JSONB,
    reserves TEXT,
    comments TEXT,
    requested_works TEXT,
    signature_data_url TEXT,
    signature_signer_name TEXT,
    mechanic TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLE: RECEPTION_PHOTOS
CREATE TABLE IF NOT EXISTS public.reception_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID REFERENCES public.receptions(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    photo_url TEXT,
    category TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABLE: INTERVENTIONS
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    reception_id UUID REFERENCES public.receptions(id) ON DELETE SET NULL,
    title TEXT,
    status TEXT DEFAULT 'a_faire',
    start_date DATE,
    end_date DATE,
    estimated_duration_hours NUMERIC,
    actual_duration_hours NUMERIC,
    lead_mechanic TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABLE: TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    category TEXT,
    description TEXT,
    status TEXT DEFAULT 'a_faire',
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    mechanic TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABLE: PARTS (GARAGE SANS STOCK - COMMANDE À LA DEMANDE)
CREATE TABLE IF NOT EXISTS public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation TEXT,
    reference TEXT,
    brand TEXT,
    supplier TEXT,
    price_buy_ht NUMERIC,
    price_sell_ttc NUMERIC,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'a_commander', -- 'a_commander', 'commandee', 'recue'
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    order_date DATE,
    delivery_expected_date DATE,
    delivery_actual_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABLE: APPOINTMENTS (PLANNING ATELIER 4 PONTS)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    date DATE,
    time TEXT,
    duration_minutes INTEGER DEFAULT 60,
    purpose TEXT,
    description TEXT,
    mechanic TEXT,
    lift TEXT DEFAULT 'pont_1', -- 'pont_1', 'pont_2', 'pont_3', 'pont_4', 'sans_pont'
    status TEXT DEFAULT 'confirme',
    priority TEXT DEFAULT 'normale',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABLE: DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    doc_type TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    reception_id UUID REFERENCES public.receptions(id) ON DELETE SET NULL,
    intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
    part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABLE: ACTIVITY_LOGS (HISTORIQUE GLOBAL)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    action TEXT,
    user_name TEXT DEFAULT 'Atelier BFP',
    entity_type TEXT,
    entity_id UUID,
    details TEXT,
    client_id UUID,
    vehicle_id UUID,
    reception_id UUID,
    intervention_id UUID
);

-- INDEXES POUR RECHERCHE RAPIDE ET BASE DE CONNAISSANCES
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON public.vehicles(brand, model);
CREATE INDEX IF NOT EXISTS idx_parts_vehicle_id ON public.parts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parts_status ON public.parts(status);
CREATE INDEX IF NOT EXISTS idx_parts_reference ON public.parts(reference);
CREATE INDEX IF NOT EXISTS idx_interventions_vehicle_id ON public.interventions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_receptions_vehicle_id ON public.receptions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_lift ON public.appointments(date, lift);

-- RLS (ROW LEVEL SECURITY)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: ACCÈS COMPLET POUR LES UTILISATEURS DU GARAGE (AUTH)
CREATE POLICY "Garage staff all access clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Garage staff all access vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Garage staff all access receptions" ON public.receptions FOR ALL USING (true);
CREATE POLICY "Garage staff all access reception_photos" ON public.reception_photos FOR ALL USING (true);
CREATE POLICY "Garage staff all access interventions" ON public.interventions FOR ALL USING (true);
CREATE POLICY "Garage staff all access tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Garage staff all access parts" ON public.parts FOR ALL USING (true);
CREATE POLICY "Garage staff all access appointments" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Garage staff all access documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Garage staff all access activity_logs" ON public.activity_logs FOR ALL USING (true);

-- CONFIGURATION STORAGE BUCKETS (SUPABASE STORAGE)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reception-photos', 'reception-photos', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

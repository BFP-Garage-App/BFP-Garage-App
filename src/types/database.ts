/**
 * BFP GARAGE - Database Types
 * RÈGLE ABSOLUE : AUCUN CHAMP OBLIGATOIRE.
 * Tous les champs métier sont optionnels (nullable / undefined).
 */

export type FuelType = 'Diesel' | 'Essence' | 'Hybride' | 'Électrique' | 'GPL' | 'Autre';

export type PartStatus = 'a_commander' | 'commandee' | 'recue';

export type InterventionStatus = 'a_faire' | 'en_cours' | 'attente_pieces' | 'termine' | 'annule';

export type TaskStatus = 'a_faire' | 'en_cours' | 'attente_pieces' | 'termine' | 'annule';

export type LiftType = 'pont_1' | 'pont_2' | 'pont_3' | 'pont_4' | 'sans_pont';

export type AppointmentStatus = 'confirme' | 'en_attente' | 'en_cours' | 'termine' | 'annule';

export type AppointmentPriority = 'normale' | 'urgente' | 'basse';

export type PhotoCategory =
  | 'avant'
  | 'arriere'
  | 'cote_gauche'
  | 'cote_droit'
  | 'interieur'
  | 'tableau_de_bord'
  | 'moteur'
  | 'roue'
  | 'dommage'
  | 'autre';

export type DocumentType =
  | 'devis'
  | 'facture'
  | 'controle_technique'
  | 'carte_grise'
  | 'rapport'
  | 'bon_commande'
  | 'autre';

export interface Client {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  client_id?: string | null;
  license_plate?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  motorisation?: string | null;
  engine_code?: string | null;
  fuel_type?: FuelType | string | null;
  power_ch?: number | null;
  power_fiscal?: number | null;
  vin?: string | null;
  mileage?: number | null;
  color?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reception {
  id: string;
  vehicle_id?: string | null;
  client_id?: string | null;
  reception_date?: string | null;
  reception_time?: string | null;
  mileage_in?: number | null;
  fuel_level?: string | null;
  general_state?: string | null;
  damages_noted?: string | null;
  damages_points?: DamagePoint[] | null;
  reserves?: string | null;
  comments?: string | null;
  requested_works?: string | null;
  signature_data_url?: string | null;
  signature_signer_name?: string | null;
  mechanic?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DamagePoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  view: 'top' | 'side_left' | 'side_right' | 'front' | 'rear';
  label?: string;
  severity?: 'leger' | 'moyen' | 'important';
}

export interface ReceptionPhoto {
  id: string;
  reception_id?: string | null;
  vehicle_id?: string | null;
  photo_url?: string | null;
  category?: PhotoCategory | string | null;
  comment?: string | null;
  created_at: string;
}

export interface Intervention {
  id: string;
  vehicle_id?: string | null;
  client_id?: string | null;
  reception_id?: string | null;
  title?: string | null;
  status?: InterventionStatus | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_duration_hours?: number | null;
  actual_duration_hours?: number | null;
  lead_mechanic?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  intervention_id?: string | null;
  vehicle_id?: string | null;
  category?: string | null;
  description?: string | null;
  status?: TaskStatus | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  mechanic?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  designation?: string | null;
  reference?: string | null;
  brand?: string | null;
  supplier?: string | null;
  price_buy_ht?: number | null;
  price_sell_ttc?: number | null;
  quantity?: number | null;
  status?: PartStatus | null;
  vehicle_id?: string | null;
  intervention_id?: string | null;
  task_id?: string | null;
  order_date?: string | null;
  delivery_expected_date?: string | null;
  delivery_actual_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id?: string | null;
  vehicle_id?: string | null;
  date?: string | null;
  time?: string | null;
  duration_minutes?: number | null;
  purpose?: string | null;
  description?: string | null;
  mechanic?: string | null;
  lift?: LiftType | null;
  status?: AppointmentStatus | null;
  priority?: AppointmentPriority | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  title?: string | null;
  doc_type?: DocumentType | string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  client_id?: string | null;
  vehicle_id?: string | null;
  reception_id?: string | null;
  intervention_id?: string | null;
  part_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user_name: string;
  entity_type:
    | 'client'
    | 'vehicle'
    | 'reception'
    | 'intervention'
    | 'task'
    | 'part'
    | 'appointment'
    | 'document';
  entity_id?: string | null;
  details?: string | null;
  client_id?: string | null;
  vehicle_id?: string | null;
  reception_id?: string | null;
  intervention_id?: string | null;
}

export interface GarageSettings {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  siret?: string;
  tva?: string;
  hourly_rate?: number;
  mechanics: string[];
  supabase_url?: string;
  supabase_anon_key?: string;
  is_supabase_connected?: boolean;
}

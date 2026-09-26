/**
 * BFP GARAGE - Local & Supabase-ready Storage Engine
 * Enforce ABSOLUTE RULE: AUCUN CHAMP OBLIGATOIRE.
 * All updates and inserts accept incomplete or empty objects.
 */

import {
  Client,
  Vehicle,
  Reception,
  ReceptionPhoto,
  Intervention,
  Task,
  Part,
  Appointment,
  DocumentRecord,
  ActivityLog,
  GarageSettings,
  PartStatus,
} from '../types/database';
import {
  initialClients,
  initialVehicles,
  initialReceptions,
  initialPhotos,
  initialInterventions,
  initialTasks,
  initialParts,
  initialAppointments,
  initialDocuments,
  initialActivityLogs,
  initialGarageSettings,
} from './initialData';

const STORAGE_KEYS = {
  CLIENTS: 'bfp_garage_clients_v1',
  VEHICLES: 'bfp_garage_vehicles_v1',
  RECEPTIONS: 'bfp_garage_receptions_v1',
  PHOTOS: 'bfp_garage_photos_v1',
  INTERVENTIONS: 'bfp_garage_interventions_v1',
  TASKS: 'bfp_garage_tasks_v1',
  PARTS: 'bfp_garage_parts_v1',
  APPOINTMENTS: 'bfp_garage_appointments_v1',
  DOCUMENTS: 'bfp_garage_documents_v1',
  LOGS: 'bfp_garage_logs_v1',
  SETTINGS: 'bfp_garage_settings_v1',
};

// Helper for UUID generation
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'bfp-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error loading key ${key} from storage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to storage:`, error);
  }
}

// In-memory / localStorage database singleton
class GarageStorage {
  private clients: Client[];
  private vehicles: Vehicle[];
  private receptions: Reception[];
  private photos: ReceptionPhoto[];
  private interventions: Intervention[];
  private tasks: Task[];
  private parts: Part[];
  private appointments: Appointment[];
  private documents: DocumentRecord[];
  private logs: ActivityLog[];
  private settings: GarageSettings;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.clients = loadFromStorage(STORAGE_KEYS.CLIENTS, initialClients);
    this.vehicles = loadFromStorage(STORAGE_KEYS.VEHICLES, initialVehicles);
    this.receptions = loadFromStorage(STORAGE_KEYS.RECEPTIONS, initialReceptions);
    this.photos = loadFromStorage(STORAGE_KEYS.PHOTOS, initialPhotos);
    this.interventions = loadFromStorage(STORAGE_KEYS.INTERVENTIONS, initialInterventions);
    this.tasks = loadFromStorage(STORAGE_KEYS.TASKS, initialTasks);
    this.parts = loadFromStorage(STORAGE_KEYS.PARTS, initialParts);
    this.appointments = loadFromStorage(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    this.documents = loadFromStorage(STORAGE_KEYS.DOCUMENTS, initialDocuments);
    this.logs = loadFromStorage(STORAGE_KEYS.LOGS, initialActivityLogs);
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, initialGarageSettings);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  // --- LOGGING ---
  public logAction(
    action: string,
    entity_type: ActivityLog['entity_type'],
    entity_id?: string | null,
    details?: string | null,
    extra?: { client_id?: string | null; vehicle_id?: string | null; reception_id?: string | null; intervention_id?: string | null }
  ): void {
    const log: ActivityLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      action,
      user_name: 'Équipe Atelier BFP',
      entity_type,
      entity_id: entity_id || null,
      details: details || null,
      client_id: extra?.client_id || null,
      vehicle_id: extra?.vehicle_id || null,
      reception_id: extra?.reception_id || null,
      intervention_id: extra?.intervention_id || null,
    };
    this.logs = [log, ...this.logs];
    saveToStorage(STORAGE_KEYS.LOGS, this.logs);
    this.notify();
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    return [...this.clients];
  }

  public getClient(id: string): Client | undefined {
    return this.clients.find((c) => c.id === id);
  }

  public saveClient(data: Partial<Client>): Client {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.clients.findIndex((c) => c.id === data.id);
      if (idx !== -1) {
        const updated: Client = {
          ...this.clients[idx],
          ...data,
          updated_at: now,
        };
        this.clients[idx] = updated;
        saveToStorage(STORAGE_KEYS.CLIENTS, this.clients);
        this.logAction('Modification client', 'client', updated.id, `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'Fiche client sans nom');
        this.notify();
        return updated;
      }
    }

    const created: Client = {
      id: data.id || generateUUID(),
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.clients = [created, ...this.clients];
    saveToStorage(STORAGE_KEYS.CLIENTS, this.clients);
    this.logAction('Création client', 'client', created.id, `${created.first_name || ''} ${created.last_name || ''}`.trim() || 'Fiche client sans nom');
    this.notify();
    return created;
  }

  public deleteClient(id: string): void {
    const client = this.getClient(id);
    const label = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || id : id;
    this.clients = this.clients.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.CLIENTS, this.clients);

    // Detach from vehicles and appointments safely without deleting them
    this.vehicles = this.vehicles.map((v) => (v.client_id === id ? { ...v, client_id: null } : v));
    saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);

    this.appointments = this.appointments.map((a) => (a.client_id === id ? { ...a, client_id: null } : a));
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    this.receptions = this.receptions.map((r) => (r.client_id === id ? { ...r, client_id: null } : r));
    saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);

    this.interventions = this.interventions.map((i) => (i.client_id === id ? { ...i, client_id: null } : i));
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);

    this.logAction('Suppression client', 'client', id, `Suppression client : ${label}`);
    this.notify();
  }

  // --- VEHICLES ---
  public getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  public getVehiclesByClient(clientId: string): Vehicle[] {
    return this.vehicles.filter((v) => v.client_id === clientId);
  }

  public saveVehicle(data: Partial<Vehicle>): Vehicle {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.vehicles.findIndex((v) => v.id === data.id);
      if (idx !== -1) {
        const updated: Vehicle = {
          ...this.vehicles[idx],
          ...data,
          updated_at: now,
        };
        this.vehicles[idx] = updated;
        saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
        this.logAction(
          'Modification véhicule',
          'vehicle',
          updated.id,
          `${updated.brand || ''} ${updated.model || ''} (${updated.license_plate || 'Sans immat'})`.trim(),
          { vehicle_id: updated.id, client_id: updated.client_id }
        );
        this.notify();
        return updated;
      }
    }

    const created: Vehicle = {
      id: data.id || generateUUID(),
      client_id: data.client_id || null,
      license_plate: data.license_plate || null,
      brand: data.brand || null,
      model: data.model || null,
      year: data.year ? Number(data.year) : null,
      motorisation: data.motorisation || null,
      engine_code: data.engine_code || null,
      fuel_type: data.fuel_type || null,
      power_ch: data.power_ch ? Number(data.power_ch) : null,
      power_fiscal: data.power_fiscal ? Number(data.power_fiscal) : null,
      vin: data.vin || null,
      mileage: data.mileage ? Number(data.mileage) : null,
      color: data.color || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.vehicles = [created, ...this.vehicles];
    saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    this.logAction(
      'Création véhicule',
      'vehicle',
      created.id,
      `${created.brand || ''} ${created.model || ''} (${created.license_plate || 'Sans immat'})`.trim(),
      { vehicle_id: created.id, client_id: created.client_id }
    );
    this.notify();
    return created;
  }

  public deleteVehicle(id: string): void {
    const veh = this.getVehicle(id);
    const label = veh ? `${veh.brand || ''} ${veh.model || ''} (${veh.license_plate || ''})`.trim() || id : id;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);

    // Safely detach from related tables
    this.receptions = this.receptions.map((r) => (r.vehicle_id === id ? { ...r, vehicle_id: null } : r));
    saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);

    this.interventions = this.interventions.map((i) => (i.vehicle_id === id ? { ...i, vehicle_id: null } : i));
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);

    this.appointments = this.appointments.map((a) => (a.vehicle_id === id ? { ...a, vehicle_id: null } : a));
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    this.parts = this.parts.map((p) => (p.vehicle_id === id ? { ...p, vehicle_id: null } : p));
    saveToStorage(STORAGE_KEYS.PARTS, this.parts);

    this.logAction('Suppression véhicule', 'vehicle', id, `Suppression véhicule : ${label}`);
    this.notify();
  }

  // --- RECEPTIONS ---
  public getReceptions(): Reception[] {
    return [...this.receptions];
  }

  public getReception(id: string): Reception | undefined {
    return this.receptions.find((r) => r.id === id);
  }

  public getReceptionsByVehicle(vehicleId: string): Reception[] {
    return this.receptions.filter((r) => r.vehicle_id === vehicleId);
  }

  public getReceptionsByClient(clientId: string): Reception[] {
    return this.receptions.filter((r) => r.client_id === clientId);
  }

  public saveReception(data: Partial<Reception>): Reception {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.receptions.findIndex((r) => r.id === data.id);
      if (idx !== -1) {
        const updated: Reception = {
          ...this.receptions[idx],
          ...data,
          updated_at: now,
        };
        this.receptions[idx] = updated;
        saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);

        // Update vehicle mileage if provided
        if (updated.vehicle_id && updated.mileage_in) {
          const veh = this.getVehicle(updated.vehicle_id);
          if (veh && (!veh.mileage || updated.mileage_in > veh.mileage)) {
            this.saveVehicle({ id: veh.id, mileage: updated.mileage_in });
          }
        }

        this.logAction('Modification réception', 'reception', updated.id, `Réception du ${updated.reception_date || 'Date indéfinie'}`, {
          reception_id: updated.id,
          vehicle_id: updated.vehicle_id,
          client_id: updated.client_id,
        });
        this.notify();
        return updated;
      }
    }

    const created: Reception = {
      id: data.id || generateUUID(),
      vehicle_id: data.vehicle_id || null,
      client_id: data.client_id || null,
      reception_date: data.reception_date || new Date().toISOString().split('T')[0],
      reception_time: data.reception_time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      mileage_in: data.mileage_in ? Number(data.mileage_in) : null,
      fuel_level: data.fuel_level || null,
      general_state: data.general_state || null,
      damages_noted: data.damages_noted || null,
      damages_points: data.damages_points || [],
      reserves: data.reserves || null,
      comments: data.comments || null,
      requested_works: data.requested_works || null,
      signature_data_url: data.signature_data_url || null,
      signature_signer_name: data.signature_signer_name || null,
      mechanic: data.mechanic || null,
      created_at: now,
      updated_at: now,
    };
    this.receptions = [created, ...this.receptions];
    saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);

    // Update vehicle mileage if provided
    if (created.vehicle_id && created.mileage_in) {
      const veh = this.getVehicle(created.vehicle_id);
      if (veh && (!veh.mileage || created.mileage_in > veh.mileage)) {
        this.saveVehicle({ id: veh.id, mileage: created.mileage_in });
      }
    }

    this.logAction('Nouvelle réception', 'reception', created.id, `Réception du ${created.reception_date || 'Date indéfinie'}`, {
      reception_id: created.id,
      vehicle_id: created.vehicle_id,
      client_id: created.client_id,
    });
    this.notify();
    return created;
  }

  public deleteReception(id: string): void {
    const rec = this.getReception(id);
    this.receptions = this.receptions.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);

    this.photos = this.photos.filter((p) => p.reception_id !== id);
    saveToStorage(STORAGE_KEYS.PHOTOS, this.photos);

    this.interventions = this.interventions.map((i) => (i.reception_id === id ? { ...i, reception_id: null } : i));
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);

    this.logAction('Suppression réception', 'reception', id, `Suppression réception du ${rec?.reception_date || id}`);
    this.notify();
  }

  // --- RECEPTION PHOTOS ---
  public getPhotos(): ReceptionPhoto[] {
    return [...this.photos];
  }

  public getPhotosByReception(receptionId: string): ReceptionPhoto[] {
    return this.photos.filter((p) => p.reception_id === receptionId);
  }

  public getPhotosByVehicle(vehicleId: string): ReceptionPhoto[] {
    return this.photos.filter((p) => p.vehicle_id === vehicleId);
  }

  public addPhoto(data: Partial<ReceptionPhoto>): ReceptionPhoto {
    const photo: ReceptionPhoto = {
      id: data.id || generateUUID(),
      reception_id: data.reception_id || null,
      vehicle_id: data.vehicle_id || null,
      photo_url: data.photo_url || null,
      category: data.category || null,
      comment: data.comment || null,
      created_at: new Date().toISOString(),
    };
    this.photos = [photo, ...this.photos];
    saveToStorage(STORAGE_KEYS.PHOTOS, this.photos);
    this.notify();
    return photo;
  }

  public deletePhoto(id: string): void {
    this.photos = this.photos.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.PHOTOS, this.photos);
    this.notify();
  }

  // --- INTERVENTIONS ---
  public getInterventions(): Intervention[] {
    return [...this.interventions];
  }

  public getIntervention(id: string): Intervention | undefined {
    return this.interventions.find((i) => i.id === id);
  }

  public getInterventionsByVehicle(vehicleId: string): Intervention[] {
    return this.interventions.filter((i) => i.vehicle_id === vehicleId);
  }

  public getInterventionsByClient(clientId: string): Intervention[] {
    return this.interventions.filter((i) => i.client_id === clientId);
  }

  public saveIntervention(data: Partial<Intervention>): Intervention {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.interventions.findIndex((i) => i.id === data.id);
      if (idx !== -1) {
        const updated: Intervention = {
          ...this.interventions[idx],
          ...data,
          updated_at: now,
        };
        this.interventions[idx] = updated;
        saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);
        this.logAction('Modification intervention', 'intervention', updated.id, updated.title || 'Intervention sans titre', {
          intervention_id: updated.id,
          vehicle_id: updated.vehicle_id,
          client_id: updated.client_id,
        });
        this.notify();
        return updated;
      }
    }

    const created: Intervention = {
      id: data.id || generateUUID(),
      vehicle_id: data.vehicle_id || null,
      client_id: data.client_id || null,
      reception_id: data.reception_id || null,
      title: data.title || null,
      status: data.status || 'a_faire',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || null,
      estimated_duration_hours: data.estimated_duration_hours ? Number(data.estimated_duration_hours) : null,
      actual_duration_hours: data.actual_duration_hours ? Number(data.actual_duration_hours) : null,
      lead_mechanic: data.lead_mechanic || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.interventions = [created, ...this.interventions];
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);
    this.logAction('Création intervention', 'intervention', created.id, created.title || 'Nouvelle intervention', {
      intervention_id: created.id,
      vehicle_id: created.vehicle_id,
      client_id: created.client_id,
    });
    this.notify();
    return created;
  }

  public deleteIntervention(id: string): void {
    const intv = this.getIntervention(id);
    this.interventions = this.interventions.filter((i) => i.id !== id);
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);

    this.tasks = this.tasks.filter((t) => t.intervention_id !== id);
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);

    this.parts = this.parts.map((p) => (p.intervention_id === id ? { ...p, intervention_id: null } : p));
    saveToStorage(STORAGE_KEYS.PARTS, this.parts);

    this.logAction('Suppression intervention', 'intervention', id, `Suppression : ${intv?.title || id}`);
    this.notify();
  }

  // --- TASKS (TRAVAUX) ---
  public getTasks(): Task[] {
    return [...this.tasks];
  }

  public getTasksByIntervention(interventionId: string): Task[] {
    return this.tasks.filter((t) => t.intervention_id === interventionId);
  }

  public saveTask(data: Partial<Task>): Task {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.tasks.findIndex((t) => t.id === data.id);
      if (idx !== -1) {
        const updated: Task = {
          ...this.tasks[idx],
          ...data,
          updated_at: now,
        };
        this.tasks[idx] = updated;
        saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
        this.notify();
        return updated;
      }
    }

    const created: Task = {
      id: data.id || generateUUID(),
      intervention_id: data.intervention_id || null,
      vehicle_id: data.vehicle_id || null,
      category: data.category || null,
      description: data.description || null,
      status: data.status || 'a_faire',
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : null,
      actual_hours: data.actual_hours ? Number(data.actual_hours) : null,
      mechanic: data.mechanic || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.tasks = [created, ...this.tasks];
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
    return created;
  }

  public deleteTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.notify();
  }

  // --- PARTS (PIÈCES SANS STOCK) ---
  public getParts(): Part[] {
    return [...this.parts];
  }

  public getPart(id: string): Part | undefined {
    return this.parts.find((p) => p.id === id);
  }

  public getPartsByVehicle(vehicleId: string): Part[] {
    return this.parts.filter((p) => p.vehicle_id === vehicleId);
  }

  public getPartsByIntervention(interventionId: string): Part[] {
    return this.parts.filter((p) => p.intervention_id === interventionId);
  }

  public savePart(data: Partial<Part>): Part {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.parts.findIndex((p) => p.id === data.id);
      if (idx !== -1) {
        const updated: Part = {
          ...this.parts[idx],
          ...data,
          updated_at: now,
        };
        this.parts[idx] = updated;
        saveToStorage(STORAGE_KEYS.PARTS, this.parts);
        this.logAction('Modification pièce', 'part', updated.id, `${updated.designation || 'Pièce'} (${updated.reference || 'Sans réf'})`, {
          vehicle_id: updated.vehicle_id,
          intervention_id: updated.intervention_id,
        });
        this.notify();
        return updated;
      }
    }

    const created: Part = {
      id: data.id || generateUUID(),
      designation: data.designation || null,
      reference: data.reference || null,
      brand: data.brand || null,
      supplier: data.supplier || null,
      price_buy_ht: data.price_buy_ht ? Number(data.price_buy_ht) : null,
      price_sell_ttc: data.price_sell_ttc ? Number(data.price_sell_ttc) : null,
      quantity: data.quantity ? Number(data.quantity) : 1,
      status: data.status || 'a_commander',
      vehicle_id: data.vehicle_id || null,
      intervention_id: data.intervention_id || null,
      task_id: data.task_id || null,
      order_date: data.order_date || null,
      delivery_expected_date: data.delivery_expected_date || null,
      delivery_actual_date: data.delivery_actual_date || null,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.parts = [created, ...this.parts];
    saveToStorage(STORAGE_KEYS.PARTS, this.parts);
    this.logAction('Ajout pièce', 'part', created.id, `${created.designation || 'Pièce'} (${created.reference || 'Sans réf'})`, {
      vehicle_id: created.vehicle_id,
      intervention_id: created.intervention_id,
    });
    this.notify();
    return created;
  }

  public updatePartStatus(id: string, status: PartStatus): Part | undefined {
    const part = this.getPart(id);
    if (!part) return undefined;
    const now = new Date().toISOString();
    const updates: Partial<Part> = { status };
    if (status === 'commandee' && !part.order_date) {
      updates.order_date = new Date().toISOString().split('T')[0];
    } else if (status === 'recue' && !part.delivery_actual_date) {
      updates.delivery_actual_date = new Date().toISOString().split('T')[0];
    }
    return this.savePart({ ...part, ...updates });
  }

  public deletePart(id: string): void {
    const p = this.getPart(id);
    this.parts = this.parts.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.PARTS, this.parts);
    this.logAction('Suppression pièce', 'part', id, `Suppression pièce : ${p?.designation || id}`);
    this.notify();
  }

  // --- KNOWLEDGE BASE: PIÈCES DÉJÀ UTILISÉES SUR DES VÉHICULES SIMILAIRES ---
  public findPartsUsedOnSimilarVehicles(criteria: {
    brand?: string | null;
    model?: string | null;
    motorisation?: string | null;
    year?: number | null;
    currentVehicleId?: string | null;
  }): Array<{ part: Part; vehicle: Vehicle }> {
    const { brand, model, motorisation, currentVehicleId } = criteria;
    if (!brand && !model && !motorisation) return [];

    const cleanBrand = (brand || '').toLowerCase().trim();
    const cleanModel = (model || '').toLowerCase().trim();
    const cleanMotor = (motorisation || '').toLowerCase().trim();

    const matches: Array<{ part: Part; vehicle: Vehicle }> = [];

    for (const part of this.parts) {
      if (!part.reference && !part.designation) continue;
      if (!part.vehicle_id) continue;
      // Exclude parts from the exact current vehicle if requested
      if (currentVehicleId && part.vehicle_id === currentVehicleId) continue;

      const v = this.getVehicle(part.vehicle_id);
      if (!v) continue;

      const vBrand = (v.brand || '').toLowerCase().trim();
      const vModel = (v.model || '').toLowerCase().trim();
      const vMotor = (v.motorisation || '').toLowerCase().trim();

      let similarityScore = 0;
      if (cleanBrand && vBrand.includes(cleanBrand)) similarityScore += 2;
      if (cleanModel && vModel.includes(cleanModel)) similarityScore += 3;
      if (cleanMotor && vMotor.includes(cleanMotor)) similarityScore += 4;

      if (similarityScore >= 3) {
        matches.push({ part, vehicle: v });
      }
    }

    return matches;
  }

  // --- APPOINTMENTS (PLANNING ATELIER 4 PONTS) ---
  public getAppointments(): Appointment[] {
    return [...this.appointments];
  }

  public getAppointment(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  public getAppointmentsByDate(date: string): Appointment[] {
    return this.appointments.filter((a) => a.date === date);
  }

  public saveAppointment(data: Partial<Appointment>): Appointment {
    const now = new Date().toISOString();
    if (data.id) {
      const idx = this.appointments.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        const updated: Appointment = {
          ...this.appointments[idx],
          ...data,
          updated_at: now,
        };
        this.appointments[idx] = updated;
        saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
        this.logAction('Modification RDV', 'appointment', updated.id, `${updated.purpose || 'Rendez-vous'} - ${updated.date || ''} à ${updated.time || ''}`, {
          vehicle_id: updated.vehicle_id,
          client_id: updated.client_id,
        });
        this.notify();
        return updated;
      }
    }

    const created: Appointment = {
      id: data.id || generateUUID(),
      client_id: data.client_id || null,
      vehicle_id: data.vehicle_id || null,
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '08:30',
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : 60,
      purpose: data.purpose || null,
      description: data.description || null,
      mechanic: data.mechanic || null,
      lift: data.lift || 'pont_1',
      status: data.status || 'confirme',
      priority: data.priority || 'normale',
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
    };
    this.appointments = [created, ...this.appointments];
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
    this.logAction('Nouveau RDV', 'appointment', created.id, `${created.purpose || 'Rendez-vous'} - ${created.date || ''} à ${created.time || ''}`, {
      vehicle_id: created.vehicle_id,
      client_id: created.client_id,
    });
    this.notify();
    return created;
  }

  public deleteAppointment(id: string): void {
    const apt = this.getAppointment(id);
    this.appointments = this.appointments.filter((a) => a.id !== id);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
    this.logAction('Suppression RDV', 'appointment', id, `Suppression RDV : ${apt?.purpose || id}`);
    this.notify();
  }

  // --- DOCUMENTS ---
  public getDocuments(): DocumentRecord[] {
    return [...this.documents];
  }

  public saveDocument(data: Partial<DocumentRecord>): DocumentRecord {
    const now = new Date().toISOString();
    const created: DocumentRecord = {
      id: data.id || generateUUID(),
      title: data.title || 'Document sans titre',
      doc_type: data.doc_type || 'autre',
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      file_size: data.file_size ? Number(data.file_size) : null,
      client_id: data.client_id || null,
      vehicle_id: data.vehicle_id || null,
      reception_id: data.reception_id || null,
      intervention_id: data.intervention_id || null,
      part_id: data.part_id || null,
      notes: data.notes || null,
      created_at: now,
    };
    this.documents = [created, ...this.documents];
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    this.logAction('Nouveau document', 'document', created.id, created.title || 'Nouveau document');
    this.notify();
    return created;
  }

  public deleteDocument(id: string): void {
    const doc = this.documents.find((d) => d.id === id);
    this.documents = this.documents.filter((d) => d.id !== id);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    this.logAction('Suppression document', 'document', id, `Suppression document : ${doc?.title || id}`);
    this.notify();
  }

  // --- ACTIVITY LOGS ---
  public getLogs(): ActivityLog[] {
    return [...this.logs];
  }

  // --- GARAGE SETTINGS ---
  public getSettings(): GarageSettings {
    return { ...this.settings };
  }

  public saveSettings(data: Partial<GarageSettings>): GarageSettings {
    this.settings = { ...this.settings, ...data };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
    return this.settings;
  }

  // --- RECHERCHE INTELLIGENTE GLOBALE ---
  public globalSearch(query: string) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { clients: [], vehicles: [], parts: [], receptions: [], interventions: [], appointments: [] };

    const clients = this.clients.filter(
      (c) =>
        (c.first_name || '').toLowerCase().includes(q) ||
        (c.last_name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
    );

    const vehicles = this.vehicles.filter(
      (v) =>
        (v.license_plate || '').toLowerCase().replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, '')) ||
        (v.brand || '').toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        (v.motorisation || '').toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q) ||
        (v.engine_code || '').toLowerCase().includes(q)
    );

    const parts = this.parts.filter(
      (p) =>
        (p.designation || '').toLowerCase().includes(q) ||
        (p.reference || '').toLowerCase().replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, '')) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q)
    );

    const receptions = this.receptions.filter(
      (r) =>
        (r.damages_noted || '').toLowerCase().includes(q) ||
        (r.requested_works || '').toLowerCase().includes(q) ||
        (r.comments || '').toLowerCase().includes(q) ||
        (r.reception_date || '').includes(q)
    );

    const interventions = this.interventions.filter(
      (i) =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q) ||
        (i.lead_mechanic || '').toLowerCase().includes(q)
    );

    const appointments = this.appointments.filter(
      (a) =>
        (a.purpose || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.date || '').includes(q) ||
        (a.mechanic || '').toLowerCase().includes(q)
    );

    return { clients, vehicles, parts, receptions, interventions, appointments };
  }

  // --- BACKUP & RESTORE ---
  public exportDataJSON(): string {
    return JSON.stringify(
      {
        clients: this.clients,
        vehicles: this.vehicles,
        receptions: this.receptions,
        photos: this.photos,
        interventions: this.interventions,
        tasks: this.tasks,
        parts: this.parts,
        appointments: this.appointments,
        documents: this.documents,
        logs: this.logs,
        settings: this.settings,
        exported_at: new Date().toISOString(),
      },
      null,
      2
    );
  }

  public importDataJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.clients) this.clients = data.clients;
      if (data.vehicles) this.vehicles = data.vehicles;
      if (data.receptions) this.receptions = data.receptions;
      if (data.photos) this.photos = data.photos;
      if (data.interventions) this.interventions = data.interventions;
      if (data.tasks) this.tasks = data.tasks;
      if (data.parts) this.parts = data.parts;
      if (data.appointments) this.appointments = data.appointments;
      if (data.documents) this.documents = data.documents;
      if (data.logs) this.logs = data.logs;
      if (data.settings) this.settings = data.settings;

      saveToStorage(STORAGE_KEYS.CLIENTS, this.clients);
      saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
      saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);
      saveToStorage(STORAGE_KEYS.PHOTOS, this.photos);
      saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);
      saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
      saveToStorage(STORAGE_KEYS.PARTS, this.parts);
      saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
      saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
      saveToStorage(STORAGE_KEYS.LOGS, this.logs);
      saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);

      this.logAction('Restauration base de données', 'document', null, 'Importation de sauvegarde réussie');
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to import JSON data:', err);
      return false;
    }
  }

  public resetToDefault(): void {
    this.clients = initialClients;
    this.vehicles = initialVehicles;
    this.receptions = initialReceptions;
    this.photos = initialPhotos;
    this.interventions = initialInterventions;
    this.tasks = initialTasks;
    this.parts = initialParts;
    this.appointments = initialAppointments;
    this.documents = initialDocuments;
    this.logs = initialActivityLogs;
    this.settings = initialGarageSettings;

    saveToStorage(STORAGE_KEYS.CLIENTS, this.clients);
    saveToStorage(STORAGE_KEYS.VEHICLES, this.vehicles);
    saveToStorage(STORAGE_KEYS.RECEPTIONS, this.receptions);
    saveToStorage(STORAGE_KEYS.PHOTOS, this.photos);
    saveToStorage(STORAGE_KEYS.INTERVENTIONS, this.interventions);
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    saveToStorage(STORAGE_KEYS.PARTS, this.parts);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    saveToStorage(STORAGE_KEYS.LOGS, this.logs);
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);

    this.notify();
  }
}

export const garageDb = new GarageStorage();

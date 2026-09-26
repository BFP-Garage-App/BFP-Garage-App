import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
import { garageDb } from '../db/storage';

interface GarageContextType {
  clients: Client[];
  vehicles: Vehicle[];
  receptions: Reception[];
  photos: ReceptionPhoto[];
  interventions: Intervention[];
  tasks: Task[];
  parts: Part[];
  appointments: Appointment[];
  documents: DocumentRecord[];
  logs: ActivityLog[];
  settings: GarageSettings;

  // Getters
  getClient: (id: string) => Client | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getReception: (id: string) => Reception | undefined;
  getIntervention: (id: string) => Intervention | undefined;
  getPart: (id: string) => Part | undefined;
  getAppointment: (id: string) => Appointment | undefined;

  // Relationships
  getVehiclesByClient: (clientId: string) => Vehicle[];
  getReceptionsByVehicle: (vehicleId: string) => Reception[];
  getInterventionsByVehicle: (vehicleId: string) => Intervention[];
  getPartsByVehicle: (vehicleId: string) => Part[];
  getPartsByIntervention: (interventionId: string) => Part[];
  getPhotosByReception: (receptionId: string) => ReceptionPhoto[];
  getPhotosByVehicle: (vehicleId: string) => ReceptionPhoto[];
  getTasksByIntervention: (interventionId: string) => Task[];

  // Mutations (Zero required fields!)
  saveClient: (data: Partial<Client>) => Client;
  deleteClient: (id: string) => void;
  saveVehicle: (data: Partial<Vehicle>) => Vehicle;
  deleteVehicle: (id: string) => void;
  saveReception: (data: Partial<Reception>) => Reception;
  deleteReception: (id: string) => void;
  addPhoto: (data: Partial<ReceptionPhoto>) => ReceptionPhoto;
  deletePhoto: (id: string) => void;
  saveIntervention: (data: Partial<Intervention>) => Intervention;
  deleteIntervention: (id: string) => void;
  saveTask: (data: Partial<Task>) => Task;
  deleteTask: (id: string) => void;
  savePart: (data: Partial<Part>) => Part;
  updatePartStatus: (id: string, status: PartStatus) => Part | undefined;
  deletePart: (id: string) => void;
  saveAppointment: (data: Partial<Appointment>) => Appointment;
  deleteAppointment: (id: string) => void;
  saveDocument: (data: Partial<DocumentRecord>) => DocumentRecord;
  deleteDocument: (id: string) => void;
  saveSettings: (data: Partial<GarageSettings>) => GarageSettings;
  resetDatabase: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (json: string) => boolean;

  // Knowledge base
  findPartsUsedOnSimilarVehicles: (criteria: {
    brand?: string | null;
    model?: string | null;
    motorisation?: string | null;
    year?: number | null;
    currentVehicleId?: string | null;
  }) => Array<{ part: Part; vehicle: Vehicle }>;

  // Quick stats
  stats: {
    totalVehicles: number;
    totalClients: number;
    todayAppointmentsCount: number;
    totalReceptions: number;
    ongoingInterventions: number;
    partsToOrder: number;
    partsOrdered: number;
    partsReceived: number;
  };

  // Workshop 4 Ponts status
  pontsStatus: {
    pont_1: Appointment | null;
    pont_2: Appointment | null;
    pont_3: Appointment | null;
    pont_4: Appointment | null;
  };
}

const GarageContext = createContext<GarageContextType | null>(null);

export const GarageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = garageDb.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const clients = useMemo(() => garageDb.getClients(), [garageDb, tickTrigger()]);
  const vehicles = useMemo(() => garageDb.getVehicles(), [garageDb, tickTrigger()]);
  const receptions = useMemo(() => garageDb.getReceptions(), [garageDb, tickTrigger()]);
  const photos = useMemo(() => garageDb.getPhotos(), [garageDb, tickTrigger()]);
  const interventions = useMemo(() => garageDb.getInterventions(), [garageDb, tickTrigger()]);
  const tasks = useMemo(() => garageDb.getTasks(), [garageDb, tickTrigger()]);
  const parts = useMemo(() => garageDb.getParts(), [garageDb, tickTrigger()]);
  const appointments = useMemo(() => garageDb.getAppointments(), [garageDb, tickTrigger()]);
  const documents = useMemo(() => garageDb.getDocuments(), [garageDb, tickTrigger()]);
  const logs = useMemo(() => garageDb.getLogs(), [garageDb, tickTrigger()]);
  const settings = useMemo(() => garageDb.getSettings(), [garageDb, tickTrigger()]);

  // Helper function to force memo invalidation
  function tickTrigger() {
    return Date.now();
  }

  // Quick Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => {
    return {
      totalVehicles: vehicles.length,
      totalClients: clients.length,
      todayAppointmentsCount: appointments.filter((a) => a.date === todayStr).length,
      totalReceptions: receptions.length,
      ongoingInterventions: interventions.filter((i) => i.status === 'en_cours' || i.status === 'attente_pieces').length,
      partsToOrder: parts.filter((p) => p.status === 'a_commander').length,
      partsOrdered: parts.filter((p) => p.status === 'commandee').length,
      partsReceived: parts.filter((p) => p.status === 'recue').length,
    };
  }, [vehicles, clients, appointments, receptions, interventions, parts, todayStr]);

  // Current Lift / Pont Occupancy for today
  const pontsStatus = useMemo(() => {
    const todayAppointments = appointments.filter((a) => a.date === todayStr && a.status !== 'annule');
    return {
      pont_1: todayAppointments.find((a) => a.lift === 'pont_1') || null,
      pont_2: todayAppointments.find((a) => a.lift === 'pont_2') || null,
      pont_3: todayAppointments.find((a) => a.lift === 'pont_3') || null,
      pont_4: todayAppointments.find((a) => a.lift === 'pont_4') || null,
    };
  }, [appointments, todayStr]);

  const value: GarageContextType = {
    clients,
    vehicles,
    receptions,
    photos,
    interventions,
    tasks,
    parts,
    appointments,
    documents,
    logs,
    settings,

    getClient: (id) => garageDb.getClient(id),
    getVehicle: (id) => garageDb.getVehicle(id),
    getReception: (id) => garageDb.getReception(id),
    getIntervention: (id) => garageDb.getIntervention(id),
    getPart: (id) => garageDb.getPart(id),
    getAppointment: (id) => garageDb.getAppointment(id),

    getVehiclesByClient: (clientId) => garageDb.getVehiclesByClient(clientId),
    getReceptionsByVehicle: (vehicleId) => garageDb.getReceptionsByVehicle(vehicleId),
    getInterventionsByVehicle: (vehicleId) => garageDb.getInterventionsByVehicle(vehicleId),
    getPartsByVehicle: (vehicleId) => garageDb.getPartsByVehicle(vehicleId),
    getPartsByIntervention: (intId) => garageDb.getPartsByIntervention(intId),
    getPhotosByReception: (recId) => garageDb.getPhotosByReception(recId),
    getPhotosByVehicle: (vehId) => garageDb.getPhotosByVehicle(vehId),
    getTasksByIntervention: (intId) => garageDb.getTasksByIntervention(intId),

    saveClient: (data) => garageDb.saveClient(data),
    deleteClient: (id) => garageDb.deleteClient(id),
    saveVehicle: (data) => garageDb.saveVehicle(data),
    deleteVehicle: (id) => garageDb.deleteVehicle(id),
    saveReception: (data) => garageDb.saveReception(data),
    deleteReception: (id) => garageDb.deleteReception(id),
    addPhoto: (data) => garageDb.addPhoto(data),
    deletePhoto: (id) => garageDb.deletePhoto(id),
    saveIntervention: (data) => garageDb.saveIntervention(data),
    deleteIntervention: (id) => garageDb.deleteIntervention(id),
    saveTask: (data) => garageDb.saveTask(data),
    deleteTask: (id) => garageDb.deleteTask(id),
    savePart: (data) => garageDb.savePart(data),
    updatePartStatus: (id, status) => garageDb.updatePartStatus(id, status),
    deletePart: (id) => garageDb.deletePart(id),
    saveAppointment: (data) => garageDb.saveAppointment(data),
    deleteAppointment: (id) => garageDb.deleteAppointment(id),
    saveDocument: (data) => garageDb.saveDocument(data),
    deleteDocument: (id) => garageDb.deleteDocument(id),
    saveSettings: (data) => garageDb.saveSettings(data),
    resetDatabase: () => garageDb.resetToDefault(),
    exportDatabaseJSON: () => garageDb.exportDataJSON(),
    importDatabaseJSON: (json) => garageDb.importDataJSON(json),

    findPartsUsedOnSimilarVehicles: (criteria) => garageDb.findPartsUsedOnSimilarVehicles(criteria),

    stats,
    pontsStatus,
  };

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};

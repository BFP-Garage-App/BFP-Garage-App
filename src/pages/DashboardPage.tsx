import React from 'react';
import {
  Car,
  Users,
  Calendar,
  ClipboardList,
  Wrench,
  Package,
  Layers,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

interface DashboardPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    vehicles,
    clients,
    receptions,
    interventions,
    parts,
    appointments,
    stats,
    pontsStatus,
    getClient,
    getVehicle,
    updatePartStatus,
  } = useGarage();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const recentReceptions = [...receptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentInterventions = [...interventions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const partsToOrderList = parts.filter((p) => p.status === 'a_commander').slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Top Action & Workshop Summary Bar (Dense, sober, no big photo banner) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Atelier Opérationnel</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">Flux tendu sans stock</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Supervision Quotidienne de l'Atelier
          </h2>
        </div>

        {/* Compact Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('new-reception')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Nouvelle réception</span>
          </button>
          <button
            onClick={() => onNavigate('planning', 'new')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Nouveau rendez-vous</span>
          </button>
          <button
            onClick={() => onNavigate('vehicles', 'new')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-slate-500" />
            <span>Nouveau véhicule</span>
          </button>
          <button
            onClick={() => onNavigate('parts', 'new')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Commande de pièce</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW (Dense, clean, fine borders) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Véhicules */}
        <div
          onClick={() => onNavigate('vehicles')}
          className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Véhicules</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalVehicles}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Parc atelier</div>
          </div>
        </div>

        {/* Clients */}
        <div
          onClick={() => onNavigate('clients')}
          className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Clients</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalClients}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Fiches créées</div>
          </div>
        </div>

        {/* RDV Aujourd'hui */}
        <div
          onClick={() => onNavigate('planning')}
          className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">RDV du jour</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-blue-700 tabular-nums">
              {stats.todayAppointmentsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Planning atelier</div>
          </div>
        </div>

        {/* Réceptions */}
        <div
          onClick={() => onNavigate('receptions')}
          className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Réceptions</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalReceptions}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Entrées atelier</div>
          </div>
        </div>

        {/* Interventions en cours */}
        <div
          onClick={() => onNavigate('interventions')}
          className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">En cours</span>
            <Wrench className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono text-orange-600 tabular-nums">
              {stats.ongoingInterventions}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Travaux actifs</div>
          </div>
        </div>

        {/* Pièces à commander */}
        <div
          onClick={() => onNavigate('parts')}
          className={`p-3.5 rounded-lg cursor-pointer transition-all shadow-2xs flex flex-col justify-between border ${
            stats.partsToOrder > 0
              ? 'bg-orange-50/70 border-orange-300 hover:border-orange-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Commandes</span>
            <Package className={`w-4 h-4 ${stats.partsToOrder > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-xl font-bold font-mono tabular-nums ${stats.partsToOrder > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
              {stats.partsToOrder}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.partsToOrder} à commander · {stats.partsReceived} reçues
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: LES 4 PONTS DU GARAGE (Colonnes d'atelier claires & ergonomiques) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <Layers className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ponts de levage — 4 ponts
              </h3>
              <p className="text-[11px] text-slate-500">
                Occupation et affectations en temps réel pour la journée
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('planning')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
          >
            <span>Ouvrir le planning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Ponts Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((pontNum) => {
            const key = `pont_${pontNum}` as keyof typeof pontsStatus;
            const apt = pontsStatus[key];
            const veh = apt?.vehicle_id ? getVehicle(apt.vehicle_id) : null;
            const isOccupied = !!apt;

            return (
              <div
                key={pontNum}
                onClick={() => onNavigate('planning')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-slate-50/70 border-orange-300 hover:border-orange-400 hover:shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                      Pont {pontNum}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isOccupied
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isOccupied ? 'Occupé' : 'Libre'}
                    </span>
                  </div>

                  {isOccupied && apt ? (
                    <div className="space-y-2 text-xs">
                      {/* Immatriculation & Véhicule */}
                      <div>
                        {veh ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 tracking-wider shadow-2xs">
                              <span className="text-[10px] text-blue-700 font-extrabold">F</span>
                              <span>{veh.license_plate || 'SANS IMMAT'}</span>
                            </div>
                            <div className="font-semibold text-slate-800 text-xs truncate">
                              {veh.brand} {veh.model}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            Véhicule non assigné
                          </div>
                        )}
                      </div>

                      {/* Intervention & Travaux */}
                      <div className="bg-white p-2 rounded border border-slate-200 text-[11px]">
                        <div className="font-medium text-slate-900 truncate">
                          {apt.purpose || 'Intervention mécanique'}
                        </div>
                        <div className="text-slate-500 flex items-center justify-between mt-1 text-[10px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {apt.time || '08:30'} ({apt.duration_minutes || 60}m)
                          </span>
                          <span className="font-medium text-slate-700">
                            {apt.mechanic || 'Atelier'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 text-center">
                      <p className="text-xs text-slate-400 mb-2">Pont disponible</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('planning', 'new');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded border border-orange-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nouveau rendez-vous</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Accès direct au pont</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMNS: PLANNING DU JOUR & RÉCEPTIONS DU JOUR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PLANNING DU JOUR (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Planning du jour ({todayAppointments.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('planning', 'new')}
                className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau rendez-vous</span>
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucun rendez-vous programmé aujourd'hui.
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map((apt) => {
                  const v = apt.vehicle_id ? getVehicle(apt.vehicle_id) : null;
                  const c = apt.client_id ? getClient(apt.client_id) : null;

                  return (
                    <div
                      key={apt.id}
                      onClick={() => onNavigate('planning')}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="font-mono text-slate-900 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs shrink-0">
                          {apt.time || '08:30'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 flex items-center gap-2 truncate">
                            <span className="truncate">{apt.purpose || 'Rendez-vous'}</span>
                            {apt.priority === 'urgente' && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 rounded font-semibold shrink-0">
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                            {v && (
                              <span className="font-mono font-medium text-slate-700 truncate">
                                {v.license_plate || 'Sans immat'} ({v.brand} {v.model})
                              </span>
                            )}
                            {c && <span className="truncate">· {c.first_name} {c.last_name}</span>}
                            <span className="shrink-0 text-slate-400">· {apt.lift ? apt.lift.replace('_', ' ') : 'Sans pont'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div className="font-medium text-slate-700">{apt.mechanic || 'Atelier'}</div>
                        <div className="text-[10px] text-slate-400">{apt.duration_minutes || 60} min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Affectations et conflits d'horaires vérifiés</span>
            <button
              onClick={() => onNavigate('planning')}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Voir grille complète
            </button>
          </div>
        </div>

        {/* RÉCEPTIONS DU JOUR / RÉCENTES (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Réceptions atelier ({receptions.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('new-reception')}
                className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Réceptionner</span>
              </button>
            </div>

            {recentReceptions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucune réception enregistrée.
              </div>
            ) : (
              <div className="space-y-2">
                {recentReceptions.map((r) => {
                  const v = r.vehicle_id ? getVehicle(r.vehicle_id) : null;
                  return (
                    <div
                      key={r.id}
                      onClick={() => onNavigate('reception-detail', r.id)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md cursor-pointer text-xs transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {v ? `${v.brand} ${v.model}` : 'Véhicule en cours'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-semibold text-slate-700">{v?.license_plate || 'Sans immat'}</span>
                          <span>· {r.reception_date || 'Date libre'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {r.mileage_in ? (
                          <span className="font-mono text-slate-700 font-medium text-[11px]">
                            {r.mileage_in.toLocaleString()} km
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Kilométrage libre</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fiches d'inspection, photos et signatures</span>
            <button
              onClick={() => onNavigate('receptions')}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Toutes les réceptions
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: ALERTES PIÈCES & DERNIÈRES INTERVENTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ALERTES PIÈCES À COMMANDER (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Alertes Pièces à Commander ({stats.partsToOrder})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('parts')}
                className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-semibold"
              >
                <span>Gérer les pièces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {partsToOrderList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                Toutes les pièces requises sont commandées ou livrées à l'atelier.
              </div>
            ) : (
              <div className="space-y-2">
                {partsToOrderList.map((p) => {
                  const v = p.vehicle_id ? getVehicle(p.vehicle_id) : null;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-orange-50/50 border border-orange-200 rounded-md flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {p.designation || 'Pièce non désignée'}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="text-orange-700 font-bold">Réf: {p.reference || 'Facultative'}</span>
                          {v && <span className="text-slate-500 truncate">· {v.brand} {v.model} ({v.license_plate || 'Sans immat'})</span>}
                        </div>
                        {p.supplier && (
                          <div className="text-[10px] text-slate-500">Fournisseur : {p.supplier}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => updatePartStatus(p.id, 'commandee')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                        title="Basculer le statut en : Commandée"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Commander</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Flux tendu · Commandes à la demande sans stock</span>
            <button
              onClick={() => onNavigate('parts', 'new')}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              + Commande de pièce
            </button>
          </div>
        </div>

        {/* DERNIÈRES INTERVENTIONS (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dernières interventions ({interventions.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('interventions')}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
              >
                Voir tout
              </button>
            </div>

            {recentInterventions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucune intervention enregistrée.
              </div>
            ) : (
              <div className="space-y-2">
                {recentInterventions.map((i) => {
                  const v = i.vehicle_id ? getVehicle(i.vehicle_id) : null;
                  return (
                    <div
                      key={i.id}
                      onClick={() => onNavigate('interventions', i.id)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md cursor-pointer text-xs transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {i.title || 'Intervention d\'atelier'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {v ? `${v.brand} ${v.model} (${v.license_plate || 'Sans immat'})` : 'Sans véhicule'} · {i.lead_mechanic || 'Atelier'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                          i.status === 'termine'
                            ? 'bg-emerald-100 text-emerald-800'
                            : i.status === 'en_cours'
                            ? 'bg-orange-100 text-orange-800'
                            : i.status === 'attente_pieces'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {i.status === 'en_cours'
                          ? 'En cours'
                          : i.status === 'attente_pieces'
                          ? 'Attente pièces'
                          : i.status === 'termine'
                          ? 'Terminé'
                          : 'À faire'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ordres de réparation & tâches</span>
            <button
              onClick={() => onNavigate('interventions', 'new')}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              + Nouvelle intervention
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  History,
  Search,
  Car,
  User,
  Wrench,
  ClipboardList,
  Package,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

interface GlobalHistoryPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const GlobalHistoryPage: React.FC<GlobalHistoryPageProps> = ({ onNavigate }) => {
  const { logs, getVehicle, getClient } = useGarage();
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const v = l.vehicle_id ? getVehicle(l.vehicle_id) : null;
    const c = l.client_id ? getClient(l.client_id) : null;

    return (
      l.action.toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      l.user_name.toLowerCase().includes(q) ||
      (v && (v.license_plate || '').toLowerCase().includes(q)) ||
      (c && (c.first_name || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-orange-600" />
            Historique Global des Actions ({logs.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Journal d'audit de toutes les créations, réceptions, commandes et modifications dans l'atelier.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer l'historique par action, utilisateur, véhicule, client..."
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Activity Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <History className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucune action enregistrée</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const v = log.vehicle_id ? getVehicle(log.vehicle_id) : null;
              const c = log.client_id ? getClient(log.client_id) : null;

              const getIcon = () => {
                switch (log.entity_type) {
                  case 'vehicle':
                    return <Car className="w-4 h-4 text-orange-600" />;
                  case 'client':
                    return <User className="w-4 h-4 text-orange-600" />;
                  case 'reception':
                    return <ClipboardList className="w-4 h-4 text-orange-600" />;
                  case 'intervention':
                    return <Wrench className="w-4 h-4 text-orange-600" />;
                  case 'part':
                    return <Package className="w-4 h-4 text-orange-600" />;
                  case 'appointment':
                    return <Calendar className="w-4 h-4 text-orange-600" />;
                  default:
                    return <FileText className="w-4 h-4 text-slate-600" />;
                }
              };

              return (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-white border border-slate-200 shrink-0">
                      {getIcon()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                          {log.entity_type}
                        </span>
                      </div>

                      {log.details && (
                        <div className="text-slate-600 text-xs mt-0.5">{log.details}</div>
                      )}

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        {v && (
                          <span>
                            Véhicule : {v.license_plate || 'Sans immat'} ({v.brand} {v.model})
                          </span>
                        )}
                        {c && <span>· Client : {c.first_name} {c.last_name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500 shrink-0 sm:border-l border-slate-200 sm:pl-3">
                    <div className="font-semibold text-slate-700">{log.user_name}</div>
                    <div className="text-slate-400">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

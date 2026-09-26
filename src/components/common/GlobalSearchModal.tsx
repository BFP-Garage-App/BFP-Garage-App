import React, { useState, useEffect } from 'react';
import { Search, X, Car, User, Wrench, Package, Calendar, FileText, ArrowRight } from 'lucide-react';
import { garageDb } from '../../db/storage';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    clients: any[];
    vehicles: any[];
    parts: any[];
    receptions: any[];
    interventions: any[];
    appointments: any[];
  }>({
    clients: [],
    vehicles: [],
    parts: [],
    receptions: [],
    interventions: [],
    appointments: [],
  });

  useEffect(() => {
    if (query.trim().length >= 1) {
      setResults(garageDb.globalSearch(query));
    } else {
      setResults({
        clients: [],
        vehicles: [],
        parts: [],
        receptions: [],
        interventions: [],
        appointments: [],
      });
    }
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalHits =
    results.clients.length +
    results.vehicles.length +
    results.parts.length +
    results.receptions.length +
    results.interventions.length +
    results.appointments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-4 h-4 text-orange-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher immatriculation, marque, modèle, VIN, moteur, client, référence pièce..."
            className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Effacer
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-5 flex-1 text-xs">
          {query.trim().length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <p className="text-xs font-medium text-slate-700">Recherchez instantanément dans tout le garage</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                  Ex: "C3"
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                  Ex: "AA-202-BB"
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                  Ex: "BOSCH"
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                  Ex: "Martin"
                </span>
              </div>
            </div>
          ) : totalHits === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <p className="text-xs font-semibold text-slate-700">Aucun résultat trouvé pour « {query} »</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Vérifiez l’immatriculation, le nom du client ou la référence recherchée.
              </p>
            </div>
          ) : (
            <>
              {/* VEHICULES */}
              {results.vehicles.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-orange-600" />
                    Véhicules ({results.vehicles.length})
                  </h4>
                  <div className="space-y-1">
                    {results.vehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          onNavigate('vehicle-detail', v.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded border border-slate-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {v.license_plate || 'Sans immat'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {v.brand} {v.model}
                          </span>
                          {v.motorisation && (
                            <span className="text-[11px] text-slate-500">· {v.motorisation}</span>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CLIENTS */}
              {results.clients.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    Clients ({results.clients.length})
                  </h4>
                  <div className="space-y-1">
                    {results.clients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('client-detail', c.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded border border-slate-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {c.first_name} {c.last_name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {c.phone && <span>{c.phone}</span>}
                            {c.email && <span>· {c.email}</span>}
                            {c.city && <span>· {c.city}</span>}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PIECES */}
              {results.parts.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-orange-600" />
                    Pièces détachées ({results.parts.length})
                  </h4>
                  <div className="space-y-1">
                    {results.parts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('parts');
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded border border-slate-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{p.designation}</div>
                          <div className="text-[11px] font-mono text-orange-700">
                            Réf: {p.reference || 'Non renseignée'} · Fournisseur: {p.supplier || 'N/A'}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            p.status === 'recue'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'commandee'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERVENTIONS */}
              {results.interventions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-orange-600" />
                    Interventions ({results.interventions.length})
                  </h4>
                  <div className="space-y-1">
                    {results.interventions.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          onNavigate('interventions', i.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded border border-slate-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{i.title}</div>
                          <div className="text-[11px] text-slate-500">
                            Mécanicien: {i.lead_mechanic || 'Atelier'}
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200">
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECEPTIONS */}
              {results.receptions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                    Réceptions ({results.receptions.length})
                  </h4>
                  <div className="space-y-1">
                    {results.receptions.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onNavigate('reception-detail', r.id);
                          onClose();
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded border border-slate-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            Fiche réception du {r.reception_date || 'Date libre'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.mileage_in ? `${r.mileage_in.toLocaleString()} km` : 'Sans km'}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

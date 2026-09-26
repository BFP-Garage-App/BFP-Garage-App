import React, { useState } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  FileText,
  Car,
  User,
  Trash2,
  ShieldCheck,
  Receipt,
  Download,
  CheckCircle,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { DocumentRecord, DocumentType } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface DocumentsPageProps {
  onNavigate: (view: string, id?: string) => void;
  initialFilterType?: string;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onNavigate,
  initialFilterType = 'all',
}) => {
  const { documents, vehicles, clients, saveDocument, deleteDocument, getVehicle, getClient } =
    useGarage();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>(initialFilterType);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocData, setNewDocData] = useState<Partial<DocumentRecord>>({
    title: '',
    doc_type: initialFilterType === 'devis_factures' ? 'devis' : 'devis',
    file_name: '',
    file_size: 150000,
    client_id: '',
    vehicle_id: '',
    notes: '',
  });
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);

  const filteredDocs = documents.filter((d) => {
    const q = search.toLowerCase();
    const v = d.vehicle_id ? getVehicle(d.vehicle_id) : null;
    const c = d.client_id ? getClient(d.client_id) : null;

    const matchSearch =
      (d.title || '').toLowerCase().includes(q) ||
      (d.file_name || '').toLowerCase().includes(q) ||
      (d.notes || '').toLowerCase().includes(q) ||
      (v && (v.license_plate || '').toLowerCase().includes(q)) ||
      (c && (c.first_name || '').toLowerCase().includes(q));

    let matchType = true;
    if (filterType === 'devis_factures') {
      matchType = d.doc_type === 'devis' || d.doc_type === 'facture' || d.doc_type === 'bon_commande';
    } else if (filterType !== 'all') {
      matchType = d.doc_type === filterType;
    }

    return matchSearch && matchType;
  });

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    saveDocument(newDocData);
    setIsModalOpen(false);
    setNewDocData({
      title: '',
      doc_type: 'devis',
      file_name: '',
      file_size: 150000,
      client_id: '',
      vehicle_id: '',
      notes: '',
    });
  };

  const handleDeleteConfirm = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  const isDevisFactureMode = filterType === 'devis_factures';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {isDevisFactureMode ? (
              <Receipt className="w-5 h-5 text-orange-600" />
            ) : (
              <FolderOpen className="w-5 h-5 text-orange-600" />
            )}
            {isDevisFactureMode ? 'Devis & Factures Atelier' : 'Gestion Documentaire'} ({filteredDocs.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDevisFactureMode
              ? 'Devis, factures d’intervention et bons de commande (zéro champ obligatoire).'
              : 'Devis, factures, cartes grises, contrôles techniques et rapports rattachés (tout facultatif).'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isDevisFactureMode ? 'Créer devis / facture' : 'Ajouter un document'}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, fichier, immatriculation ou client..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-56 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
        >
          <option value="all">Tous les documents</option>
          <option value="devis_factures">Devis & Factures uniquement</option>
          <option value="devis">Devis</option>
          <option value="facture">Facture</option>
          <option value="controle_technique">Contrôle technique</option>
          <option value="carte_grise">Carte grise</option>
          <option value="rapport">Rapport atelier</option>
          <option value="bon_commande">Bon de commande</option>
          <option value="autre">Autre document</option>
        </select>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <FileText className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucun document dans cette vue</p>
          <p className="text-xs text-slate-400 mt-1">
            Enregistrez librement un devis, une facture ou un document sans validation bloquante.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
          >
            + Enregistrer un document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc) => {
            const v = doc.vehicle_id ? getVehicle(doc.vehicle_id) : null;
            const c = doc.client_id ? getClient(doc.client_id) : null;

            return (
              <div
                key={doc.id}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 rounded-lg p-4 flex flex-col justify-between transition-colors shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {doc.doc_type || 'Document'}
                    </span>

                    <button
                      onClick={() => setDocToDelete(doc)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">{doc.title || 'Document sans titre'}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {doc.file_name || 'document_atelier.pdf'}
                  </div>

                  {doc.notes && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{doc.notes}</p>}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  {v && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono font-medium text-slate-800">
                        {v.license_plate || 'Sans immat'} · {v.brand} {v.model}
                      </span>
                    </div>
                  )}

                  {c && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {c.first_name} {c.last_name}
                      </span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>Créé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                    <span className="text-orange-600 font-semibold cursor-pointer hover:underline">
                      Consulter
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DOCUMENT MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isDevisFactureMode ? 'Nouveau Devis ou Facture' : 'Ajouter un document'}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Titre du document (Facultatif)
                </label>
                <input
                  type="text"
                  value={newDocData.title || ''}
                  onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                  placeholder="Ex: Devis distribution, Facture révision, Contrôle technique..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Type de document</label>
                  <select
                    value={newDocData.doc_type || 'devis'}
                    onChange={(e) =>
                      setNewDocData({ ...newDocData, doc_type: e.target.value as DocumentType })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="devis">Devis</option>
                    <option value="facture">Facture</option>
                    <option value="bon_commande">Bon de commande</option>
                    <option value="controle_technique">Contrôle technique</option>
                    <option value="carte_grise">Carte grise</option>
                    <option value="rapport">Rapport atelier</option>
                    <option value="autre">Autre document</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Nom du fichier (Facultatif)</label>
                  <input
                    type="text"
                    value={newDocData.file_name || ''}
                    onChange={(e) => setNewDocData({ ...newDocData, file_name: e.target.value })}
                    placeholder="Ex: devis_bfp_092.pdf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Véhicule associé (Facultatif)</label>
                  <select
                    value={newDocData.vehicle_id || ''}
                    onChange={(e) =>
                      setNewDocData({ ...newDocData, vehicle_id: e.target.value || null })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans véhicule --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate || 'Sans immat'} · {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Client associé (Facultatif)</label>
                  <select
                    value={newDocData.client_id || ''}
                    onChange={(e) =>
                      setNewDocData({ ...newDocData, client_id: e.target.value || null })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes / Détails (Facultatif)</label>
                <textarea
                  rows={2}
                  value={newDocData.notes || ''}
                  onChange={(e) => setNewDocData({ ...newDocData, notes: e.target.value })}
                  placeholder="Montant indicatif, description des travaux ou références..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!docToDelete}
        title="Supprimer ce document ?"
        message={`Confirmez-vous la suppression du document ${docToDelete?.title || ''} ?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import {
    Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, AlertCircle,
    Calendar, Send, Factory, AlertTriangle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { 
    feedProductionsIndex, feedProductionsCreate, feedProductionsEdit, 
    feedProductionsDestroy, feedProductionsSubmit, feedProductionsApprove, 
    feedProductionsReject, feedProductionsShow 
} from '@/routes';

// Types alignés exactement avec ce que renvoie le FeedProductionController
type ProductionStatus = 'draft' | 'pending' | 'approved' | 'rejected';

interface FeedProduction {
    id: number;
    recipeId: number;
    recipe_name: string;
    batchMultiplier: number;
    totalOutput: number;
    date: string;
    status: ProductionStatus;
    notes: string | null;
    created_by: string;
    created_at: string;
    approved_by: string | null;
    approved_at: string | null;
    rejectionReason: string | null;
    // Permissions
    can_edit: boolean;
    can_delete: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_reject: boolean;
}

interface RecipeOption {
    id: number;
    name: string;
}

interface Filters {
    recipe_id?: string;
    status?: string;
}

interface PageProps {
    productions: FeedProduction[]; // Le contrôleur renvoie un tableau direct via ->get()
    recipes: RecipeOption[];
    filters: Filters;
    flash?: { success?: string; error?: string };
}

const STATUS_META: Record<ProductionStatus, { label: string; classes: string }> = {
    draft:    { label: 'Brouillon',   classes: 'bg-slate-100 text-slate-600' },
    pending:  { label: 'En attente',  classes: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approuvé',    classes: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejeté',      classes: 'bg-red-100 text-red-600' },
};

export default function FeedProductionsIndex({ productions = [], recipes = [], filters, flash }: PageProps) {
    const { addToast } = useToasts();

    // Filtres
    const [recipeFilter, setRecipeFilter] = useState(filters.recipe_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modale de rejet
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedProduction, setSelectedProduction] = useState<FeedProduction | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applyFilters = () => {
        router.get(feedProductionsIndex.url(), {
            recipe_id: recipeFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setRecipeFilter('');
        setStatusFilter('');
        router.get(feedProductionsIndex.url(), {}, { replace: true });
    };

    // Actions
    const handleDelete = (id: number) => {
        if (!confirm(`Supprimer cette production ?`)) return;
        router.delete(feedProductionsDestroy.url(id));
    };

    const handleSubmit = (id: number) => {
        router.post(feedProductionsSubmit.url(id), {}, {
            onError: (err: any) => addToast({ message: err.message || "Erreur lors de la soumission", type: 'error' }),
        });
    };

    const handleApprove = (id: number) => {
        if (!confirm(`Approuver cette production et déduire les stocks ?`)) return;
        router.post(feedProductionsApprove.url(id), {}, {
            onError: (err: any) => addToast({ message: err.message || "Erreur lors de l'approbation", type: 'error' }),
        });
    };

    const openRejectModal = (prod: FeedProduction) => {
        setSelectedProduction(prod);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleReject = () => {
        if (!selectedProduction || !rejectionReason.trim()) return;
        router.post(feedProductionsReject.url(selectedProduction.id), {
            reason: rejectionReason,
        }, {
            onSuccess: () => {
                setShowRejectModal(false);
                setSelectedProduction(null);
                setRejectionReason('');
            },
            onError: (err: any) => addToast({ message: err.message || "Erreur lors du rejet", type: 'error' }),
        });
    };

    // Statistiques calculées dynamiquement
    const approvedProductions = productions.filter(p => p.status === 'approved');
    const totalOutput = approvedProductions.reduce((sum, p) => sum + (Number(p.totalOutput) || 0), 0);
    const pendingCount = productions.filter(p => p.status === 'pending').length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Productions d\'aliments', href: feedProductionsIndex.url() }]}>
            <Head title="Productions d'aliments" />
            
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header façon Productions.tsx */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900">Production d'aliments</h2>
                        <p className="text-sm text-stone-500 mt-1">
                            Fabrication et suivi des productions
                        </p>
                    </div>
                    <button
                        onClick={() => router.get(feedProductionsCreate.url())}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle production
                    </button>
                </div>

                {/* Statistiques façon Productions.tsx */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Productions approuvées"
                        value={approvedProductions.length}
                        icon={CheckCircle}
                        color="emerald"
                    />
                    <StatCard
                        label="Aliment produit"
                        value={`${totalOutput.toLocaleString('fr-FR')} kg`}
                        icon={Factory}
                        color="blue"
                    />
                    <StatCard
                        label="En attente"
                        value={pendingCount}
                        icon={AlertTriangle}
                        color={pendingCount > 0 ? 'amber' : 'stone'}
                    />
                </div>

                {/* Filtres alignés avec le design */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
                    <div className="min-w-[200px]">
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Recette</label>
                        <select
                            value={recipeFilter}
                            onChange={e => setRecipeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        >
                            <option value="">Toutes les recettes</option>
                            {recipes.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Statut</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="draft">Brouillon</option>
                            <option value="pending">En attente</option>
                            <option value="approved">Approuvé</option>
                            <option value="rejected">Rejeté</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors"
                        >
                            Filtrer
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>

                {/* Tableau UI Productions.tsx */}
                <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    {['Date', 'Recette', 'Quantité', 'Notes', 'Statut', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {productions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-stone-400 text-sm">
                                            Aucune production enregistrée.
                                        </td>
                                    </tr>
                                ) : (
                                    productions.map(prod => {
                                        const meta = STATUS_META[prod.status];
                                        return (
                                            <tr key={prod.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-stone-700">
                                                        <Calendar className="w-4 h-4 text-stone-400" />
                                                        {prod.date}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <div className="font-medium text-stone-900">{prod.recipe_name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-medium text-stone-900">
                                                        {Number(prod.totalOutput).toLocaleString('fr-FR')} kg
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-stone-500 text-xs max-w-xs">
                                                    <p className="truncate" title={prod.notes || ''}>{prod.notes || '—'}</p>
                                                    {prod.rejectionReason && (
                                                        <div className="text-red-600 mt-1 font-medium truncate" title={prod.rejectionReason}>
                                                            Motif: {prod.rejectionReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${meta.classes}`}>
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {/* Toujours visible */}
                                                        <ActionButton
                                                            icon={<Eye className="w-4 h-4" />}
                                                            title="Voir le détail"
                                                            colorClass="hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => router.get(feedProductionsShow.url(prod.id))}
                                                        />

                                                        {/* Actions contextuelles basées sur les permissions Laravel */}
                                                        {prod.can_edit && (
                                                            <ActionButton
                                                                icon={<Edit2 className="w-4 h-4" />}
                                                                title="Modifier"
                                                                colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                                onClick={() => router.get(feedProductionsEdit.url(prod.id))}
                                                            />
                                                        )}
                                                        {prod.can_submit && (
                                                            <ActionButton
                                                                icon={<Send className="w-4 h-4" />}
                                                                title="Soumettre pour approbation"
                                                                colorClass="hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => handleSubmit(prod.id)}
                                                            />
                                                        )}
                                                        {prod.can_approve && (
                                                            <ActionButton
                                                                icon={<CheckCircle className="w-4 h-4" />}
                                                                title="Approuver"
                                                                colorClass="hover:text-emerald-600 hover:bg-emerald-50 text-emerald-500"
                                                                onClick={() => handleApprove(prod.id)}
                                                            />
                                                        )}
                                                        {prod.can_reject && (
                                                            <ActionButton
                                                                icon={<XCircle className="w-4 h-4" />}
                                                                title="Rejeter"
                                                                colorClass="hover:text-red-600 hover:bg-red-50 text-red-400"
                                                                onClick={() => openRejectModal(prod)}
                                                            />
                                                        )}
                                                        {prod.can_delete && (
                                                            <ActionButton
                                                                icon={<Trash2 className="w-4 h-4" />}
                                                                title="Supprimer"
                                                                colorClass="hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDelete(prod.id)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal de Rejet */}
                {showRejectModal && selectedProduction && (
                    <Modal title="Rejeter la production" onClose={() => setShowRejectModal(false)}>
                        <div className="space-y-3 mb-6 text-sm">
                            <p className="text-stone-600">
                                Vous êtes sur le point de rejeter la production de <strong>{selectedProduction.totalOutput} kg</strong> de <strong>{selectedProduction.recipe_name}</strong>.
                            </p>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                Motif de rejet <span className="text-stone-400">(obligatoire)</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                rows={3}
                                placeholder="Expliquez la raison du rejet..."
                                className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Confirmer le rejet
                            </button>
                        </div>
                    </Modal>
                )}
            </div>
        </AppLayout>
    );
}

// Composants UI réutilisables (Design System)
function ActionButton({ icon, title, colorClass, onClick }: any) {
    return (
        <button onClick={onClick} title={title} className={`p-1.5 rounded-lg text-stone-400 transition-colors ${colorClass}`}>
            {icon}
        </button>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-7 py-6">{children}</div>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'emerald' | 'blue' | 'amber' | 'stone';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        stone: 'bg-stone-100 text-stone-600',
    };

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs text-stone-500 font-medium mb-1">{label}</p>
                    <p className="text-2xl font-bold text-stone-900">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
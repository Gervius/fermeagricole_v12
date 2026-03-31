import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Plus, Search, Edit2, Trash2, Download, Building2, 
    User, Truck, X, Phone, Mail, MapPin, CheckCircle2, XCircle 
} from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { partnersIndex, partnersStore, partnersUpdate, partnersDestroy } from '@/routes';

interface Partner {
    id: number;
    name: string;
    type: 'customer' | 'supplier' | 'both';
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    balance: number;
}

interface Props {
    partners: {
        data: Partner[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        type?: string;
    };
    flash?: { success?: string; error?: string };
}

export default function Index({ partners, filters, flash }: Props) {
    const { addToast } = useToasts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        name: '',
        type: 'customer',
        phone: '',
        email: '',
        address: '',
        is_active: true,
    });

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(partnersIndex.url(), {
            search: formData.get('search'),
            type: formData.get('type')
        }, { preserveState: true });
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (partner: Partner) => {
        clearErrors();
        setData({
            name: partner.name,
            type: partner.type,
            phone: partner.phone || '',
            email: partner.email || '',
            address: partner.address || '',
            is_active: partner.is_active,
        });
        setEditingId(partner.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            reset();
            setEditingId(null);
        }, 200); // Délai pour l'animation de fermeture
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            router.put(partnersUpdate.url(editingId), data as any, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        } else {
            router.post(partnersStore.url(), data as any, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (partner: Partner) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le partenaire "${partner.name}" ?`)) {
            router.delete(partnersDestroy.url(partner.id));
        }
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'customer': return <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-200 w-max"><User className="w-3.5 h-3.5" /> Client</span>;
            case 'supplier': return <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200 w-max"><Truck className="w-3.5 h-3.5" /> Fournisseur</span>;
            case 'both': return <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md text-xs font-semibold border border-purple-200 w-max"><Building2 className="w-3.5 h-3.5" /> Mixte</span>;
            default: return type;
        }
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Tiers & Partenaires', href: partnersIndex.url() }]}>
            <Head title="Gestion des Partenaires" />
            <div className="min-h-screen bg-stone-50/50 pb-12">

                {/* Header */}
                <div className="bg-white border-b border-stone-200 px-4 sm:px-8 py-6 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
                                <div className="p-2 bg-stone-100 rounded-lg">
                                    <Building2 className="w-6 h-6 text-stone-600" />
                                </div>
                                Tiers & Partenaires
                            </h1>
                            <p className="text-stone-500 text-sm mt-1.5">Gérez votre répertoire de clients, fournisseurs et suivez leurs soldes comptables.</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Ajouter un partenaire
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">

                    {/* Barre de recherche et filtres */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-sm">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Rechercher par nom, téléphone, email..."
                                    className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-stone-900 placeholder-stone-400"
                                />
                            </div>
                            <div className="h-auto w-px bg-stone-200 hidden sm:block mx-2 my-2"></div>
                            <div className="flex gap-2 sm:w-auto w-full">
                                <select
                                    name="type"
                                    defaultValue={filters.type}
                                    className="flex-1 sm:w-48 px-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-stone-700 font-medium cursor-pointer"
                                >
                                    <option value="">Tous les types</option>
                                    <option value="customer">Clients uniquement</option>
                                    <option value="supplier">Fournisseurs uniquement</option>
                                    <option value="both">Mixtes</option>
                                </select>
                                <button type="submit" className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors">
                                    Filtrer
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table des partenaires */}
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-stone-50/80 text-stone-500 text-xs uppercase tracking-wider font-bold border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4">Partenaire</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Type & Statut</th>
                                        <th className="px-6 py-4 text-right">Solde Comptable</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {partners.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                                        <Search className="w-8 h-8 text-stone-400" />
                                                    </div>
                                                    <p className="text-stone-900 font-medium text-base">Aucun partenaire trouvé</p>
                                                    <p className="text-stone-500 mt-1">Essayez d'ajuster vos critères de recherche.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        partners.data.map(partner => (
                                            <tr key={partner.id} className={`hover:bg-stone-50/80 transition-colors group ${!partner.is_active ? 'opacity-75' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${partner.is_active ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                                                            {getInitials(partner.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-stone-900 text-base">{partner.name}</div>
                                                            {partner.address && (
                                                                <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate max-w-[200px]">{partner.address}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5 text-xs text-stone-600">
                                                        {partner.phone ? (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3.5 h-3.5 text-stone-400" /> {partner.phone}
                                                            </div>
                                                        ) : <span className="text-stone-400 italic">—</span>}
                                                        
                                                        {partner.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-3.5 h-3.5 text-stone-400" /> {partner.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-2">
                                                        {getTypeLabel(partner.type)}
                                                        {partner.is_active ? (
                                                            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Actif
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-400">
                                                                <XCircle className="w-3 h-3 text-stone-400" /> Inactif
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`inline-flex flex-col items-end px-3 py-1.5 rounded-lg font-bold ${
                                                        partner.balance > 0 ? 'bg-red-50 text-red-700' : 
                                                        (partner.balance < 0 ? 'bg-emerald-50 text-emerald-700' : 'text-stone-600')
                                                    }`}>
                                                        <span>{formatCurrency(Math.abs(partner.balance))}</span>
                                                        <span className="text-[10px] font-semibold opacity-70 uppercase tracking-widest mt-0.5">
                                                            {partner.balance > 0 ? 'Débiteur (Dû)' : (partner.balance < 0 ? 'Créditeur (Avoir)' : 'À jour')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <a
                                                            href={`/partners/${partner.id}/statement`}
                                                            target="_blank"
                                                            title="Télécharger le relevé (3 derniers mois)"
                                                            className="p-2.5 text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => openEditModal(partner)}
                                                            title="Modifier"
                                                            className="p-2.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(partner)}
                                                            title="Supprimer"
                                                            className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal de Création / Édition */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-stone-900">
                                    {editingId ? 'Modifier le partenaire' : 'Nouveau partenaire'}
                                </h3>
                                <p className="text-sm text-stone-500 mt-1">
                                    {editingId ? 'Mettez à jour les informations du profil.' : 'Remplissez les informations ci-dessous pour créer une fiche.'}
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-6">
                                {/* Ligne 1 : Nom et Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nom complet ou Raison sociale <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ex: Entreprise S.A."
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                                            required
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Type de partenaire <span className="text-red-500">*</span></label>
                                        <select
                                            value={data.type}
                                            onChange={e => setData('type', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm bg-white"
                                        >
                                            <option value="customer">Client</option>
                                            <option value="supplier">Fournisseur</option>
                                            <option value="both">Mixte (Client & Fournisseur)</option>
                                        </select>
                                        {errors.type && <p className="text-red-500 text-xs mt-1.5">{errors.type}</p>}
                                    </div>
                                </div>

                                {/* Ligne 2 : Contact */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="text"
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                                placeholder="+226..."
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">Adresse Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="contact@exemple.com"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Ligne 3 : Adresse physique */}
                                <div>
                                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Adresse Physique</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                                        <textarea
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            rows={2}
                                            placeholder="Quartier, Secteur, Rue..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Ligne 4 : Statut avec un Toggle moderne */}
                                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                    <div>
                                        <p className="text-sm font-semibold text-stone-900">Statut du compte</p>
                                        <p className="text-xs text-stone-500 mt-0.5">Activer ou désactiver ce partenaire dans le système.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setData('is_active', !data.is_active)}
                                        className={`${data.is_active ? 'bg-emerald-500' : 'bg-stone-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                                    >
                                        <span className={`${data.is_active ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-sm font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {editingId ? 'Enregistrer les modifications' : 'Créer le partenaire'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
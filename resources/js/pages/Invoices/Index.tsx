// resources/js/Pages/Invoices/Index.tsx
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus, Search, Eye, MessageCircle, Download, DollarSign, Clock, 
    CheckCircle, AlertCircle, FileText, Send, XCircle, ArrowBigRight, 
    ShoppingCart, Tag, AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { invoicesIndex, invoicesCreate, invoicesShow } from '@/routes';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

interface Invoice {
    id: number;
    number: string;
    customer_name: string;
    customer_phone?: string;
    date: string;
    due_date: string | null;
    total: number;
    paid_amount: number;
    remaining: number;
    status: InvoiceStatus;
    payment_status: PaymentStatus;
    items_count: number;
    items_types: string[];
    is_overdue: boolean;
}

interface Stats {
    total_revenue: number;
    total_collected: number;
    total_receivable: number;
    overdue_count: number;
}

interface Props {
    invoices: { data: Invoice[]; current_page: number; last_page: number; total: number; };
    filters: { search?: string; payment_status?: string };
    stats: Stats;
    flash?: { success?: string; error?: string };
}

const STATUS_META: Record<InvoiceStatus, { label: string; classes: string; icon: any }> = {
    draft:     { label: 'Brouillon', classes: 'bg-stone-100 text-stone-600', icon: Clock },
    sent:      { label: 'Validée',   classes: 'bg-blue-100 text-blue-700', icon: Send },
    paid:      { label: 'Soldée',    classes: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    partial:   { label: 'Partielle', classes: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    cancelled: { label: 'Annulée',   classes: 'bg-red-100 text-red-600', icon: XCircle },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; classes: string }> = {
    unpaid:  { label: 'Non payé',  classes: 'text-red-600 bg-red-50 ring-red-500/20' },
    partial: { label: 'Partiel',   classes: 'text-amber-600 bg-amber-50 ring-amber-500/20' },
    paid:    { label: 'Soldé',     classes: 'text-emerald-600 bg-emerald-50 ring-emerald-500/20' },
};

export default function InvoicesIndex({ invoices, filters, stats, flash }: Props) {
    const { addToast } = useToasts();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.payment_status || '');

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(invoicesIndex.url(), { search: search || undefined, payment_status: statusFilter || undefined }, { preserveState: true });
    };

    const handleWhatsApp = (invoice: Invoice) => {
        if (!invoice.customer_phone) return addToast({ message: 'Numéro manquant', type: 'error' });
        const msg = `Bonjour ${invoice.customer_name}, rappel: votre facture ${invoice.number} d'un montant de ${formatCurrency(invoice.remaining)} arrive à échéance. Merci!`;
        window.open(`https://wa.me/${invoice.customer_phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Facturation', href: invoicesIndex.url() }]}>
            <Head title="Factures & Règlements" />
            
            {/* Header */}
            <div className="bg-white border-b border-stone-200 px-4 sm:px-8 py-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
                            <div className="p-2 bg-stone-100 rounded-lg"><FileText className="w-6 h-6 text-stone-600" /></div>
                            Factures & Règlements
                        </h1>
                        <p className="text-stone-500 text-sm mt-1.5">Gérez vos créances, ventes et achats.</p>
                    </div>
                    <button onClick={() => router.get(invoicesCreate.url())} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" /> Nouvelle Facture
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
                
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard title="Chiffre d'Affaires" value={stats.total_revenue} icon={DollarSign} color="indigo" />
                    <StatCard title="Encaissé" value={stats.total_collected} icon={CheckCircle} color="emerald" />
                    <StatCard title="Reste à encaisser" value={stats.total_receivable} icon={ArrowBigRight} color="amber" />
                    <StatCard title="En retard" value={stats.overdue_count} isCount icon={AlertTriangle} color="red" />
                </div>

                {/* Filtres */}
                <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-sm">
                    <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="N° Facture, Client..." className="w-full pl-11 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-stone-900 placeholder-stone-400" />
                        </div>
                        <div className="h-auto w-px bg-stone-200 hidden sm:block mx-2 my-2"></div>
                        <div className="flex gap-2 sm:w-auto w-full">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 sm:w-48 px-4 py-3 bg-transparent border-none text-sm focus:ring-0 text-stone-700 font-medium">
                                <option value="">Tous les règlements</option>
                                <option value="paid">Soldées</option>
                                <option value="partial">Paiement partiel</option>
                                <option value="unpaid">Non payées</option>
                            </select>
                            <button type="submit" className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl transition-colors">Filtrer</button>
                        </div>
                    </form>
                </div>

                {/* Tableau */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-stone-50/80 text-stone-500 text-xs uppercase font-bold border-b border-stone-200">
                                <tr>
                                    <th className="px-6 py-4">Référence & Client</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4 text-right">Montants</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {invoices.data.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-500">Aucune facture trouvée.</td></tr>
                                ) : invoices.data.map(inv => {
                                    const isPurchase = inv.number.startsWith('ACH');
                                    const MetaIcon = STATUS_META[inv.status].icon;
                                    
                                    return (
                                        <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isPurchase ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        {isPurchase ? <ShoppingCart className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-stone-900">{inv.number}</div>
                                                        <div className="text-stone-500 text-xs mt-0.5">{inv.customer_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-stone-900">{format(parseISO(inv.date), 'dd/MM/yyyy')}</div>
                                                {inv.due_date && (
                                                    <div className={`text-xs mt-1 flex items-center gap-1 ${inv.is_overdue ? 'text-red-600 font-semibold' : 'text-stone-400'}`}>
                                                        <Clock className="w-3 h-3" /> Éch: {format(parseISO(inv.due_date), 'dd/MM/yyyy')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-stone-900">{formatCurrency(inv.total)}</div>
                                                {inv.remaining > 0 && <div className="text-xs text-amber-600 mt-0.5 font-medium">Reste: {formatCurrency(inv.remaining)}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_META[inv.status].classes}`}>
                                                        <MetaIcon className="w-3 h-3" /> {STATUS_META[inv.status].label}
                                                    </span>
                                                    {inv.status !== 'cancelled' && (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset ${PAYMENT_META[inv.payment_status].classes}`}>
                                                            {PAYMENT_META[inv.payment_status].label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {inv.customer_phone && inv.remaining > 0 && (
                                                        <button onClick={() => handleWhatsApp(inv)} className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Relance WhatsApp">
                                                            <MessageCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => router.get(invoicesShow.url(inv.id))} className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon: Icon, color, isCount = false }: any) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors[color as keyof typeof colors]}`}><Icon className="w-6 h-6" /></div>
                <div>
                    <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-black text-stone-900 mt-1">{isCount ? value : formatCurrency(value)}</p>
                </div>
            </div>
        </div>
    );
}
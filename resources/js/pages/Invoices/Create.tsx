// resources/js/Pages/Invoices/Create.tsx
import React, { useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Save, ShoppingCart, Tag, ArrowLeft, Building2, Calendar as CalendarIcon, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { invoicesIndex, invoicesStore } from '@/routes';
import { formatCurrency } from '@/lib/utils';

interface Props {
    activeFlocks: { id: number; name: string }[];
    customers: { id: number; name: string; type: string }[];
    nextInvoiceNumber: string;
}

export default function Create({ activeFlocks, customers, nextInvoiceNumber }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        number: nextInvoiceNumber,
        type: 'sale',
        partner_id: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }]
    });

    const filteredPartners = useMemo(() => {
        return customers.filter(p => data.type === 'sale' ? (p.type === 'customer' || p.type === 'both') : (p.type === 'supplier' || p.type === 'both'));
    }, [data.type, customers]);

    const handleTypeChange = (newType: 'sale' | 'purchase') => {
        const prefix = newType === 'sale' ? 'FAC-' : 'ACH-';
        setData(d => ({
            ...d, type: newType, partner_id: '',
            number: d.number.replace(/^(FAC|ACH)-/, prefix),
            items: [{ description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }]
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        (newItems[index] as any)[field] = value;
        setData('items', newItems);
    };

    const totalHT = data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(invoicesStore.url());
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Factures', href: invoicesIndex.url() }, {
            title: 'Nouvelle',
            href: ''
        }]}>
            <Head title="Nouvelle Facture" />
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-8">
                
                {/* En-tête de page */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.get(invoicesIndex.url())} className="p-2 bg-white border border-stone-200 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Créer une facture</h1>
                        <p className="text-sm text-stone-500 mt-1">Saisissez les informations de la transaction.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Switcher Achat/Vente (Segmented Control) */}
                    <div className="bg-stone-100 p-1.5 rounded-2xl flex w-fit mx-auto shadow-inner">
                        <button type="button" onClick={() => handleTypeChange('sale')} className={`flex items-center justify-center gap-2 w-48 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${data.type === 'sale' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}>
                            <Tag className="w-4 h-4" /> Vente (Client)
                        </button>
                        <button type="button" onClick={() => handleTypeChange('purchase')} className={`flex items-center justify-center gap-2 w-48 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${data.type === 'purchase' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-stone-200/50' : 'text-stone-500 hover:text-stone-700'}`}>
                            <ShoppingCart className="w-4 h-4" /> Achat (Fournisseur)
                        </button>
                    </div>

                    {/* Informations Générales */}
                    <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Référence */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                    <FileText className="w-4 h-4" /> Référence
                                </label>
                                <input type="text" value={data.number} className="w-full bg-stone-50 border-stone-200 text-stone-600 rounded-xl px-4 py-3 font-mono text-sm shadow-sm focus:ring-0 cursor-not-allowed" readOnly />
                            </div>
                            
                            {/* Partenaire */}
                            <div className="space-y-2 md:col-span-1">
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                    <Building2 className="w-4 h-4" /> {data.type === 'sale' ? 'Client' : 'Fournisseur'} <span className="text-red-500">*</span>
                                </label>
                                <select value={data.partner_id} onChange={e => setData('partner_id', e.target.value)} className={`w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white cursor-pointer ${!data.partner_id ? 'text-stone-400' : 'text-stone-900'}`} required>
                                    <option value="" disabled>Sélectionner un partenaire...</option>
                                    {filteredPartners.map(p => <option key={p.id} value={p.id} className="text-stone-900">{p.name}</option>)}
                                </select>
                                {errors.partner_id && <p className="text-red-500 text-xs mt-1">{errors.partner_id}</p>}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                    <CalendarIcon className="w-4 h-4" /> Date <span className="text-red-500">*</span>
                                </label>
                                <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} className="w-full bg-stone-50 border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white" required />
                            </div>
                        </div>
                    </div>

                    {/* Lignes de facture */}
                    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-stone-100 bg-stone-50/50">
                            <h2 className="text-base font-bold text-stone-900">Détail des articles</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white border-b border-stone-100">
                                    <tr className="text-stone-400 text-xs uppercase font-bold tracking-widest">
                                        <th className="px-8 py-4 text-left">Description</th>
                                        {data.type === 'sale' && <th className="px-4 py-4 text-left w-48">Liaison Stock</th>}
                                        <th className="px-4 py-4 text-right w-32">Qté</th>
                                        <th className="px-4 py-4 text-right w-40">Prix Unit.</th>
                                        <th className="px-8 py-4 text-right w-40">Total</th>
                                        <th className="px-4 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-stone-50/50 transition-colors">
                                            <td className="px-8 py-3">
                                                <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Ex: Plateaux d'oeufs..." className="w-full bg-transparent border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 text-stone-900 font-medium px-0 py-2 placeholder:text-stone-300 transition-colors" required />
                                            </td>
                                            {data.type === 'sale' && (
                                                <td className="px-4 py-3">
                                                    <select value={item.itemable_type} onChange={e => updateItem(idx, 'itemable_type', e.target.value)} className="w-full bg-stone-50 border-transparent rounded-lg text-xs text-stone-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 py-2 cursor-pointer">
                                                        <option value="">-- Sans liaison --</option>
                                                        <option value="App\Models\EggMovement">Stock d'Oeufs</option>
                                                        <option value="App\Models\Flock">Poules de réforme</option>
                                                    </select>
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <input type="number" min="0.1" step="0.1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full text-right bg-stone-50 border-transparent rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 py-2" required />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-full text-right bg-stone-50 border-transparent rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 py-2" required />
                                            </td>
                                            <td className="px-8 py-3 text-right font-bold text-stone-900">
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button type="button" onClick={() => setData('items', data.items.filter((_, i) => i !== idx))} disabled={data.items.length === 1} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="px-8 py-6 bg-stone-50/50 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <button type="button" onClick={() => setData('items', [...data.items, { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }])} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-colors">
                                <Plus className="w-4 h-4" /> Ajouter une ligne
                            </button>
                            <div className="text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-100 min-w-[250px]">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Net à payer</p>
                                <p className="text-3xl font-black text-stone-900">{formatCurrency(totalHT)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button type="button" onClick={() => router.get(invoicesIndex.url())} className="px-6 py-3.5 text-sm font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors">
                            Annuler
                        </button>
                        <button type="submit" disabled={processing} className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${data.type === 'sale' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                            <Save className="w-5 h-5" /> {processing ? 'Enregistrement...' : 'Enregistrer la facture'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
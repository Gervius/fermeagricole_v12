// resources/js/Pages/Invoices/Create.tsx
import React, { useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Save, ShoppingCart, Tag, ArrowLeft } from 'lucide-react';
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

    const handleSubmit = (e: React.SubmitEvent) => {
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
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Switcher Achat/Vente */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-1.5 shadow-sm flex w-fit mx-auto gap-1">
                        <button type="button" onClick={() => handleTypeChange('sale')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${data.type === 'sale' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}>
                            <Tag className="w-4 h-4" /> Vente (Client)
                        </button>
                        <button type="button" onClick={() => handleTypeChange('purchase')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${data.type === 'purchase' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}>
                            <ShoppingCart className="w-4 h-4" /> Achat (Fournisseur)
                        </button>
                    </div>

                    {/* Informations */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4">Informations Générales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Référence</label>
                                <input type="text" value={data.number} className="w-full rounded-xl border-stone-200 bg-stone-50 font-mono text-sm text-stone-500" readOnly />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                    {data.type === 'sale' ? 'Client' : 'Fournisseur'} <span className="text-red-500">*</span>
                                </label>
                                <select value={data.partner_id} onChange={e => setData('partner_id', e.target.value)} className="w-full rounded-xl border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required>
                                    <option value="">Sélectionner...</option>
                                    {filteredPartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {errors.partner_id && <p className="text-red-500 text-xs mt-1">{errors.partner_id}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Date d'opération <span className="text-red-500">*</span></label>
                                <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} className="w-full rounded-xl border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required />
                            </div>
                        </div>
                    </div>

                    {/* Lignes de facture */}
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-stone-100">
                            <h2 className="text-lg font-bold text-stone-900">Articles facturés</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50/80 border-b border-stone-200">
                                    <tr className="text-stone-500 text-xs uppercase font-bold tracking-wider">
                                        <th className="px-6 py-4 text-left">Description</th>
                                        {data.type === 'sale' && <th className="px-6 py-4 text-left w-48">Liaison Stock (Optionnel)</th>}
                                        <th className="px-6 py-4 text-right w-32">Qté</th>
                                        <th className="px-6 py-4 text-right w-40">Prix Unit.</th>
                                        <th className="px-6 py-4 text-right w-40">Total</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="px-6 py-3">
                                                <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Ex: Plateaux d'oeufs..." className="w-full rounded-lg border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required />
                                            </td>
                                            {data.type === 'sale' && (
                                                <td className="px-6 py-3">
                                                    <select value={item.itemable_type} onChange={e => updateItem(idx, 'itemable_type', e.target.value)} className="w-full rounded-lg border-stone-200 text-xs text-stone-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                                                        <option value="">Aucune liaison</option>
                                                        <option value="App\Models\EggMovement">Stock d'Oeufs</option>
                                                        <option value="App\Models\Flock">Poules de réforme</option>
                                                    </select>
                                                </td>
                                            )}
                                            <td className="px-6 py-3">
                                                <input type="number" min="0.1" step="0.1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full text-right rounded-lg border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-full text-right rounded-lg border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required />
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-stone-900 bg-stone-50/50">
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button type="button" onClick={() => setData('items', data.items.filter((_, i) => i !== idx))} disabled={data.items.length === 1} className="p-2 text-stone-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-stone-50/80 border-t border-stone-200 flex justify-between items-center">
                            <button type="button" onClick={() => setData('items', [...data.items, { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }])} className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-lg transition-colors">
                                <Plus className="w-4 h-4" /> Ajouter une ligne
                            </button>
                            <div className="text-right">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Net à payer</p>
                                <p className="text-3xl font-black text-stone-900 mt-1">{formatCurrency(totalHT)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => router.get(invoicesIndex.url())} className="px-6 py-3 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">Annuler</button>
                        <button type="submit" disabled={processing} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md ${data.type === 'sale' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-stone-900 hover:bg-stone-800'}`}>
                            <Save className="w-4 h-4" /> {processing ? 'Enregistrement...' : 'Enregistrer la facture'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
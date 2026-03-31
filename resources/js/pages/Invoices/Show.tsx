// resources/js/Pages/Invoices/Show.tsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Download, CheckCircle, Clock, FileText, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { invoicesIndex, invoicesDownloadPdf, invoicesApprove, invoicesAddPayment } from '@/routes';

export default function InvoiceShow({ invoice, flash }: any) {
    const { addToast } = useToasts();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [paymentForm, setPaymentForm] = useState({
        amount: invoice.remaining_amount,
        payment_date: new Date().toISOString().split('T')[0],
        method: 'Orange Money',
        reference: '',
    });

    const isPurchase = invoice.type === 'purchase';

    const handleApprove = () => {
        router.post(invoicesApprove.url(invoice.id), {}, {
            onSuccess: () => addToast({ message: 'Facture validée', type: 'success' })
        });
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(invoicesAddPayment.url(invoice.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false);
                addToast({ message: 'Paiement enregistré avec succès', type: 'success' });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Factures', href: invoicesIndex.url() }, {
            title: invoice.number,
            href: ''
        }]}>
            <Head title={`Facture ${invoice.number}`} />
            
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
                
                {/* Barre d'outils */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <button onClick={() => router.get(invoicesIndex.url())} className="flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Retour à la liste
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => router.get(invoicesDownloadPdf.url(invoice.id))} className="px-4 py-2 bg-white border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 shadow-sm flex items-center gap-2">
                            <Download className="w-4 h-4" /> Imprimer PDF
                        </button>
                        {invoice.status === 'draft' && invoice.can_approve && (
                            <button onClick={handleApprove} className="px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 shadow-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Valider définitivement
                            </button>
                        )}
                        {invoice.can_add_payment && invoice.status !== 'draft' && (
                            <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 shadow-sm flex items-center gap-2">
                                Enregistrer un paiement
                            </button>
                        )}
                    </div>
                </div>

                {/* Feuille de Facture (Design Papier) */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 sm:p-12 relative overflow-hidden">
                    {/* Bandeau de couleur type Achat/Vente */}
                    <div className={`absolute top-0 left-0 w-full h-2 ${isPurchase ? 'bg-amber-500' : 'bg-stone-900'}`}></div>
                    
                    {/* En-tête facture */}
                    <div className="flex justify-between items-start mb-12 mt-4">
                        <div>
                            <h2 className="text-3xl font-black text-stone-900 tracking-tight">FACTURE</h2>
                            <p className="text-stone-500 font-mono mt-1">{invoice.number}</p>
                            <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold rounded-full ${invoice.status === 'draft' ? 'bg-stone-100 text-stone-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {invoice.status === 'draft' ? 'BROUILLON (Non comptabilisé)' : 'VALIDÉE'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">{isPurchase ? 'Fournisseur' : 'Facturé à'}</p>
                            <p className="text-lg font-bold text-stone-900">{invoice.customer_name}</p>
                            <p className="text-sm text-stone-600 mt-2">Date: {format(parseISO(invoice.date), 'dd/MM/yyyy')}</p>
                            {invoice.due_date && <p className="text-sm text-stone-600">Échéance: {format(parseISO(invoice.due_date), 'dd/MM/yyyy')}</p>}
                        </div>
                    </div>

                    {/* Tableau des articles */}
                    <table className="w-full text-sm mb-8">
                        <thead className="border-b-2 border-stone-900 text-stone-900">
                            <tr>
                                <th className="py-3 text-left font-bold">Désignation</th>
                                <th className="py-3 text-center font-bold">Qté</th>
                                <th className="py-3 text-right font-bold">Prix unitaire</th>
                                <th className="py-3 text-right font-bold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                            {invoice.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4 font-medium">{item.description}</td>
                                    <td className="py-4 text-center">{item.quantity}</td>
                                    <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-4 text-right font-bold text-stone-900">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totaux */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full sm:w-1/2 lg:w-1/3 bg-stone-50 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-stone-500 font-medium">Sous-total</span>
                                <span className="text-stone-900 font-bold">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 border-b border-stone-200 pb-3">
                                <span className="text-stone-500 font-medium">TVA ({invoice.tax_rate}%)</span>
                                <span className="text-stone-900 font-bold">{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-stone-900 font-black text-lg">Total TTC</span>
                                <span className="text-stone-900 font-black text-lg">{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 text-emerald-600">
                                <span className="font-medium">Déjà payé</span>
                                <span className="font-bold">-{formatCurrency(invoice.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-stone-200">
                                <span className="text-stone-900 font-black">Reste à payer</span>
                                <span className="text-amber-600 font-black text-xl">{formatCurrency(invoice.remaining_amount)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Lignes de paiements (si existent) */}
                    {invoice.payments.length > 0 && (
                        <div className="border-t border-stone-100 pt-8 mt-8">
                            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Historique des règlements</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {invoice.payments.map((p: any) => (
                                    <div key={p.id} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-200/50 px-2 py-1 rounded">{p.method}</span>
                                            <span className="text-xs text-emerald-600 font-medium">{format(parseISO(p.payment_date), 'dd/MM/yy')}</span>
                                        </div>
                                        <p className="text-lg font-black text-emerald-900">{formatCurrency(p.amount)}</p>
                                        {p.reference && <p className="text-xs text-emerald-600 mt-1 truncate">Réf: {p.reference}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Paiement */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100">
                            <h3 className="font-bold text-stone-900">Enregistrer un règlement</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handlePayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Montant</label>
                                <input type="number" step="0.01" max={invoice.remaining_amount} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full rounded-xl border-stone-200 text-sm focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Date</label>
                                <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} className="w-full rounded-xl border-stone-200 text-sm focus:ring-amber-500" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Méthode</label>
                                <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full rounded-xl border-stone-200 text-sm focus:ring-amber-500">
                                    <option>Orange Money</option>
                                    <option>Moov Money</option>
                                    <option>Espèces</option>
                                    <option>Virement Bancaire</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Référence (Optionnel)</label>
                                <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full rounded-xl border-stone-200 text-sm focus:ring-amber-500" placeholder="Numéro de transaction..." />
                            </div>
                            <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl mt-4 transition-colors">Confirmer le paiement</button>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
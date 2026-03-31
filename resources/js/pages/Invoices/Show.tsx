// resources/js/Pages/Invoices/Show.tsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Download, CheckCircle, Clock, X, DollarSign, Send, FileText, User, CreditCard } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { invoicesIndex, invoicesDownloadPdf, invoicesApprove, invoicesAddPayment } from '@/routes';

export default function InvoiceShow({ invoice, partner, flash }: any) {
    const { addToast } = useToasts();
    const [activeTab, setActiveTab] = useState<'invoice' | 'statement'>('invoice');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [paymentForm, setPaymentForm] = useState({
        amount: invoice.remaining_amount,
        payment_date: new Date().toISOString().split('T')[0],
        method: 'Orange Money',
        reference: '',
    });

    const isPurchase = invoice.type === 'purchase';

    if (flash?.success) addToast({ message: flash.success, type: 'success' });
    if (flash?.error) addToast({ message: flash.error, type: 'error' });

    const handleApprove = () => {
        router.post(invoicesApprove.url(invoice.id), {}, {
            onSuccess: () => {
                addToast({ message: 'Facture validée avec succès', type: 'success' });
                router.reload({ only: ['invoice'] });
            }
        });
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(invoicesAddPayment.url(invoice.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false);
                addToast({ message: 'Règlement enregistré', type: 'success' });
                router.reload({ only: ['invoice'] });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Factures', href: invoicesIndex.url() }, {
            title: invoice.number,
            href: ''
        }]}>
            <Head title={`Facture ${invoice.number}`} />
            
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-8">
                
                {/* Actions Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <button onClick={() => router.get(invoicesIndex.url())} className="flex items-center gap-2 p-2 pr-4 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-sm">
                        <div className="p-1 bg-stone-100 rounded-lg"><ArrowLeft className="w-4 h-4" /></div>
                        Retour
                    </button>
                    
                    <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <button onClick={() => router.get(invoicesDownloadPdf.url(invoice.id))} className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-50 shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap">
                            <Download className="w-4 h-4 text-stone-400" /> Imprimer PDF
                        </button>
                        
                        {invoice.status === 'draft' && invoice.can_approve && (
                            <button onClick={handleApprove} className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 shadow-sm shadow-emerald-200 flex items-center gap-2 transition-colors whitespace-nowrap">
                                <CheckCircle className="w-4 h-4" /> Valider la facture
                            </button>
                        )}
                        
                        {invoice.can_add_payment && invoice.status !== 'draft' && (
                            <button onClick={() => setShowPaymentModal(true)} className="px-5 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 shadow-sm shadow-stone-300 flex items-center gap-2 transition-colors whitespace-nowrap">
                                <DollarSign className="w-4 h-4 text-amber-400" /> Enregistrer paiement
                            </button>
                        )}
                    </div>
                </div>

                {/* Onglets Pilules Modernes */}
                <div className="flex p-1 bg-stone-200/50 rounded-xl w-fit mb-6">
                    <button onClick={() => setActiveTab('invoice')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invoice' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                        <FileText className="w-4 h-4" /> Détail Facture
                    </button>
                    {partner && (
                        <button onClick={() => setActiveTab('statement')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'statement' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                            <User className="w-4 h-4" /> Relevé Client
                        </button>
                    )}
                </div>

                {activeTab === 'invoice' ? (
                    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden relative">
                        {/* Liseré haut coloré */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isPurchase ? 'bg-amber-500' : 'bg-indigo-600'}`}></div>
                        
                        <div className="p-8 sm:p-12">
                            {/* Header Facture */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black text-stone-900 tracking-tight">FACTURE</h2>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${invoice.status === 'draft' ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {invoice.status === 'draft' ? 'BROUILLON' : 'VALIDÉE'}
                                        </span>
                                    </div>
                                    <p className="text-stone-500 font-mono text-lg">{invoice.number}</p>
                                    
                                    <div className="mt-8 flex gap-8">
                                        <div>
                                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Date</p>
                                            <p className="font-semibold text-stone-900">{format(parseISO(invoice.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        {invoice.due_date && (
                                            <div>
                                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Échéance</p>
                                                <p className="font-semibold text-stone-900">{format(parseISO(invoice.due_date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="bg-stone-50 p-6 rounded-2xl w-full md:w-72 border border-stone-100">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{isPurchase ? 'Fournisseur' : 'Facturé à'}</p>
                                    <p className="text-lg font-bold text-stone-900">{invoice.customer_name}</p>
                                    {invoice.customer_phone && <p className="text-sm text-stone-500 mt-2 flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> {invoice.customer_phone}</p>}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto mb-8 border border-stone-100 rounded-2xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-stone-50 text-stone-500">
                                        <tr>
                                            <th className="py-4 px-6 text-left font-bold text-xs uppercase tracking-wider">Désignation</th>
                                            <th className="py-4 px-6 text-center font-bold text-xs uppercase tracking-wider">Qté</th>
                                            <th className="py-4 px-6 text-right font-bold text-xs uppercase tracking-wider">Prix unit.</th>
                                            <th className="py-4 px-6 text-right font-bold text-xs uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-stone-700">
                                        {invoice.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-4 px-6 font-medium text-stone-900">{item.description}</td>
                                                <td className="py-4 px-6 text-center">{item.quantity}</td>
                                                <td className="py-4 px-6 text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="py-4 px-6 text-right font-bold text-stone-900">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Block */}
                            <div className="flex justify-end">
                                <div className="w-full sm:w-80 space-y-3 text-sm">
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-stone-500 font-medium">Sous-total</span>
                                        <span className="text-stone-900 font-bold">{formatCurrency(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 pb-4 border-b border-stone-100">
                                        <span className="text-stone-500 font-medium">TVA ({invoice.tax_rate}%)</span>
                                        <span className="text-stone-900 font-bold">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 pt-2">
                                        <span className="text-stone-500 font-medium">Total TTC</span>
                                        <span className="text-xl font-black text-stone-900">{formatCurrency(invoice.total)}</span>
                                    </div>
                                    
                                    <div className="bg-stone-50 rounded-2xl p-4 mt-4 border border-stone-100">
                                        <div className="flex justify-between items-center mb-2 text-emerald-600">
                                            <span className="font-medium">Déjà réglé</span>
                                            <span className="font-bold">-{formatCurrency(invoice.paid_amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-stone-200/60">
                                            <span className="text-stone-900 font-bold">Reste à payer</span>
                                            <span className="text-amber-600 font-black text-xl">{formatCurrency(invoice.remaining_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Historique Paiements */}
                        {invoice.payments.length > 0 && (
                            <div className="bg-stone-50/80 px-8 py-8 sm:px-12 border-t border-stone-100">
                                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-6">
                                    <CreditCard className="w-4 h-4 text-emerald-500" /> Historique des règlements
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {invoice.payments.map((p: any) => (
                                        <div key={p.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{p.method}</span>
                                                <span className="text-xs text-stone-500 font-medium">{format(parseISO(p.payment_date), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <p className="text-xl font-black text-stone-900">{formatCurrency(p.amount)}</p>
                                            {p.reference && <p className="text-xs text-stone-400 mt-2 font-mono">Réf: {p.reference}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-900 mb-6">Extrait de compte : {partner.name}</h2>
                        {/* Insère ici le tableau du statement, avec les mêmes styles de table que ci-dessus */}
                    </div>
                )}
            </div>

            {/* Modal de Paiement "Soft UI" */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-stone-100">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">Nouveau règlement</h3>
                                <p className="text-sm text-stone-500 mt-0.5">Reste dû : <strong className="text-amber-600">{formatCurrency(invoice.remaining_amount)}</strong></p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <form onSubmit={handlePayment} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Montant (FCFA) <span className="text-red-500">*</span></label>
                                <input type="number" step="0.01" max={invoice.remaining_amount} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" required />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Date de règlement <span className="text-red-500">*</span></label>
                                <input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} className="w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3 text-stone-900 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" required />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Méthode <span className="text-red-500">*</span></label>
                                <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3 text-stone-900 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer">
                                    <option>Orange Money</option>
                                    <option>Moov Money</option>
                                    <option>Espèces</option>
                                    <option>Virement Bancaire</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Référence (Optionnel)</label>
                                <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" placeholder="ID Transaction, Numéro de chèque..." />
                            </div>
                            
                            <div className="pt-4 mt-6 border-t border-stone-100 flex gap-3">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors">Annuler</button>
                                <button type="submit" className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-xl shadow-md transition-colors">Confirmer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
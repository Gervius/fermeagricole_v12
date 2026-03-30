import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';
import { recipesDestroy, recipesIndex, recipesStore } from '@/routes';
import RecipeForm from '@/components/Recipes/RecipeForm';

// --- Interfaces alignées avec le backend ---
interface RawMaterial {
    id: number;
    name: string;
    stock_quantity: number;
    unit_name: string;
    pmp: number;
    default_unit_id: number | null;
}

interface Recipe {
    id: number;
    name: string;
    description: string | null;
    yield_quantity: number;
    yield_unit_id: number;
    yield_unit_name?: string;
    is_active: boolean;
    ingredients: {
        id: number;
        name: string;
        quantity: number;
        unit_id: number;
        unit_name: string;
        pmp: number;
    }[];
    total_cost?: number;
}

interface Unit {
    id: number;
    name: string;
    symbol: string;
}

interface PageProps {
    recipes: Recipe[];
    rawMaterials: RawMaterial[];
    units: Unit[];
    flash?: { success?: string; error?: string };
}

export default function Recipes({ recipes, rawMaterials = [], units = [], flash }: PageProps) {
    const { addToast } = useToasts();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Formulaire identique à celui de Create.tsx
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        yield_quantity: '',
        yield_unit_id: '',
        is_active: true,
        ingredients: [] as { ingredient_id: string; quantity: string; unit_id: string }[],
    });

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(recipesStore.url(), {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
            onError: (err) => {
                Object.values(err).forEach(msg => addToast({ message: msg, type: 'error' }));
            }
        });
    };

    const handleDelete = (recipe: Recipe) => {
        if (confirm(`Supprimer la recette "${recipe.name}" ?`)) {
            router.delete(recipesDestroy.url(recipe.id));
        }
    };

    const calculateRecipeCost = (recipe: Recipe) => {
        if (recipe.total_cost) return recipe.total_cost;
        return recipe.ingredients.reduce((sum, ing) => sum + (ing.pmp * ing.quantity), 0);
    };

    const recipesList = Array.isArray(recipes) ? recipes : (recipes as any).data || [];

    // Transformer rawMaterials pour le composant RecipeForm
    const ingredientsForForm = rawMaterials.map(m => ({
        id: m.id,
        name: m.name,
        default_unit_id: m.default_unit_id ?? 0,
        default_unit_symbol: m.unit_name,
    }));

    return (
        <AppLayout breadcrumbs={[{ title: 'Recettes', href: recipesIndex.url() }]}>
            <Head title="Recettes d'aliments" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900">Recettes d'aliments</h2>
                        <p className="text-sm text-stone-500 mt-1">Formulation des mélanges alimentaires</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            reset();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle recette
                    </button>
                </div>

                {/* Liste des recettes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipesList.length === 0 ? (
                        <div className="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center">
                            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                            <p className="text-sm text-stone-400">Aucune recette créée</p>
                        </div>
                    ) : (
                        recipesList.map((recipe: Recipe) => {
                            const cost = recipe.total_cost ?? recipe.ingredients.reduce((sum, ing) => sum + ((ing.pmp || 0) * (ing.quantity || 0)), 0);
                            const yieldQty = recipe.yield_quantity ?? 0;
                            const costPerKg = yieldQty > 0 ? cost / yieldQty : 0;

                            return (
                                <div key={recipe.id} className="bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                    <div className="p-5">
                                        {/* En-tête (inchangé) */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-stone-900 mb-1">{recipe.name}</h3>
                                                {recipe.description && <p className="text-xs text-stone-500">{recipe.description}</p>}
                                            </div>
                                            <button onClick={() => handleDelete(recipe)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Ingrédients */}
                                        <div className="space-y-3 mb-4">
                                            {recipe.ingredients.map((ing, idx) => {
                                                const percentage = yieldQty > 0 ? ((ing.quantity || 0) / yieldQty) * 100 : 0;
                                                const ingredientCost = (ing.pmp || 0) * (ing.quantity || 0);
                                                return (
                                                    <div key={idx} className="bg-stone-50 rounded-lg p-2">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-medium text-stone-800">{ing.name}</span>
                                                            <div className="text-right">
                                                                <span className="text-sm font-semibold text-stone-900">
                                                                    {(ing.quantity || 0).toLocaleString('fr-FR')} {ing.unit_name}
                                                                </span>
                                                                <span className="text-xs text-stone-500 ml-2">
                                                                    ({ingredientCost.toLocaleString('fr-FR')} FCFA)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-stone-200 rounded-full h-2">
                                                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
                                                            </div>
                                                            <span className="text-xs text-stone-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="text-xs text-stone-400 mt-1">
                                                            PMP: {(ing.pmp || 0).toLocaleString('fr-FR')} FCFA/{ing.unit_name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Résumé */}
                                        <div className="border-t border-stone-100 pt-3 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-600">Quantité totale :</span>
                                                <span className="font-semibold text-stone-900">{yieldQty.toLocaleString('fr-FR')} kg</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-stone-600">Coût total :</span>
                                                <span className="font-semibold text-amber-600">{cost.toLocaleString('fr-FR')} FCFA</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                                                <span className="text-sm text-stone-600">Coût par kg :</span>
                                                <span className="text-base font-bold text-stone-900">
                                                    {costPerKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal création avec le formulaire éprouvé */}
                {showCreateModal && (
                    <Modal title="Créer une recette" size="large" onClose={() => {
                        setShowCreateModal(false);
                        reset();
                    }}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <RecipeForm
                                data={data}
                                setData={(key, value) => setData(key as any, value)}
                                errors={errors}
                                ingredients={ingredientsForForm}
                                units={units}
                            />
                            <ModalFooter
                                onCancel={() => {
                                    setShowCreateModal(false);
                                    reset();
                                }}
                                submitLabel="Créer la recette"
                                processing={processing}
                            />
                        </form>
                    </Modal>
                )}
            </div>
        </AppLayout>
    );
}

// --- Composants auxiliaires (Modal, Field, ModalFooter) ---
function Modal({ title, size = 'normal', onClose, children }: {
    title: string;
    size?: 'normal' | 'large';
    onClose: () => void;
    children: React.ReactNode
}) {
    const maxWidth = size === 'large' ? 'max-w-5xl' : 'max-w-md';
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100 sticky top-0 bg-white z-10">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="text-xl">×</span>
                    </button>
                </div>
                <div className="px-7 py-6">{children}</div>
            </div>
        </div>
    );
}

function ModalFooter({ onCancel, submitLabel, processing = false }: { onCancel: () => void; submitLabel: string; processing?: boolean }) {
    return (
        <div className="flex gap-3 pt-2 border-t border-stone-200 mt-6">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
            >
                Annuler
            </button>
            <button
                type="submit"
                disabled={processing}
                className="flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            >
                {submitLabel}
            </button>
        </div>
    );
}
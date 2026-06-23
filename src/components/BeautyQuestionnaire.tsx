import React, { useState } from 'react';
import { Sparkles, Loader2, Check, ArrowRight, RotateCw, Smile, Moon, ShieldCheck, Heart } from 'lucide-react';
import { BeautyProfile, Product } from '../types';

interface BeautyQuestionnaireProps {
  currentProfile?: BeautyProfile;
  products: Product[];
  onSaveProfile: (profile: BeautyProfile, diagnosticResult: any) => void;
}

export default function BeautyQuestionnaire({
  currentProfile,
  products,
  onSaveProfile
}: BeautyQuestionnaireProps) {
  const [step, setStep] = useState(currentProfile ? 'result' : 'start');
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<'Homme' | 'Femme'>('Femme');
  const [age, setAge] = useState<number>(25);
  const [skinType, setSkinType] = useState<'Sèche' | 'Grasse' | 'Mixte' | 'Normale' | 'Sensible'>('Mixte');
  const [hairType, setHairType] = useState<'Crépu' | 'Frisé' | 'Bouclé' | 'Lisse' | 'Sec' | 'Gras'>('Crépu');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const CONCERNS_OPTIONS = [
    { value: 'Acné', label: 'Acné / Boutons', desc: 'Imperfections, excès de sébum' },
    { value: 'Taches', label: 'Taches noires / Hyperpigmentation', desc: 'Causées par le soleil ou cicatrices' },
    { value: 'Hydratation', label: 'Sécheresse / Déshydratation', desc: 'Peau qui tiraille ou manque de douceur' },
    { value: 'Chute de cheveux', label: 'Chute de cheveux / Casse', desc: 'Perte de volume, cuir chevelu sec' },
    { value: 'Sensibilité', label: 'Rougeurs & Irritations', desc: 'Peau sensible qui chauffe au soleil' },
    { value: 'Texture', label: 'Pores dilatés / Grain irrégulier', desc: 'Manque de lissage et d\'éclat' }
  ];

  const handleToggleConcern = (value: string) => {
    if (concerns.includes(value)) {
      setConcerns(concerns.filter((c) => c !== value));
    } else {
      setConcerns([...concerns, value]);
    }
  };

  const handleStart = () => {
    setStep('questions');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const profile: BeautyProfile = {
      gender,
      age,
      skinType,
      hairType,
      concerns
    };

    try {
      const response = await fetch('/api/diagnostics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setDiagnosis(data);
      onSaveProfile(profile, data);
      setStep('result');
    } catch (err) {
      console.error(err);
      // Hard fallback
      const defaultDiagnostic = {
        diagnostic: `Diagnostic dermo-cosmétique IA pour un profil de type ${skinType} avec préoccupations (${concerns.join(', ')}). Sous le climat tropical d'Abidjan, l'hyperactivité sébacée doit être traitée avec douceur sans décaper.`,
        routineMatin: [
          { step: "1. Netfoyage ciblé", instruction: "Utilisez un nettoyant doux moussant pour rafraîchir l'épiderme." },
          { step: "2. Sérum Éclat", instruction: "Appliquez notre sérum correcteur pour atténuer les taches." },
          { step: "3. Crème Solaire protectrice", instruction: "Crucial à Abidjan pour empêcher les UV de graver les taches et de dessécher les cheveux." }
        ],
        routineSoir: [
          { step: "1. Double Nettoyage", instruction: "Retirez poussières et maquillage accumulés dans les embouteillages !" },
          { step: "2. Soin nourrissant nocturne", instruction: "Appliquez une crème riche ou du beurre de Karité pur." }
        ],
        conseilsGeneraux: [
          "Hydratez-vous abondamment tout au long de la journée.",
          "Portez autant que possible un chapeau ou restez à l'ombre de 11h à 15h."
        ]
      };
      setDiagnosis(defaultDiagnostic);
      onSaveProfile(profile, defaultDiagnostic);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  // Auto recommend matching products based on core concerns
  const getRecommendedProducts = () => {
    return products.filter((p) => {
      // If client concerns matches product category/description keywords
      return concerns.some((concern) => {
        const keyword = concern.toLowerCase();
        const prodName = p.name.toLowerCase();
        const prodDesc = p.description.toLowerCase();
        const prodCat = p.category.toLowerCase();

        if (keyword.includes('acné') && (prodName.includes('imperfection') || prodDesc.includes('acné') || prodDesc.includes('nettoyant'))) return true;
        if (keyword.includes('taches') && (prodDesc.includes('tache') || prodDesc.includes('éclat') || prodName.includes('sérum'))) return true;
        if (keyword.includes('hydratation') && (prodDesc.includes('hydrat') || prodName.includes('lait') || prodDesc.includes('beurre'))) return true;
        if (keyword.includes('chute') && prodCat.includes('capillaires')) return true;
        if (keyword.includes('sensibilité') && (prodCat.includes('bebe') || prodCat.includes('parapharmacie'))) return true;
        return false;
      }) || (p.promoPrice && concerns.length === 0);
    }).slice(0, 3); // top 3 products max
  };

  const currentResult = diagnosis || (currentProfile ? {
    diagnostic: `Bonjour. Votre type de peau est ${currentProfile.skinType} et vos cheveux sont ${currentProfile.hairType}. Vos préoccupations principales concernent : ${currentProfile.concerns.join(', ')}.`,
    routineMatin: [
      { step: "1. Nettoyage purifiant", instruction: "Éliminez le sébum accumulé sans dessécher avec un savon doux à base d'huile de coco." },
      { step: "2. Écran Solaire Protecteur", instruction: "Appliquez obligatoirement l'écran solaire fluide FPS50+ anti-brillance pour résister au climat d'Abidjan." }
    ],
    routineSoir: [
      { step: "1. Lavage en profondeur", instruction: "Double démaquillage et désincrustation des pores saturés par la pollution." },
      { step: "2. Nutrition dermo-cosmétique", instruction: "Hydratez activement avec notre Lait Hydratant au Beurre de Karité." }
    ],
    conseilsGeneraux: [
      "Buvez au moins 1,5L de liquide par jour.",
      "Privilégiez les produits de parapharmacie sans parfum en cas de rougeurs répétées."
    ]
  } : null);

  const matchedRecs = getRecommendedProducts();

  return (
    <div id="beauty-questionnaire-section" className="py-8 bg-zinc-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Title */}
        <div className="text-center mb-10">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold tracking-wide uppercase font-mono">
            Diagnostic Intelligent Libre
          </span>
          <h2 className="text-3xl font-extrabold text-rose-950 font-sans tracking-tight mt-3">
            Votre Cliché Beauté Côte d'Ivoire
          </h2>
          <p className="text-zinc-600 mt-2 max-w-xl mx-auto">
            Remplissez notre questionnaire dermo-cosmétique rapide. Notre IA analyse votre peau face aux réalités du climat tropical et conçoit votre routine.
          </p>
        </div>

        {/* 1. START PANEL */}
        {step === 'start' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-100 border border-rose-100 text-center flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 animate-pulse">
              <Sparkles className="h-10 w-10" />
            </div>
            
            <h3 className="text-2xl font-bold text-rose-950 mb-2">Comprendre votre Peau & vos Cheveux</h3>
            <p className="text-zinc-500 max-w-lg mb-8 leading-relaxed">
              Que vous habitiez dans l'humidité lagunaire d'Abidjan, sous les rayons de San Pedro ou face à l'Harmattan sec de Korhogo, vos cellules réagissent différemment. Obtenez des conseils personnalisés de cosmétiques sains rédigés par notre conseiller IA d'Omi'i Institut.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-8 text-left">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150">
                <p className="font-semibold text-rose-900 text-sm">⏱️ 2 Minutes Chrono</p>
                <p className="text-xs text-zinc-500 mt-1">Simple, rapide et instructif pour toute la famille.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150">
                <p className="font-semibold text-rose-900 text-sm">💡 Diagnose IA Beauté</p>
                <p className="text-xs text-zinc-500 mt-1">Calculé grâce à une intelligence artificielle dermo-cosmétique.</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150">
                <p className="font-semibold text-rose-900 text-sm">🛍️ Routine Idéale</p>
                <p className="text-xs text-zinc-500 mt-1">Lyz uniquement les cosmétiques disponibles en rayon ici.</p>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold rounded-2xl flex items-center space-x-2 shadow-lg shadow-rose-200 hover:-translate-y-0.5 transition cursor-pointer"
            >
              <span>Démarrer l'Analyse</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* 2. QUESTIONNAIRE QUESTIONS PANEL */}
        {step === 'questions' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-100 border border-rose-100">
            <div className="space-y-8">
              
              {/* Question 1: Gender */}
              <div>
                <label className="block text-sm font-semibold uppercase font-mono tracking-wider text-rose-900 mb-3">
                  1. Vous êtes :
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('Femme')}
                    className={`py-4 rounded-2xl border-2 font-semibold transition flex flex-col items-center justify-center ${
                      gender === 'Femme'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">👩🏻</span>
                    <span>Une Femme</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('Homme')}
                    className={`py-4 rounded-2xl border-2 font-semibold transition flex flex-col items-center justify-center ${
                      gender === 'Homme'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">👨🏾</span>
                    <span>Un Homme</span>
                  </button>
                </div>
              </div>

              {/* Question 2: Age slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold uppercase font-mono tracking-wider text-rose-900">
                    2. Quel est votre âge ?
                  </label>
                  <span className="text-base font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">{age} ans</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 mt-1 font-mono">
                  <span>12 ans</span>
                  <span>45 ans</span>
                  <span>80 ans</span>
                </div>
              </div>

              {/* Question 3: Skin Type */}
              <div>
                <label className="block text-sm font-semibold uppercase font-mono tracking-wider text-rose-900 mb-3">
                  3. Votre type de peau principale :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(['Sèche', 'Grasse', 'Mixte', 'Normale', 'Sensible'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSkinType(type)}
                      className={`p-3 rounded-xl border-2 text-xs font-semibold transition flex flex-col items-center justify-center text-center ${
                        skinType === type
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold'
                          : 'border-zinc-150 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="text-lg mb-1">
                        {type === 'Sèche' && '🌵'}
                        {type === 'Grasse' && '✨'}
                        {type === 'Mixte' && '🎭'}
                        {type === 'Normale' && '🌿'}
                        {type === 'Sensible' && '🛡️'}
                      </span>
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4: Hair Type */}
              <div>
                <label className="block text-sm font-semibold uppercase font-mono tracking-wider text-rose-900 mb-3">
                  4. Votre nature de cheveux :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {(['Crépu', 'Frisé', 'Bouclé', 'Lisse', 'Sec', 'Gras'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHairType(type)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition flex flex-col items-center justify-center text-center ${
                        hairType === type
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold'
                          : 'border-zinc-150 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 5: Concerns checkboxes */}
              <div>
                <label className="block text-sm font-semibold uppercase font-mono tracking-wider text-rose-900 mb-3">
                  5. Vos préoccupations prioritaires (Sélectionnez tout ce qui s'applique) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONCERNS_OPTIONS.map((option) => {
                    const isSelected = concerns.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggleConcern(option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition flex justify-between items-center ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/30'
                            : 'border-zinc-150 hover:bg-zinc-50/50'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-rose-950' : 'text-zinc-800'}`}>
                            {option.label}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{option.desc}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition ${
                          isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-zinc-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="mt-10 pt-6 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-rose-900 hover:bg-rose-950 text-white font-semibold rounded-2xl flex items-center space-x-2 transition disabled:opacity-50 cursor-pointer shadow-md shadow-rose-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Calcul du diagnostic...</span>
                  </>
                ) : (
                  <>
                    <span>Soumettre & Diagnostiquer</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 3. DYNAMIC RESULTS PANEL */}
        {step === 'result' && currentResult && (
          <div className="space-y-8 animate-fade-in">
            
            {/* diagnostic core summary banner */}
            <div className="bg-gradient-to-br from-rose-950 to-zinc-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-300 via-rose-900 to-transparent"></div>
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 bg-rose-500/25 border border-rose-400/30 text-rose-300 rounded-full text-[10px] font-semibold tracking-wider font-mono uppercase">
                    Analyse Dermatologique IA
                  </span>
                  <h3 className="text-2xl font-bold mt-2 font-sans text-rose-100">Synthèse Thérapeutique</h3>
                  {currentProfile && (
                    <p className="text-xs text-rose-200 mt-1 font-mono">
                      Profil : {currentProfile.gender} de {currentProfile.age} ans • Peau: {currentProfile.skinType} • Cheveux: {currentProfile.hairType}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setStep('questions')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center space-x-1.5 text-xs font-mono font-medium"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Recommencer</span>
                </button>
              </div>

              <div className="mt-6 border-t border-rose-900/50 pt-5">
                <p className="text-sm font-sans leading-relaxed text-zinc-100 font-normal">
                  {currentResult.diagnostic}
                </p>
              </div>
            </div>

            {/* Routines Grid (Matin / Soir) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Morning Routine */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-2 bg-amber-400 left-0"></div>
                <div className="flex items-center space-x-2 text-amber-600 mb-6 mt-2">
                  <Smile className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-wider uppercase font-mono">Routine du Matin Éclat</span>
                </div>

                <div className="space-y-5">
                  {currentResult.routineMatin?.map((stepItem: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start pl-1">
                      <div className="h-6 w-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs ring-4 ring-amber-50/50 mt-0.5 select-none shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs uppercase font-mono font-bold text-zinc-800 leading-none mb-1">{stepItem.step}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed font-normal">{stepItem.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evening Routine */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-2 bg-purple-500 left-0"></div>
                <div className="flex items-center space-x-2 text-purple-600 mb-6 mt-2">
                  <Moon className="h-5 w-5" />
                  <span className="font-bold text-sm tracking-wider uppercase font-mono">Routine du Soir Réparatrice</span>
                </div>

                <div className="space-y-5">
                  {currentResult.routineSoir?.map((stepItem: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start pl-1">
                      <div className="h-6 w-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs ring-4 ring-purple-50/50 mt-0.5 select-none shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs uppercase font-mono font-bold text-zinc-800 leading-none mb-1">{stepItem.step}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed font-normal">{stepItem.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* General Beauty Advice & Recommendations */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-zinc-150">
              <h4 className="text-xs uppercase font-mono tracking-widest font-extrabold text-rose-950 mb-3 block">
                🌱 Conseils de Routine Généraux :
              </h4>
              <ul className="space-y-2.5">
                {currentResult.conseilsGeneraux?.map((conseil: string, idx: number) => (
                  <li key={idx} className="text-xs text-zinc-600 flex items-start space-x-2">
                    <span className="text-emerald-500 text-sm mt-px">✔</span>
                    <span>{conseil}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Matching Products recommended */}
            {matchedRecs.length > 0 && (
              <div className="bg-rose-50/20 border border-rose-100 rounded-3xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="h-4 w-4 text-rose-600 fill-rose-600" />
                  <h4 className="text-sm font-bold text-rose-950 font-sans">Produits du Catalogue Recommandés pour vous</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {matchedRecs.map((prod) => (
                    <div key={prod.id} className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex space-x-4 items-center">
                      <img src={prod.images[0]} alt={prod.name} className="h-16 w-16 object-cover rounded-xl shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-rose-950 truncate leading-tight">{prod.name}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{prod.brand} • {prod.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-bold text-rose-700">
                            {prod.promoPrice ? prod.promoPrice : prod.price} FCFA
                          </span>
                          {prod.promoPrice && (
                            <span className="text-[10px] text-zinc-400 line-through">
                              {prod.price} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Consultation Call out */}
            <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-rose-950">
                <div className="bg-rose-600 text-white p-2.5 rounded-full">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Besoin d'un conseil personnalisé ?</h5>
                  <p className="text-xs text-rose-800">Notre assistante d'Omi'i Institut vous guide gratuitement en direct.</p>
                </div>
              </div>
              
              <a
                href="#chat-panel"
                className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-white font-semibold text-xs rounded-xl shadow-md transition"
              >
                Ouvrir la Discussion
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

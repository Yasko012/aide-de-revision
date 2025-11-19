import React, { useState, useCallback } from 'react';
import { UserProfile } from '../types';
import { analyzeAndSummarizeLearningStyle } from '../services/geminiService';

interface ProfileProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onClearHistory: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
);

const Profile: React.FC<ProfileProps> = ({ userProfile, onLogout, onClearHistory, onUpdateProfile }) => {
  const [learningProfileText, setLearningProfileText] = useState(userProfile.learningProfile || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  
  const handleSaveProfile = () => {
    setIsSaving(true);
    onUpdateProfile({ ...userProfile, learningProfile: learningProfileText });
    setTimeout(() => setIsSaving(false), 500);
  };
  
  const handleAnalyzeProfile = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
        const summary = await analyzeAndSummarizeLearningStyle(userProfile);
        onUpdateProfile({ ...userProfile, aiGeneratedLearningStyleSummary: summary });
    } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
        setIsAnalyzing(false);
    }
  }, [userProfile, onUpdateProfile]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Profil & Personnalisation</h2>
        <p className="text-gray-600 mt-1">Gérez vos informations et aidez l'IA à mieux vous comprendre.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mon Style d'Apprentissage</h3>
        <p className="text-sm text-gray-500 mb-2">Décrivez comment vous aimez apprendre. L'IA utilisera cette information pour mieux adapter ses réponses. (Optionnel)</p>
        <textarea
          value={learningProfileText}
          onChange={(e) => setLearningProfileText(e.target.value)}
          placeholder="Ex: J'ai une mémoire visuelle, les exemples m'aident beaucoup. ou Je suis en terminale, je veux me concentrer sur le programme du bac."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="mt-2 w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSaving ? 'Enregistré !' : 'Enregistrer ma description'}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Comment l'IA vous perçoit</h3>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3">
          {userProfile.aiGeneratedLearningStyleSummary ? (
              <p className="text-gray-700 italic">"{userProfile.aiGeneratedLearningStyleSummary}"</p>
          ) : (
              <p className="text-sm text-gray-500">Aucune analyse effectuée. Utilisez l'application ou cliquez ci-dessous pour que l'IA apprenne à vous connaître.</p>
          )}
          <button
            onClick={handleAnalyzeProfile}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-wait"
          >
            {isAnalyzing ? <><Spinner /> Analyse en cours...</> : "Mettre à jour l'analyse de l'IA"}
          </button>
          {analysisError && <p className="mt-2 text-sm text-red-600">{analysisError}</p>}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Historique & Actions</h3>
        <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-md border border-gray-200">
           {userProfile.history.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                {userProfile.history.slice().reverse().map((entry, index) => (
                  <li key={index} className="truncate">{entry}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun historique pour le moment.</p>
            )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
           <button
            onClick={onClearHistory}
            className="w-full flex justify-center items-center px-4 py-2 border border-red-500 text-base font-medium rounded-md shadow-sm text-red-500 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Vider l'Historique
          </button>
          <button
            onClick={onLogout}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Changer d'utilisateur
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

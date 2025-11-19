import React, { useState, useCallback } from 'react';
import { getExplanation } from '../services/geminiService';
import { UserProfile } from '../types';

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

interface ComprehensionHelperProps {
  userProfile: UserProfile;
  updateHistory: (newEntry: string) => void;
}

const ComprehensionHelper: React.FC<ComprehensionHelperProps> = ({ userProfile, updateHistory }) => {
  const [topic, setTopic] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetExplanation = useCallback(async () => {
    if (!topic.trim()) {
      setError('Veuillez entrer un sujet ou une question.');
      return;
    }
    setError('');
    setIsLoading(true);
    setExplanation('');

    try {
      updateHistory(`A demandé une explication sur : "${topic}"`);
      const result = await getExplanation(topic, userProfile);
      setExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, userProfile, updateHistory]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Aide à la Compréhension</h2>
      <p className="text-gray-600 mb-6">Besoin d'une explication ? L'IA se souvient de vos conversations passées pour vous fournir une réponse sur mesure, adaptée à votre façon de penser.</p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="concept-topic" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet ou question
          </label>
          <textarea
            id="concept-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Qu'est-ce que la photosynthèse ? Explique-moi le théorème de Pythagore..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleGetExplanation}
          disabled={isLoading}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Recherche d\'une explication...' : 'Obtenir une Explication'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      {isLoading && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
             <Spinner />
          </div>
      )}

      {explanation && (
        <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 prose max-w-none">
           <pre className="whitespace-pre-wrap bg-transparent p-0 font-sans">{explanation}</pre>
        </div>
      )}
    </div>
  );
};

export default ComprehensionHelper;

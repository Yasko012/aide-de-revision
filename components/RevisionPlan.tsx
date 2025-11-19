import React, { useState, useCallback } from 'react';
import { generateStudyPlan } from '../services/geminiService';
import { UserProfile } from '../types';

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

interface RevisionPlanProps {
  userProfile: UserProfile;
  updateHistory: (newEntry: string) => void;
}

const RevisionPlan: React.FC<RevisionPlanProps> = ({ userProfile, updateHistory }) => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('1 heure');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = useCallback(async () => {
    if (!topic.trim()) {
      setError('Veuillez entrer un sujet d\'étude.');
      return;
    }
    setError('');
    setIsLoading(true);
    setPlan('');

    try {
      updateHistory(`A demandé un plan de révision pour "${topic}" en ${duration}.`);
      const result = await generateStudyPlan(topic, duration, userProfile);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, duration, userProfile, updateHistory]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Assistant de Révision</h2>
      <p className="text-gray-600 mb-6">Décrivez votre sujet d'étude et le temps disponible. L'IA vous aidera à diviser le travail en tâches gérables pour optimiser votre session.</p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet d'étude
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: La Révolution Française, les Hooks React..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Durée de la session
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            disabled={isLoading}
          >
            <option>30 minutes</option>
            <option>1 heure</option>
            <option>1 heure 30 minutes</option>
            <option>2 heures</option>
          </select>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={isLoading}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Organisation en cours...' : 'Organiser ma Révision'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      {isLoading && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
             <Spinner />
          </div>
      )}

      {plan && (
        <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 prose max-w-none">
          <pre className="whitespace-pre-wrap bg-transparent p-0 font-sans">{plan}</pre>
        </div>
      )}
    </div>
  );
};

export default RevisionPlan;

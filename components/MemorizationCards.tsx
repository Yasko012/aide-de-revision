import React, { useState, useCallback, useRef } from 'react';
import { createFlashcards, extractTextFromImage, generateAudioFromText } from '../services/geminiService';
import { Flashcard, UserProfile } from '../types';

// Fonctions d'aide pour l'audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const Spinner = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center space-y-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

const FlashcardViewer = ({ cards }: { cards: Flashcard[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };
  
  if (!cards.length) return null;

  return (
    <div className="mt-6">
      <p className="text-center text-gray-600 mb-2 font-medium">Fiche {currentIndex + 1} sur {cards.length}</p>
      <div className="relative w-full h-64 [perspective:1000px]">
        <div 
          className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Recto */}
          <div className="absolute w-full h-full p-6 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-center [backface-visibility:hidden]">
            <p className="text-xl font-semibold text-gray-800">{currentCard.recto}</p>
          </div>
          {/* Verso */}
          <div className="absolute w-full h-full p-6 bg-indigo-50 rounded-xl shadow-lg border border-indigo-200 flex items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <p className="text-lg text-indigo-900">{currentCard.verso}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={handlePrev} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Précédent</button>
        <button onClick={() => setIsFlipped(!isFlipped)} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
            {isFlipped ? 'Voir la question' : 'Révéler la réponse'}
        </button>
        <button onClick={handleNext} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Suivant</button>
      </div>
    </div>
  );
};

interface MemorizationCardsProps {
  userProfile: UserProfile;
  updateHistory: (newEntry: string) => void;
}

const MemorizationCards: React.FC<MemorizationCardsProps> = ({ userProfile, updateHistory }) => {
  const [notes, setNotes] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsExtractingText(true);
    setError('');
    setNotes('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const extractedText = await extractTextFromImage({
          data: base64String,
          mimeType: file.type,
        });
        setNotes(extractedText);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsExtractingText(false);
    }
  }, []);

  const handleCreateCards = useCallback(async () => {
    if (!notes.trim()) {
      setError('Veuillez entrer ou téléverser vos notes à mémoriser.');
      return;
    }
    setError('');
    setIsLoading(true);
    setCards([]);

    try {
      updateHistory(`A créé des fiches à partir des notes : "${notes.substring(0, 50)}..."`);
      const result = await createFlashcards(notes, userProfile);
      setCards(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [notes, userProfile, updateHistory]);

  const handleGenerateAndPlayAudio = useCallback(async () => {
    if (!notes.trim()) {
      setError('Les notes sont vides. Impossible de générer l\'audio.');
      return;
    }
    setError('');
    setIsAudioLoading(true);
    try {
      const base64Audio = await generateAudioFromText(notes);
      if (base64Audio) {
        // FIX: Cast window to `any` to allow access to the vendor-prefixed `webkitAudioContext` for older browser compatibility.
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
      }
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    } finally {
      setIsAudioLoading(false);
    }
  }, [notes]);
  
  const anyLoading = isLoading || isExtractingText || isAudioLoading;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Créateur de Fiches & Répétition Audio</h2>
      <p className="text-gray-600 mb-6">Collez vos notes ou téléversez une photo. L'IA les transformera en fiches ou vous les lira à voix haute pour un apprentissage actif.</p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Mes notes à mémoriser
          </label>
          <div className="relative">
             <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Collez ici le contenu que vous voulez apprendre, ou téléversez une image..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={anyLoading}
            />
            {isExtractingText && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Spinner message="Extraction du texte..." />
                </div>
            )}
          </div>
        </div>
        
        {imagePreview && !isExtractingText && (
            <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de l'image :</p>
                <img src={imagePreview} alt="Aperçu des notes" className="rounded-md max-h-48 w-auto border border-gray-300"/>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
            disabled={anyLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={anyLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L6.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            Téléverser Image
          </button>
          <button
            onClick={handleGenerateAndPlayAudio}
            disabled={anyLoading || !notes.trim()}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAudioLoading ? <Spinner message="" /> : (
              <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.447-.894L4 6.424v6.152a2 2 0 00-2 2V16a2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V10.5h3.553L18 8.586V3zM4.5 14a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5v-1.424l1.447-.894.053-.033V14z" /></svg>
               Écouter la Répétition
              </>
            )}
          </button>
          <button
            onClick={handleCreateCards}
            disabled={anyLoading || !notes.trim()}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Spinner message="" /> : 'Créer les Fiches'}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      
      {isLoading && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
             <Spinner message="Création des fiches..." />
          </div>
      )}

      {cards.length > 0 && <FlashcardViewer cards={cards} />}
    </div>
  );
};

export default MemorizationCards;

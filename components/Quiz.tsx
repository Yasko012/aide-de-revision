import React, { useState, useCallback } from 'react';
import { generateQuiz } from '../services/geminiService';
import { UserProfile, QuizQuestion, QuizType } from '../types';

const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

// FIX: Define a props interface for QuestionRenderer to correctly type it as a React component.
interface QuestionRendererProps {
    question: QuizQuestion;
    index: number;
    userAnswer: any;
    onAnswerChange: (questionIndex: number, answer: any) => void;
    showAnswers: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, index, userAnswer, onAnswerChange, showAnswers }) => {
    const questionNumber = index + 1;

    const getBorderColor = () => {
        if (!showAnswers) return 'border-gray-200';
        if (question.type === 'mcq') {
            return userAnswer === question.correctAnswerIndex ? 'border-green-500' : 'border-red-500';
        }
        if (question.type === 'true-false') {
            return userAnswer === question.isTrue ? 'border-green-500' : 'border-red-500';
        }
        return 'border-gray-200'; // Open questions are not graded
    };

    return (
        <div className={`p-4 border rounded-lg ${getBorderColor()} transition-colors bg-white`}>
            <p className="font-bold text-gray-800 mb-3">{questionNumber}. {question.type === 'true-false' ? question.statement : question.question}</p>
            
            {question.type === 'mcq' && (
                <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                        const isSelected = userAnswer === optionIndex;
                        const isCorrect = question.correctAnswerIndex === optionIndex;
                        let optionStyle = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                        if (showAnswers) {
                            if (isCorrect) optionStyle = 'bg-green-100 text-green-800 ring-2 ring-green-500';
                            else if (isSelected && !isCorrect) optionStyle = 'bg-red-100 text-red-800';
                        } else if (isSelected) {
                            optionStyle = 'bg-indigo-100 text-indigo-800';
                        }
                        
                        return (
                            <label key={optionIndex} className={`block p-3 rounded-md cursor-pointer transition-colors ${optionStyle}`}>
                                <input 
                                    type="radio"
                                    name={`question-${index}`}
                                    checked={isSelected}
                                    onChange={() => onAnswerChange(index, optionIndex)}
                                    className="mr-3"
                                    disabled={showAnswers}
                                />
                                {option}
                            </label>
                        );
                    })}
                </div>
            )}

            {question.type === 'true-false' && (
                <div className="space-y-2">
                    {[true, false].map((value, optionIndex) => {
                        const isSelected = userAnswer === value;
                        const isCorrect = question.isTrue === value;
                        let optionStyle = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                        if (showAnswers) {
                           if (isCorrect) optionStyle = 'bg-green-100 text-green-800 ring-2 ring-green-500';
                           else if (isSelected && !isCorrect) optionStyle = 'bg-red-100 text-red-800';
                        } else if (isSelected) {
                            optionStyle = 'bg-indigo-100 text-indigo-800';
                        }
                        return (
                             <label key={optionIndex} className={`block p-3 rounded-md cursor-pointer transition-colors ${optionStyle}`}>
                                <input 
                                    type="radio"
                                    name={`question-${index}`}
                                    checked={isSelected}
                                    onChange={() => onAnswerChange(index, value)}
                                    className="mr-3"
                                    disabled={showAnswers}
                                />
                                {value ? 'Vrai' : 'Faux'}
                            </label>
                        )
                    })}
                </div>
            )}
            
            {question.type === 'open' && (
                <div>
                     <textarea
                        value={userAnswer || ''}
                        onChange={(e) => onAnswerChange(index, e.target.value)}
                        placeholder="Votre réponse..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={showAnswers}
                    />
                </div>
            )}

            {/* FIX: Add a type guard to ensure `explanation` is only accessed on questions that have it. */}
            {showAnswers && (question.type === 'mcq' || question.type === 'true-false') && question.explanation && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
                    <p><span className="font-semibold">Explication :</span> {question.explanation}</p>
                </div>
            )}
            {showAnswers && question.type === 'open' && (
                 <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg">
                    <p><span className="font-semibold">Réponse idéale :</span> {question.idealAnswer}</p>
                </div>
            )}
        </div>
    );
};

interface QuizProps {
  userProfile: UserProfile;
  updateHistory: (newEntry: string) => void;
}

const Quiz: React.FC<QuizProps> = ({ userProfile, updateHistory }) => {
    const [notes, setNotes] = useState('');
    const [quizType, setQuizType] = useState<QuizType>('mcq');
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
    const [showAnswers, setShowAnswers] = useState(false);

    const handleGenerateQuiz = useCallback(async () => {
        if (!notes.trim()) {
            setError('Veuillez entrer des notes pour générer un quiz.');
            return;
        }
        setError('');
        setIsLoading(true);
        setQuiz([]);
        setUserAnswers({});
        setShowAnswers(false);

        try {
            updateHistory(`A généré un quiz (${quizType}) sur : "${notes.substring(0, 50)}..."`);
            const result = await generateQuiz(notes, quizType, userProfile);
            if (result.length === 0) {
                setError("L'IA n'a pas pu générer de quiz à partir de ces notes. Essayez d'être plus spécifique ou de changer le type de quiz.");
                setQuiz([]);
            } else {
                setQuiz(result);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
        } finally {
            setIsLoading(false);
        }
    }, [notes, quizType, userProfile, updateHistory]);

    const handleAnswerChange = (questionIndex: number, answer: any) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleSubmitQuiz = () => {
        setShowAnswers(true);
    };

    const calculateScore = () => {
        return quiz.reduce((score, q, index) => {
            const userAnswer = userAnswers[index];
            if (userAnswer === undefined) return score;

            if (q.type === 'mcq' && q.correctAnswerIndex === userAnswer) return score + 1;
            if (q.type === 'true-false' && q.isTrue === userAnswer) return score + 1;
            return score;
        }, 0);
    };
    
    const getGradableQuestionCount = () => quiz.filter(q => q.type !== 'open').length;

    const resetQuiz = () => {
        setQuiz([]);
        setNotes('');
        setUserAnswers({});
        setShowAnswers(false);
        setError('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Interactif</h2>

            {quiz.length === 0 ? (
                <>
                    <p className="text-gray-600 mb-6">Testez vos connaissances ! Collez vos notes ou un sujet, et l'IA créera un quiz pour vous aider à valider votre compréhension.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="notes-quiz" className="block text-sm font-medium text-gray-700 mb-1">
                                Sujet ou notes pour le quiz
                            </label>
                            <textarea
                                id="notes-quiz"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Collez ici le contenu sur lequel vous voulez être interrogé..."
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type de quiz</label>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                {(['mcq', 'true-false', 'open'] as QuizType[]).map(type => (
                                    <label key={type} className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="quizType"
                                            value={type}
                                            checked={quizType === type}
                                            onChange={() => setQuizType(type)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            disabled={isLoading}
                                        />
                                        <span className="ml-2 text-gray-700">{
                                            { 'mcq': 'QCM', 'true-false': 'Vrai/Faux', 'open': 'Questions Ouvertes' }[type]
                                        }</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateQuiz}
                            disabled={isLoading || !notes.trim()}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Génération du quiz...' : 'Générer le Quiz'}
                        </button>
                    </div>
                    {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    {isLoading && <div className="mt-6"><Spinner /></div>}
                </>
            ) : (
                <div className="space-y-6">
                    <p className="text-gray-600">Répondez aux questions ci-dessous, puis vérifiez vos réponses.</p>
                    {quiz.map((q, index) => (
                        <QuestionRenderer 
                            key={index}
                            question={q}
                            index={index}
                            userAnswer={userAnswers[index]}
                            onAnswerChange={handleAnswerChange}
                            showAnswers={showAnswers}
                        />
                    ))}
                    
                    {!showAnswers ? (
                        <button onClick={handleSubmitQuiz} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Vérifier mes réponses
                        </button>
                    ) : (
                        <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-lg text-center shadow-inner">
                            <h3 className="text-xl font-bold text-indigo-800">Résultats du Quiz</h3>
                            {getGradableQuestionCount() > 0 &&
                                <p className="text-2xl font-bold text-indigo-700 my-2">
                                    {calculateScore()} / {getGradableQuestionCount()}
                                </p>
                            }
                            <p className="text-gray-600">Relisez les explications pour renforcer votre apprentissage.</p>
                            <button onClick={resetQuiz} className="mt-4 px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Créer un nouveau quiz
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Quiz;

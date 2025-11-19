import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Flashcard, ImageFile, UserProfile, QuizQuestion, QuizType } from "../types";

// Initialize the Google Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getUserContext = (userProfile: UserProfile): string => {
  const historyText = userProfile.history.length > 0
    ? `\n\n**Historique des interactions (le plus récent en dernier) :**\n- ${userProfile.history.slice(-10).join('\n- ')}`
    : '';

  const profileText = userProfile.learningProfile
    ? `\n\n**Description de l'utilisateur sur lui-même :**\n"${userProfile.learningProfile}"`
    : '';
  
  const aiSummaryText = userProfile.aiGeneratedLearningStyleSummary
    ? `\n\n**Ton analyse précédente de son style d'apprentissage :**\n"${userProfile.aiGeneratedLearningStyleSummary}"`
    : '';

  return `CONTEXTE SUR L'APPRENANT:
Tu es un tuteur IA expert, spécialisé en psychologie cognitive. Ton rôle est de comprendre en profondeur la manière de penser de ton élève pour lui offrir un accompagnement sur mesure.

**Ta mission :** Avant de répondre à sa demande, analyse les informations suivantes pour te forger un modèle mental précis de l'apprenant.
${profileText}
${historyText}
${aiSummaryText}

**Analyse à effectuer :**
1.  **Style de Raisonnement :** Préfère-t-il une approche déductive (des principes aux exemples) ou inductive (des exemples aux principes) ? Est-il analytique, créatif, pragmatique ?
2.  **Niveau de Connaissance :** Est-il débutant, intermédiaire ou avancé sur les sujets abordés ? Adapte la complexité de ton vocabulaire.
3.  **Mode de Questionnement :** Pose-t-il des questions ouvertes ("Explique-moi...") ou fermées ("Est-ce que X est Y ?") ? Cherche-t-il des faits, des processus ou des concepts abstraits ?
4.  **Âge et Maturité Estimés :** Adapte le ton et les exemples à un public que tu estimes être (collégien, lycéen, étudiant, professionnel).

Maintenant, en te basant sur cette analyse fine, réponds à la demande de l'utilisateur qui suit. Incarne le tuteur parfait pour LUI.`;
};

export const generateStudyPlan = async (topic: string, duration: string, userProfile: UserProfile): Promise<string> => {
  const basePrompt = `Crée un plan de révision détaillé pour le sujet suivant : "${topic}".
La session d'étude durera ${duration}.
Le plan doit être divisé en étapes claires et gérables, avec des estimations de temps.
Le ton doit être encourageant. Formatte la réponse en Markdown.`;

  const contextualPrompt = `${getUserContext(userProfile)}\n\n**DEMANDE ACTUELLE :**\n${basePrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextualPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Impossible de générer le plan de révision. Veuillez réessayer.");
  }
};

export const createFlashcards = async (notes: string, userProfile: UserProfile): Promise<Flashcard[]> => {
  const basePrompt = `À partir des notes suivantes, génère des fiches de mémorisation (flashcards) au format question/réponse.
Chaque fiche doit avoir un côté "recto" (question/terme) et "verso" (réponse/définition).
Les questions doivent être claires et les réponses concises.

Notes de l'utilisateur :
---
${notes}
---`;
  
  const contextualPrompt = `${getUserContext(userProfile)}\n\n**DEMANDE ACTUELLE :**\n${basePrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextualPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              description: "Une liste de fiches de mémorisation.",
              items: {
                type: Type.OBJECT,
                properties: {
                  recto: { type: Type.STRING },
                  verso: { type: Type.STRING }
                },
                required: ["recto", "verso"]
              }
            }
          },
          required: ["cards"]
        }
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse?.cards || [];
  } catch (error) {
    console.error("Error creating flashcards:", error);
    throw new Error("Impossible de créer les fiches. Vérifiez le format de vos notes et réessayez.");
  }
};

export const extractTextFromImage = async (image: ImageFile): Promise<string> => {
  const imagePart = { inlineData: { data: image.data, mimeType: image.mimeType } };
  const textPart = { text: "Extrais tout le texte de cette image. Si le texte est manuscrit, fais de ton mieux pour le retranscrire fidèlement." };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
    });
    return response.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Impossible d'extraire le texte de l'image.");
  }
};

export const generateAudioFromText = async (text: string): Promise<string> => {
  if (text.length > 1000) text = text.substring(0, 1000);
  const prompt = `Lis le texte suivant d'une voix claire et calme : "${text}"`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Aucune donnée audio reçue.");
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Impossible de générer l'audio.");
  }
};

export const getExplanation = async (topic: string, userProfile: UserProfile): Promise<string> => {
    const basePrompt = `Explique le concept ou réponds à la question suivante : "${topic}".
Structure la réponse pour qu'elle soit facile à comprendre. Formatte la réponse en Markdown.`;

    const contextualPrompt = `${getUserContext(userProfile)}\n\n**DEMANDE ACTUELLE :**\n${basePrompt}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: contextualPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting explanation:", error);
        throw new Error("Impossible d'obtenir une explication.");
    }
};

export const generateQuiz = async (notes: string, quizType: QuizType, userProfile: UserProfile): Promise<QuizQuestion[]> => {
    const quizTypeDescription = {
        'mcq': 'un Quiz à Choix Multiples (QCM) de 5 questions',
        'open': '5 questions ouvertes avec une réponse idéale pour chacune',
        'true-false': '5 affirmations de type Vrai ou Faux'
    };

    const basePrompt = `À partir des notes suivantes, génère un quiz pour tester la compréhension.
Le quiz doit être sous la forme de : ${quizTypeDescription[quizType]}.

Notes de l'utilisateur :
---
${notes}
---`;

    const contextualPrompt = `${getUserContext(userProfile)}\n\n**DEMANDE ACTUELLE :**\n${basePrompt}`;

    const mcqSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['mcq'] },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING, description: "Une brève explication de pourquoi la réponse est correcte." }
        },
        required: ["type", "question", "options", "correctAnswerIndex", "explanation"]
    };

    const openSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['open'] },
            question: { type: Type.STRING },
            idealAnswer: { type: Type.STRING, description: "La réponse idéale et complète à la question." }
        },
        required: ["type", "question", "idealAnswer"]
    };

    const trueFalseSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['true-false'] },
            statement: { type: Type.STRING },
            isTrue: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING, description: "Une brève explication de pourquoi l'affirmation est vraie ou fausse." }
        },
        required: ["type", "statement", "isTrue", "explanation"]
    };

    let itemSchema;
    switch (quizType) {
        case 'mcq': itemSchema = mcqSchema; break;
        case 'open': itemSchema = openSchema; break;
        case 'true-false': itemSchema = trueFalseSchema; break;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: contextualPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: {
                            type: Type.ARRAY,
                            description: "Une liste de questions pour le quiz.",
                            items: itemSchema
                        }
                    },
                    required: ["quiz"]
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse?.quiz || [];
    } catch (error) {
        console.error("Error creating quiz:", error);
        throw new Error("Impossible de créer le quiz. Vérifiez vos notes et réessayez.");
    }
};


export const analyzeAndSummarizeLearningStyle = async (userProfile: UserProfile): Promise<string> => {
  const historyText = userProfile.history.length > 0
    ? `**Historique des interactions :**\n- ${userProfile.history.join('\n- ')}`
    : "L'utilisateur n'a pas encore d'historique.";
  const profileText = userProfile.learningProfile
    ? `**Description de l'utilisateur sur lui-même :**\n"${userProfile.learningProfile}"`
    : "L'utilisateur n'a pas décrit son style d'apprentissage.";

  const prompt = `Tu es un psychologue cognitif et un tuteur expert. Analyse les données d'un apprenant pour décrire son style de pensée.
${profileText}
${historyText}
Rédige un court paragraphe (3-4 phrases) qui résume sa manière de réfléchir. Parle-lui directement ("Il semble que vous..."). Sois perspicace et bienveillant.
Concentre-toi sur sa manière de poser des questions, le niveau de détail qu'il apprécie, et son approche des problèmes.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing learning style:", error);
    throw new Error("Impossible d'analyser le style d'apprentissage.");
  }
};


import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Ingredient, Recipe, AIRecipeResponse, Restaurant } from "../types";

// Exporting getAI to allow components to create fresh instances as per guidelines
export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DUMMY DATA FOR TESTING ---
const DUMREGIONAL = [
  { name: 'Paneer Butter Masala', description: 'Creamy paneer in a rich tomato-based gravy.' },
  { name: 'Falafel Bowl', description: 'Crispy chickpea fritters served with tahini and fresh vegetables.' },
  { name: 'Ratatouille', description: 'Classic French stewed vegetable dish.' },
  { name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato mash.' },
  { name: 'Eggplant Parmesan', description: 'Breaded eggplant slices baked with tomato sauce and mozzarella.' },
  { name: 'Wild Mushroom Pasta', description: 'Homemade tagliatelle with a medley of forest mushrooms.' }
];

const INGREDIENT_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      calories: { type: Type.INTEGER },
      protein: { type: Type.STRING },
      carbs: { type: Type.STRING },
      fat: { type: Type.STRING },
      properties: { type: Type.STRING }
    },
    required: ["name", "calories", "protein", "carbs", "fat", "properties"]
  }
};

const RECIPE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      totalTime: { type: Type.STRING },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            durationSeconds: { type: Type.INTEGER },
            instruction: { type: Type.STRING }
          },
          required: ["label", "durationSeconds", "instruction"]
        }
      }
    },
    required: ["title", "description", "difficulty", "totalTime", "steps"]
  }
};

export const analyzeIngredients = async (input: { text?: string, imageBase64?: string }): Promise<Ingredient[]> => {
  try {
    const ai = getAI();
    const parts: any[] = [];
    
    if (input.text) parts.push({ text: `Analyze these ingredients: ${input.text}` });
    if (input.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: input.imageBase64
        }
      });
      parts.push({ text: "Identify all the vegetarian ingredients in this image." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: "You are a nutritionist. Identify vegetarian ingredients (strictly no meat/eggs, but dairy is okay). For each ingredient, provide: name, calories per 100g, protein, carbs, fat, and a brief health property. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: INGREDIENT_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini analyzeIngredients failed", e);
    return [];
  }
};

export const getExploreIngredients = async (dishName: string): Promise<Ingredient[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List all vegetarian ingredients needed to make: ${dishName}`,
      config: {
        systemInstruction: "You are a professional vegetarian chef. Provide a comprehensive list of all ingredients required to make the best possible version of this dish. For each ingredient, provide nutritional facts per 100g and health properties. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: INGREDIENT_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getExploreIngredients failed", e);
    return [];
  }
};

export const getDishesByLocation = async (country: string, state: string, filters: string[] = []): Promise<{ name: string, description: string }[]> => {
  try {
    const ai = getAI();
    const location = state ? `${state}, ${country}` : country;
    const filterText = filters.length > 0 ? ` Apply these filters/categories: ${filters.join(", ")}.` : "";
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 6 traditional or popular vegetarian dishes from ${location}.${filterText}`,
      config: {
        systemInstruction: "You are a culinary expert. Suggest 6 iconic vegetarian dishes from the location. If texture filters like 'Chewable', 'Suckable', 'Lickable', or 'Drinkable' are provided, strictly match the textures. If 'Palate Cleanser' is provided, suggest items like sorbets, pickled ginger, or light broths meant to neutralize taste. Provide dish name and a short one-sentence description. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return DUMREGIONAL;
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini getDishesByLocation failed", e);
    return DUMREGIONAL;
  }
};

export const getHerbalRecipes = async (ailment: string): Promise<Recipe[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Suggest 4 herbal teas, tonics, or simple vegetarian recipes specifically to help with: ${ailment}.`,
      config: {
        systemInstruction: "You are an expert herbalist and nutritionist. Suggest 4 effective, plant-based, and vegetarian recipes for the specified health concern. Each recipe must include: title, description (explaining why it helps), difficulty, totalTime, and discrete timed steps for preparation. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getHerbalRecipes failed", e);
    return [];
  }
};

export const generateIngredientImage = async (name: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A clean, high-quality studio photograph of a single fresh ingredient: ${name}. White background, soft shadows, vibrant colors, 4k resolution.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Gemini generateIngredientImage failed", e);
  }
  return null;
};

export const getRecipesForIngredients = async (ingredients: Ingredient[]): Promise<Recipe[]> => {
  try {
    const ai = getAI();
    const ingredientNames = ingredients.map(i => i.name).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 vegetarian recipes using some or all of these ingredients: ${ingredientNames}`,
      config: {
        systemInstruction: "You are a chef. Suggest 3 unique vegetarian recipes (no eggs, no meat). Each recipe must have discrete timed steps. Provide: title, description, difficulty, totalTime, and steps (label, durationSeconds, instruction). Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getRecipesForIngredients failed", e);
    return [];
  }
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A high-quality, professional food photography shot of ${recipeTitle}. This is a STRICTLY VEGETARIAN dish. Beautiful lighting, clean presentation, 4k resolution.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Gemini generateRecipeImage failed", e);
  }
  return null;
};

export const generateStepImage = async (recipeTitle: string, stepLabel: string, stepInstruction: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Cooking process visual: ${recipeTitle}. Step: ${stepLabel}. Description: ${stepInstruction}. Vegetarian kitchen environment, close-up shot, appetizing, photorealistic.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Gemini generateStepImage failed", e);
  }
  return null;
};

export const getCookingSuggestion = async (query: string): Promise<AIRecipeResponse> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the ideal cooking time and method for: ${query}`,
      config: {
        systemInstruction: "You are a professional chef. Provide cooking advice including food name, method, time in seconds, temperature, and tips. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            cookingMethod: { type: Type.STRING },
            suggestedTimeInSeconds: { type: Type.INTEGER },
            temperature: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["foodName", "cookingMethod", "suggestedTimeInSeconds", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini getCookingSuggestion failed", e);
    return {
      foodName: query,
      cookingMethod: 'Sauté',
      suggestedTimeInSeconds: 300,
      tips: ['Season generously.', 'Use medium heat.']
    };
  }
};

/**
 * Fetches popular vegetarian restaurants and extracts grounding URLs for transparency.
 * Upgrade to gemini-3-pro-image-preview as googleSearch tool is mandatory for real-time information.
 */
export const getVegRestaurants = async (country: string, state: string): Promise<{ restaurants: Restaurant[], sourceUrls: { uri: string, title: string }[] }> => {
  try {
    const ai = getAI();
    const location = state ? `${state}, ${country}` : country;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `Find popular pure vegetarian/vegan restaurants in ${location}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a food guide. Suggest 6 real pure vegetarian or vegan restaurants in the specified location. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              deliveryTime: { type: Type.STRING },
              priceLevel: { type: Type.STRING },
              description: { type: Type.STRING },
              cuisine: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "rating", "deliveryTime", "priceLevel", "description", "cuisine"]
          }
        }
      }
    });

    const text = response.text || "[]";
    const restaurants = JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
    
    // Always extract and provide URLs from grounding chunks when using Google Search
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    return { restaurants, sourceUrls };
  } catch (e) {
    console.error("Gemini getVegRestaurants failed", e);
    return { restaurants: [], sourceUrls: [] };
  }
};

// Internal state for audio playback tracking
let audioCtx: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;

export const stopVoice = () => {
  if (activeSource) {
    try { activeSource.stop(); } catch (e) {}
    activeSource = null;
  }
};

export const playInstructionVoice = async (text: string) => {
  stopVoice();
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      activeSource = source;
      source.onended = () => { if (activeSource === source) activeSource = null; };
      source.start();
    }
  } catch (e) {
    console.error("Voice failed", e);
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

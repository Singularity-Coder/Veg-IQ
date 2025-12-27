
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Ingredient, Recipe, AIRecipeResponse } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Global audio state to manage cancellation
let activeSource: AudioBufferSourceNode | null = null;
let audioCtx: AudioContext | null = null;

export const analyzeIngredients = async (input: { text?: string, imageBase64?: string }): Promise<Ingredient[]> => {
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
      responseSchema: {
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
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text).map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
};

export const getRecipesForIngredients = async (ingredients: Ingredient[]): Promise<Recipe[]> => {
  const ai = getAI();
  const ingredientNames = ingredients.map(i => i.name).join(", ");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest 3 vegetarian recipes using some or all of these ingredients: ${ingredientNames}`,
    config: {
      systemInstruction: "You are a chef. Suggest 3 unique vegetarian recipes (no eggs, no meat). Each recipe must have discrete timed steps. Provide: title, description, difficulty, totalTime, and steps (label, durationSeconds, instruction). Order steps logically for cooking. Return ONLY valid JSON.",
      responseMimeType: "application/json",
      responseSchema: {
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
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A high-quality, professional food photography shot of ${recipeTitle}. This is a STRICTLY VEGETARIAN dish. Ensure there are NO meat items, NO eggs, and NO animal-derived products besides dairy. It should look like a delicious plant-based masterpiece, plated beautifully on a modern dining table, soft lighting, 4k resolution.` }
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
  return null;
};

export const generateStepImage = async (recipeTitle: string, stepLabel: string, stepInstruction: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Cooking process visual: ${recipeTitle}. Specifically showing the step: ${stepLabel}. Description: ${stepInstruction}. Vegetarian kitchen environment, close-up shot, appetizing, professional lighting, photorealistic, no meat, no eggs.` }
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
  return null;
};

export const getCookingSuggestion = async (query: string): Promise<AIRecipeResponse> => {
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
};

export const stopVoice = () => {
  if (activeSource) {
    try {
      activeSource.stop();
    } catch (e) {
      // Ignore if already stopped
    }
    activeSource = null;
  }
};

export const playInstructionVoice = async (text: string) => {
  // Cancel previous voice immediately
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
      source.onended = () => {
        if (activeSource === source) activeSource = null;
      };
      
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

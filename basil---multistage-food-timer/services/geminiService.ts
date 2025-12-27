
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Ingredient, Recipe, AIRecipeResponse, Restaurant } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Global audio state to manage cancellation
let activeSource: AudioBufferSourceNode | null = null;
let audioCtx: AudioContext | null = null;

// --- DUMMY DATA FOR TESTING ---
const DUMMY_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Avocado', calories: 160, protein: '2g', carbs: '9g', fat: '15g', properties: 'Rich in healthy monounsaturated fats and potassium.', imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Spinach', calories: 23, protein: '2.9g', carbs: '3.6g', fat: '0.4g', properties: 'High in iron, vitamins A and C.', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Tofu', calories: 76, protein: '8g', carbs: '2g', fat: '4.8g', properties: 'Excellent plant-based protein source.', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Quinoa', calories: 120, protein: '4.4g', carbs: '21g', fat: '1.9g', properties: 'A complete protein containing all nine essential amino acids.', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Mushrooms', calories: 22, protein: '3.1g', carbs: '3.3g', fat: '0.3g', properties: 'Low calorie source of fiber and selenium.', imageUrl: 'https://images.unsplash.com/photo-1568453452243-7033a886361a?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Chickpeas', calories: 164, protein: '8.9g', carbs: '27g', fat: '2.6g', properties: 'Great source of protein and dietary fiber.', imageUrl: 'https://images.unsplash.com/photo-1585914641050-fa9883c4e21c?auto=format&fit=crop&q=80&w=400' },
  { id: '7', name: 'Bell Peppers', calories: 31, protein: '1g', carbs: '6g', fat: '0.3g', properties: 'Exceptionally high in vitamin C.', imageUrl: 'https://images.unsplash.com/photo-1566275529824-cca6d00a07b3?auto=format&fit=crop&q=80&w=400' },
  { id: '8', name: 'Kale', calories: 49, protein: '4.3g', carbs: '8.8g', fat: '0.9g', properties: 'A superfood packed with antioxidants.', imageUrl: 'https://images.unsplash.com/photo-1524179524541-1bb307ed3364?auto=format&fit=crop&q=80&w=400' },
  { id: '9', name: 'Lentils', calories: 116, protein: '9g', carbs: '20g', fat: '0.4g', properties: 'Heart-healthy and high in polyphenols.', imageUrl: 'https://images.unsplash.com/photo-1529690656645-15c6786c4e68?auto=format&fit=crop&q=80&w=400' },
  { id: '10', name: 'Sweet Potato', calories: 86, protein: '1.6g', carbs: '20g', fat: '0.1g', properties: 'Excellent source of beta-carotene.', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400' },
];

const DUMMY_RECIPES: Recipe[] = [
  { id: 'r1', title: 'Mushroom Risotto', description: 'A creamy, classic Italian rice dish flavored with wild mushrooms.', difficulty: 'Medium', totalTime: '45 mins', steps: [
    { label: 'Sauté', durationSeconds: 300, instruction: 'Sauté mushrooms and shallots until golden brown.' },
    { label: 'Toast', durationSeconds: 120, instruction: 'Add Arborio rice and toast slightly.' },
    { label: 'Simmer', durationSeconds: 1200, instruction: 'Slowly add vegetable stock ladle by ladle while stirring.' }
  ], imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=600' },
  { id: 'r2', title: 'Avocado Buddha Bowl', description: 'A vibrant, nutrient-dense bowl with quinoa, chickpeas, and fresh avocado.', difficulty: 'Easy', totalTime: '20 mins', steps: [
    { label: 'Prep Base', durationSeconds: 60, instruction: 'Place cooked quinoa in a bowl.' },
    { label: 'Assemble', durationSeconds: 180, instruction: 'Arrange chickpeas, sliced avocado, and fresh kale.' },
    { label: 'Dress', durationSeconds: 60, instruction: 'Drizzle with tahini lemon dressing.' }
  ], imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600' },
  { id: 'r3', title: 'Tofu Stir-Fry', description: 'Crispy tofu and mixed vegetables tossed in a savory ginger-soy sauce.', difficulty: 'Easy', totalTime: '25 mins', steps: [
    { label: 'Crisp Tofu', durationSeconds: 600, instruction: 'Pan-fry tofu cubes until golden and crispy.' },
    { label: 'Stir-Fry', durationSeconds: 300, instruction: 'Toss in bell peppers, broccoli, and snap peas.' },
    { label: 'Glaze', durationSeconds: 120, instruction: 'Add sauce and cook until thickened.' }
  ], imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600' }
];

const DUMMY_RESTAURANTS: Restaurant[] = [
  { id: 'rest1', name: 'The Green Leaf', rating: 4.8, deliveryTime: '20-30 min', priceLevel: '$$', cuisine: ['Vegan', 'Organic'], description: 'Modern plant-based dining focusing on local seasonal harvests.' },
  { id: 'rest2', name: 'Vitality Hub', rating: 4.5, deliveryTime: '15-25 min', priceLevel: '$', cuisine: ['Salads', 'Juices'], description: 'Quick, nutrient-packed meals for the health-conscious urbanite.' },
  { id: 'rest3', name: 'Pure Bistro', rating: 4.9, deliveryTime: '30-40 min', priceLevel: '$$$', cuisine: ['Fine Dining', 'Vegetarian'], description: 'Award-winning vegetarian creations in an elegant setting.' },
  { id: 'rest4', name: 'Sprout & Soul', rating: 4.4, deliveryTime: '25-35 min', priceLevel: '$$', cuisine: ['Asian Fusion', 'Vegan'], description: 'Creative vegan sushi and bowls with a soulful twist.' },
  { id: 'rest5', name: 'Earthly Delights', rating: 4.7, deliveryTime: '20-30 min', priceLevel: '$$', cuisine: ['Comfort Food', 'Veggie'], description: 'Hearty vegetarian burgers and comfort classics.' },
  { id: 'rest6', name: 'Garden Gastronomy', rating: 4.6, deliveryTime: '35-45 min', priceLevel: '$$$', cuisine: ['French', 'Vegetarian'], description: 'Exquisite French-inspired vegetable-forward dishes.' },
  { id: 'rest7', name: 'Zest & Zen', rating: 4.3, deliveryTime: '15-25 min', priceLevel: '$', cuisine: ['Mediterranean'], description: 'Fresh Mediterranean flavors with a focus on plant-based dips and wraps.' },
  { id: 'rest8', name: 'Wholesome Harvest', rating: 4.8, deliveryTime: '25-40 min', priceLevel: '$$', cuisine: ['Farm-to-Table'], description: 'Rustic farm-to-table vegetarian meals.' },
  { id: 'rest9', name: 'Karma Kitchen', rating: 4.5, deliveryTime: '30-45 min', priceLevel: '$$', cuisine: ['Indian', 'Pure Veg'], description: 'Traditional Indian spices meets modern vegetarian cooking.' },
  { id: 'rest10', name: 'Nature\'s Plate', rating: 4.2, deliveryTime: '20-30 min', priceLevel: '$', cuisine: ['Gluten-Free', 'Vegan'], description: 'Clean eating made simple with naturally gluten-free ingredients.' }
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
    if (!text) return DUMMY_INGREDIENTS.slice(0, 3);
    return JSON.parse(text).map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini analyzeIngredients failed, using dummy data", e);
    return DUMMY_INGREDIENTS.slice(0, 5);
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
    if (!text) return DUMMY_INGREDIENTS.slice(3, 8);
    return JSON.parse(text).map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getExploreIngredients failed, using dummy data", e);
    return DUMMY_INGREDIENTS.slice(5, 10);
  }
};

export const getDishesByLocation = async (country: string, state: string): Promise<{ name: string, description: string }[]> => {
  try {
    const ai = getAI();
    const location = state ? `${state}, ${country}` : country;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 6 traditional and popular vegetarian dishes from ${location}.`,
      config: {
        systemInstruction: "You are a culinary expert. Suggest 6 iconic vegetarian dishes from the given location. Provide the dish name and a very short one-sentence description. Return ONLY valid JSON.",
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
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini getDishesByLocation failed, using dummy data", e);
    return [
      { name: 'Paneer Butter Masala', description: 'Creamy paneer in a rich tomato-based gravy.' },
      { name: 'Falafel Bowl', description: 'Crispy chickpea fritters served with tahini and fresh vegetables.' },
      { name: 'Ratatouille', description: 'Classic French stewed vegetable dish.' },
      { name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato mash.' },
      { name: 'Eggplant Parmesan', description: 'Breaded eggplant slices baked with tomato sauce and mozzarella.' },
      { name: 'Wild Mushroom Pasta', description: 'Homemade tagliatelle with a medley of forest mushrooms.' }
    ];
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
    if (!text) return DUMMY_RECIPES.slice(0, 2);
    return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getHerbalRecipes failed, using dummy data", e);
    return [
      { id: 'h1', title: 'Ginger & Honey Immunity Shot', description: 'Potent anti-inflammatory shot to boost your morning resilience.', difficulty: 'Easy', totalTime: '5 mins', steps: [
        { label: 'Extract', durationSeconds: 60, instruction: 'Grate fresh ginger and squeeze the juice.' },
        { label: 'Mix', durationSeconds: 30, instruction: 'Add raw honey and a pinch of turmeric.' }
      ], imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?auto=format&fit=crop&q=80&w=400' },
      { id: 'h2', title: 'Chamomile Deep Sleep Tonic', description: 'A soothing infusion designed to calm the nervous system.', difficulty: 'Easy', totalTime: '10 mins', steps: [
        { label: 'Steep', durationSeconds: 420, instruction: 'Brew high-quality chamomile flowers in boiling water.' },
        { label: 'Sip', durationSeconds: 120, instruction: 'Add a sprig of lavender for extra relaxation.' }
      ], imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4586c3d4?auto=format&fit=crop&q=80&w=400' }
    ];
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
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=400';
};

export const getRecipesForIngredients = async (ingredients: Ingredient[]): Promise<Recipe[]> => {
  try {
    const ai = getAI();
    const ingredientNames = ingredients.map(i => i.name).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 3 vegetarian recipes using some or all of these ingredients: ${ingredientNames}`,
      config: {
        systemInstruction: "You are a chef. Suggest 3 unique vegetarian recipes (no eggs, no meat). Each recipe must have discrete timed steps. Provide: title, description, difficulty, totalTime, and steps (label, durationSeconds, instruction). Order steps logically for cooking. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return DUMMY_RECIPES;
    return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getRecipesForIngredients failed, using dummy data", e);
    return DUMMY_RECIPES;
  }
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A high-quality, professional food photography shot of ${recipeTitle}. This is a STRICTLY VEGETARIAN dish. It should look like a wellness-focused plant-based masterpiece, beautiful lighting, clean presentation, 4k resolution.` }
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
  return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=400';
};

export const generateStepImage = async (recipeTitle: string, stepLabel: string, stepInstruction: string): Promise<string | null> => {
  try {
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
  } catch (e) {
    console.error("Gemini generateStepImage failed", e);
  }
  return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600';
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
    console.error("Gemini getCookingSuggestion failed, using dummy data", e);
    return {
      foodName: query,
      cookingMethod: 'Sauté',
      suggestedTimeInSeconds: 300,
      tips: ['Season generously with salt.', 'Use high heat for a good sear.']
    };
  }
};

export const getVegRestaurants = async (country: string, state: string): Promise<Restaurant[]> => {
  try {
    const ai = getAI();
    const location = state ? `${state}, ${country}` : country;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find popular pure vegetarian/vegan restaurants in ${location}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a food guide. Suggest 6 real pure vegetarian or vegan restaurants in the specified location. For each, provide: name, rating (out of 5), deliveryTime (e.g., 25-30 min), priceLevel (e.g., $$), description, and cuisine (array of strings). Return ONLY valid JSON.",
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

    const text = response.text;
    if (!text) return DUMMY_RESTAURANTS.slice(0, 6);
    return JSON.parse(text).map((r: any) => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
  } catch (e) {
    console.error("Gemini getVegRestaurants failed, using dummy data", e);
    return DUMMY_RESTAURANTS;
  }
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

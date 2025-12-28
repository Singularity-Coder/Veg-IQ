
import { Tab, MealReminder, BlogPost } from './types'

// Category colors for different timer types
export const CATEGORY_COLORS = {
  meat: 'bg-red-50 text-red-700 border-red-200',
  veg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pasta: 'bg-amber-50 text-amber-700 border-amber-200',
  custom: 'bg-sky-50 text-sky-700 border-sky-200',
  ai: 'bg-purple-50 text-purple-700 border-purple-200',
};

// Supported countries for sourcing links
export const COUNTRIES = [
  { code: 'US', name: 'USA', amazon: 'https://www.amazon.com/s?k=' },
  { code: 'IN', name: 'INDIA', amazon: 'https://www.amazon.in/s?k=' },
  { code: 'UK', name: 'UK', amazon: 'https://www.amazon.co.uk/s?k=' },
  { code: 'CA', name: 'CANADA', amazon: 'https://www.amazon.ca/s?k=' },
  { code: 'AU', name: 'AUSTRALIA', amazon: 'https://www.amazon.com.au/s?k=' },
  { code: 'OTHER', name: 'OTHER', amazon: 'https://www.google.com/search?q=buy+' }
];

// Comprehensive list for the Cuisine Exploration filter
export const EXPLORE_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bangladesh", "Belgium", "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Czech Republic", "Denmark", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Ethiopia", "Finland", "France", "Georgia", "Germany", "Greece",
  "Guatemala", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Korea (South)",
  "Lebanon", "Malaysia", "Mexico", "Morocco", "Myanmar", "Nepal", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania", "Russia",
  "Saudi Arabia", "Singapore", "South Africa", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam"
];

// Major states/regions for regional dish exploration
export const STATES: Record<string, string[]> = {
  US: ['California', 'New York', 'Texas', 'Florida', 'Washington'],
  IN: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Kerala', 'Rajasthan'],
  UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']
};

// Common health concerns for herbal remedy suggestions
export const AILMENTS = [
  { id: 'digestion', label: 'DIGESTION', icon: '🍃' },
  { id: 'immunity', label: 'IMMUNITY', icon: '🛡️' },
  { id: 'sleep', label: 'SLEEP', icon: '😴' },
  { id: 'stress', label: 'STRESS', icon: '🧘' },
  { id: 'cold', label: 'COLD & FLU', icon: '🤧' },
  { id: 'energy', label: 'ENERGY', icon: '⚡' },
];

// Initial default meal reminders
export const INITIAL_REMINDERS: MealReminder[] = [
  { id: 'breakfast', label: 'BREAKFAST', time: '08:00', enabled: false },
  { id: 'brunch', label: 'BRUNCH', time: '11:00', enabled: false },
  { id: 'lunch', label: 'LUNCH', time: '13:00', enabled: false },
  { id: 'dinner', label: 'DINNER', time: '20:00', enabled: false },
];

export const PANTRY_SUGGESTIONS = ['Spinach', 'Avocado', 'Tomatoes', 'Mushrooms', 'Tofu', 'Bell Peppers', 'Garlic', 'Quinoa'];
export const DISH_SUGGESTIONS = ['Mushroom Risotto', 'Truffle Pasta', 'Buddha Bowl', 'Veggie Curry', 'Caprese Salad', 'Paneer Tikka'];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: 'The Telomere Effect: How Plant-Based Diets Slow Cellular Aging',
    excerpt: 'Emerging research suggests that high consumption of plant nutrients can directly impact telomere length, a key indicator of longevity.',
    content: `Recent longitudinal studies have demonstrated a significant correlation between a diet rich in whole plant foods and the maintenance of telomere length. Telomeres are the protective caps on the end of chromosomes that shorten as cells divide. When they become too short, the cell can no longer reproduce and dies. \n\nScientific consensus indicates that antioxidants found in abundance in vegetables, fruits, legumes, and nuts reduce oxidative stress and inflammation, the two primary drivers of telomere shortening. Diets high in processed meats, conversely, are linked to accelerated cellular aging. By prioritizing phytochemicals like polyphenols and carotenoids, individuals can essentially 'slow the clock' at a molecular level.`,
    author: 'Dr. Alistair Vaughn',
    date: 'OCTOBER 12, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1505575967455-40e256f73376?auto=format&fit=crop&q=80&w=800',
    tags: ['LONGEVITY', 'GENETICS', 'NUTRITION']
  },
  {
    id: 'b2',
    title: 'The Gut-Brain Connection: Why Greens Improve Cognitive Clarity',
    excerpt: 'Understanding the bidirectional communication between the enteric nervous system and the prefrontal cortex via fiber-rich intake.',
    content: `The gut-brain axis is perhaps the most exciting frontier in modern nutritional science. The human gut microbiome, home to trillions of bacteria, thrives on a variety of dietary fibers—something completely absent from animal products. When these bacteria ferment fiber, they produce short-chain fatty acids (SCFAs) like butyrate.\n\nSCFAs have been shown to cross the blood-brain barrier, reducing neuro-inflammation and supporting the production of Brain-Derived Neurotrophic Factor (BDNF). Higher levels of BDNF are associated with improved memory, faster learning, and better mood regulation. Clinical trials often show that individuals on a diverse vegetarian diet report lower scores on depression and anxiety scales compared to heavy meat consumers, highlighting that mental health begins on the plate.`,
    author: 'Elena Thorne, Ph.D.',
    date: 'SEPTEMBER 28, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
    tags: ['NEUROSCIENCE', 'MICROBIOME', 'MENTAL HEALTH']
  },
  {
    id: 'b3',
    title: 'Metabolic Efficiency and the Bioavailability of Plant Proteins',
    excerpt: 'Dispelling the myth of incomplete proteins and exploring the efficiency of nitrogen balance in plant-centric athletes.',
    content: `For decades, the 'incomplete protein' myth plagued the vegetarian community. However, current biochemistry reveals that the liver stores a pool of essential amino acids, making 'protein combining' at every meal unnecessary. What is more fascinating is metabolic efficiency.\n\nPlant-based protein sources, like lentils, quinoa, and hemp hearts, come 'packaged' with fiber and zero cholesterol. Research published in the Journal of the American Heart Association shows that replacing animal protein with plant protein significantly lowers LDL cholesterol and markers of metabolic syndrome. Furthermore, nitrogen balance studies on elite plant-based athletes show that muscle protein synthesis is just as effective with plant sources, often with shorter recovery times due to the higher antioxidant load reducing post-exercise systemic inflammation.`,
    author: 'Julian Sterling, MS, RD',
    date: 'AUGUST 15, 2025',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    tags: ['METABOLISM', 'SPORTS SCIENCE', 'PROTEIN']
  }
];

// Banner images for each application tab
export const TAB_BANNERS: Record<Tab, string> = {
  discover: "https://images.pexels.com/photos/27662766/pexels-photo-27662766.jpeg?auto=format&fit=crop&q=80&w=2000",
  explore: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=2000",
  health: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=2000",
  restaurants: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000",
  custom: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2070&auto=format&fit=crop&q=80&w=2000",
  favorites: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000",
  blog: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=2000"
};

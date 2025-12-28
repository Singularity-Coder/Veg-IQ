
import { Ingredient, Recipe, Restaurant } from "./types";

export const DUMREGIONAL = [
  { name: 'Paneer Butter Masala', description: 'Creamy paneer in a rich tomato-based gravy.', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800' },
  { name: 'Falafel Bowl', description: 'Crispy chickpea fritters served with tahini and fresh vegetables.', imageUrl: 'https://images.unsplash.com/photo-1547050605-2f2670355bad?auto=format&fit=crop&q=80&w=800' },
  { name: 'Ratatouille', description: 'Classic French stewed vegetable dish.', imageUrl: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?auto=format&fit=crop&q=80&w=800' },
  { name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato mash.', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800' },
  { name: 'Eggplant Parmesan', description: 'Breaded eggplant slices baked with tomato sauce and mozzarella.', imageUrl: 'https://images.unsplash.com/photo-1621510456681-23a238612168?auto=format&fit=crop&q=80&w=800' },
  { name: 'Wild Mushroom Pasta', description: 'Homemade tagliatelle with a medley of forest mushrooms.', imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=800' }
];

export const DUMMY_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Fresh Broccoli', calories: 34, protein: '2.8g', carbs: '6.6g', fat: '0.4g', properties: 'Rich in vitamin C and K. Supports bone health.', imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&q=80&w=600' },
  { id: '2', name: 'Organic Carrots', calories: 41, protein: '0.9g', carbs: '9.6g', fat: '0.2g', properties: 'High beta-carotene for eye health and immunity.', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600' },
  { id: '3', name: 'Baby Spinach', calories: 23, protein: '2.9g', carbs: '3.6g', fat: '0.4g', properties: 'Excellent source of iron and folic acid.', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600' },
  { id: '4', name: 'Cherry Tomatoes', calories: 18, protein: '0.9g', carbs: '3.9g', fat: '0.2g', properties: 'Contains lycopene, a powerful antioxidant.', imageUrl: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?q=80&w=2070&auto=format&fit=crop&q=80&w=600' }
];

export const DUMMY_RECIPE: Recipe = {
  id: 'd-rec-1',
  title: 'Garden Harvest Risotto',
  description: 'A creamy, seasonal rice dish celebrating the freshest vegetables from the pantry.',
  difficulty: 'Medium',
  totalTime: '25 mins',
  imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=800',
  details: {
    origin: "Northern Italy",
    history: "Risotto as we know it today was refined in the mid-19th century in Milan, evolving from a standard boiled rice dish into a creamy, high-starch masterpiece using short-grain varieties.",
    healthBenefits: [
      "Rich in complex carbohydrates for sustained energy release.",
      "High vitamin C content from seasonal greens like asparagus and peas.",
      "Antioxidant properties from fresh garlic and extra virgin olive oil."
    ],
    nutrients: {
      calories: "380 kcal",
      protein: "8g",
      carbs: "65g",
      fat: "12g"
    }
  },
  steps: [
    { label: 'AROMATIC INFUSION', durationSeconds: 120, instruction: 'Sauté finely diced shallots and garlic in olive oil until translucent and fragrant.' },
    { label: 'GRAIN PREPARATION', durationSeconds: 300, instruction: 'Add Arborio rice and toast lightly until the edges are pearlescent.' },
    { label: 'SLOW REDUCTION', durationSeconds: 600, instruction: 'Gradually add warm vegetable stock, stirring continuously to release starches.' },
    { label: 'FINISHING TOUCHES', durationSeconds: 180, instruction: 'Fold in blanched greens and a touch of lemon zest for brightness.' }
  ]
};

export const DUMMY_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'The Green Atrium', rating: 4.9, deliveryTime: '25-35 min', priceLevel: '$$$', cuisine: ['Gourmet', 'Vegan'], description: 'Elevated plant-based dining focusing on local seasonal harvests.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b?auto=format&fit=crop&q=80&w=800' },
  { id: 'r2', name: 'Sage & Saffron', rating: 4.7, deliveryTime: '15-20 min', priceLevel: '$$', cuisine: ['Artisanal', 'Vegetarian'], description: 'Rustic interiors with a focus on ancient grains and fermentation.', imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800' },
  { id: 'r3', name: 'Rooted Kitchen', rating: 4.7, deliveryTime: '15-25 min', priceLevel: '$$', cuisine: ['Cold Pressed', 'Bowls'], description: 'Fresh, vibrant ingredients prepared with minimal processing to maintain vitality.', imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800' }
];

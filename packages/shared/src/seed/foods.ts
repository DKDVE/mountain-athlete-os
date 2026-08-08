export interface FoodSeed {
  id: string;
  name: string;
  unitLabel: string;
  proteinG: number;
  kcal: number;
  sort: number;
}

export const STAPLE_FOODS: FoodSeed[] = [
  { id: 'chicken-breast', name: 'Chicken breast', unitLabel: 'katori', proteinG: 28, kcal: 165, sort: 1 },
  { id: 'eggs', name: 'Eggs (2 whole)', unitLabel: 'serving', proteinG: 12, kcal: 140, sort: 2 },
  { id: 'paneer', name: 'Paneer', unitLabel: 'katori', proteinG: 18, kcal: 260, sort: 3 },
  { id: 'greek-yogurt', name: 'Greek yogurt', unitLabel: '250ml', proteinG: 15, kcal: 120, sort: 4 },
  { id: 'whey-protein', name: 'Whey protein', unitLabel: 'scoop', proteinG: 24, kcal: 120, sort: 5 },
  { id: 'dal', name: 'Dal (lentils)', unitLabel: 'katori', proteinG: 12, kcal: 180, sort: 6 },
  { id: 'rice', name: 'Rice (cooked)', unitLabel: 'katori', proteinG: 4, kcal: 200, sort: 7 },
  { id: 'oats', name: 'Oats', unitLabel: 'scoop', proteinG: 5, kcal: 150, sort: 8 },
  { id: 'milk', name: 'Milk', unitLabel: '250ml', proteinG: 8, kcal: 150, sort: 9 },
  { id: 'mixed-nuts', name: 'Mixed nuts', unitLabel: 'handful', proteinG: 6, kcal: 180, sort: 10 },
  { id: 'fish-fillet', name: 'Fish fillet', unitLabel: 'katori', proteinG: 25, kcal: 170, sort: 11 },
  { id: 'tofu', name: 'Tofu', unitLabel: 'katori', proteinG: 14, kcal: 140, sort: 12 },
];

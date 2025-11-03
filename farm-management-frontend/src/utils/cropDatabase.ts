export interface CropData {
  name: string;
  category: string;
  growthDays: number;
  wateringFrequency: number;
  weedingFrequency: number;
  fertilizerSchedule: number[];
  pestControlFrequency: number;
  pesticides: string[];
  yieldPerAcre: number;
  optimalTemp: string;
  soilType: string[];
}

export const CROP_DATABASE: Record<string, CropData> = {
  'Maize': {
    name: 'Maize',
    category: 'Cereal',
    growthDays: 90,
    wateringFrequency: 7,
    weedingFrequency: 21,
    fertilizerSchedule: [21, 42, 63],
    pestControlFrequency: 14,
    pesticides: ['Cypermethrin', 'Lambda-cyhalothrin', 'Imidacloprid'],
    yieldPerAcre: 2500,
    optimalTemp: '20-30°C',
    soilType: ['Loam', 'Clay']
  },
  'Wheat': {
    name: 'Wheat',
    category: 'Cereal',
    growthDays: 120,
    wateringFrequency: 12,
    weedingFrequency: 21,
    fertilizerSchedule: [28, 56],
    pestControlFrequency: 21,
    pesticides: ['Mancozeb', 'Propiconazole', 'Chlorpyrifos'],
    yieldPerAcre: 2000,
    optimalTemp: '15-25°C',
    soilType: ['Loam', 'Clay']
  },
  'Rice': {
    name: 'Rice',
    category: 'Cereal',
    growthDays: 105,
    wateringFrequency: 3,
    weedingFrequency: 14,
    fertilizerSchedule: [14, 35, 56],
    pestControlFrequency: 10,
    pesticides: ['Carbofuran', 'Fipronil', 'Tricyclazole'],
    yieldPerAcre: 3000,
    optimalTemp: '25-35°C',
    soilType: ['Clay', 'Silt']
  },
  'Soybeans': {
    name: 'Soybeans',
    category: 'Legume',
    growthDays: 75,
    wateringFrequency: 6,
    weedingFrequency: 14,
    fertilizerSchedule: [14, 35],
    pestControlFrequency: 10,
    pesticides: ['Chlorpyrifos', 'Quinalphos', 'Thiamethoxam'],
    yieldPerAcre: 1800,
    optimalTemp: '20-30°C',
    soilType: ['Loam', 'Sandy']
  },
  'Beans': {
    name: 'Beans',
    category: 'Legume',
    growthDays: 60,
    wateringFrequency: 5,
    weedingFrequency: 14,
    fertilizerSchedule: [14, 35],
    pestControlFrequency: 10,
    pesticides: ['Dimethoate', 'Malathion', 'Cypermethrin'],
    yieldPerAcre: 1500,
    optimalTemp: '18-28°C',
    soilType: ['Loam', 'Sandy']
  },
  'Tomatoes': {
    name: 'Tomatoes',
    category: 'Vegetable',
    growthDays: 80,
    wateringFrequency: 1,
    weedingFrequency: 7,
    fertilizerSchedule: [14, 28, 42, 56],
    pestControlFrequency: 7,
    pesticides: ['Mancozeb', 'Chlorothalonil', 'Imidacloprid', 'Abamectin'],
    yieldPerAcre: 8000,
    optimalTemp: '20-30°C',
    soilType: ['Loam', 'Sandy']
  },
  'Potatoes': {
    name: 'Potatoes',
    category: 'Vegetable',
    growthDays: 90,
    wateringFrequency: 5,
    weedingFrequency: 14,
    fertilizerSchedule: [21, 42],
    pestControlFrequency: 10,
    pesticides: ['Mancozeb', 'Metalaxyl', 'Imidacloprid'],
    yieldPerAcre: 6000,
    optimalTemp: '15-25°C',
    soilType: ['Loam', 'Sandy']
  },
  'Onions': {
    name: 'Onions',
    category: 'Vegetable',
    growthDays: 100,
    wateringFrequency: 4,
    weedingFrequency: 14,
    fertilizerSchedule: [21, 42, 63],
    pestControlFrequency: 14,
    pesticides: ['Mancozeb', 'Chlorpyrifos', 'Thiamethoxam'],
    yieldPerAcre: 5000,
    optimalTemp: '15-25°C',
    soilType: ['Loam', 'Sandy']
  },
  'Cabbage': {
    name: 'Cabbage',
    category: 'Vegetable',
    growthDays: 70,
    wateringFrequency: 3,
    weedingFrequency: 10,
    fertilizerSchedule: [14, 35, 49],
    pestControlFrequency: 7,
    pesticides: ['Cypermethrin', 'Chlorpyrifos', 'Bacillus thuringiensis'],
    yieldPerAcre: 7000,
    optimalTemp: '15-25°C',
    soilType: ['Loam', 'Clay']
  },
  'Carrots': {
    name: 'Carrots',
    category: 'Vegetable',
    growthDays: 75,
    wateringFrequency: 3,
    weedingFrequency: 10,
    fertilizerSchedule: [21, 42],
    pestControlFrequency: 14,
    pesticides: ['Chlorpyrifos', 'Malathion'],
    yieldPerAcre: 4500,
    optimalTemp: '15-25°C',
    soilType: ['Sandy', 'Loam']
  },
  'Cotton': {
    name: 'Cotton',
    category: 'Cash Crop',
    growthDays: 150,
    wateringFrequency: 10,
    weedingFrequency: 21,
    fertilizerSchedule: [28, 56, 84],
    pestControlFrequency: 10,
    pesticides: ['Cypermethrin', 'Imidacloprid', 'Profenofos'],
    yieldPerAcre: 800,
    optimalTemp: '25-35°C',
    soilType: ['Loam', 'Clay']
  },
  'Sugarcane': {
    name: 'Sugarcane',
    category: 'Cash Crop',
    growthDays: 365,
    wateringFrequency: 7,
    weedingFrequency: 28,
    fertilizerSchedule: [30, 60, 90, 120],
    pestControlFrequency: 21,
    pesticides: ['Chlorpyrifos', 'Imidacloprid', 'Carbofuran'],
    yieldPerAcre: 35000,
    optimalTemp: '25-35°C',
    soilType: ['Loam', 'Clay']
  },
  'Coffee': {
    name: 'Coffee',
    category: 'Cash Crop',
    growthDays: 270,
    wateringFrequency: 7,
    weedingFrequency: 28,
    fertilizerSchedule: [60, 120, 180],
    pestControlFrequency: 21,
    pesticides: ['Copper oxychloride', 'Imidacloprid', 'Chlorpyrifos'],
    yieldPerAcre: 1200,
    optimalTemp: '15-25°C',
    soilType: ['Loam', 'Clay']
  },
  'Tea': {
    name: 'Tea',
    category: 'Cash Crop',
    growthDays: 180,
    wateringFrequency: 5,
    weedingFrequency: 21,
    fertilizerSchedule: [45, 90, 135],
    pestControlFrequency: 14,
    pesticides: ['Copper oxychloride', 'Quinalphos', 'Imidacloprid'],
    yieldPerAcre: 2000,
    optimalTemp: '20-30°C',
    soilType: ['Loam', 'Clay']
  },
  'Sunflower': {
    name: 'Sunflower',
    category: 'Oilseed',
    growthDays: 90,
    wateringFrequency: 7,
    weedingFrequency: 21,
    fertilizerSchedule: [21, 42],
    pestControlFrequency: 14,
    pesticides: ['Chlorpyrifos', 'Imidacloprid', 'Cypermethrin'],
    yieldPerAcre: 1500,
    optimalTemp: '20-30°C',
    soilType: ['Loam', 'Sandy']
  }
};

export const getCropList = () => Object.keys(CROP_DATABASE).sort();

export const getCropData = (cropName: string): CropData | null => {
  const exactMatch = CROP_DATABASE[cropName];
  if (exactMatch) return exactMatch;
  
  const caseInsensitiveMatch = Object.keys(CROP_DATABASE).find(
    key => key.toLowerCase() === cropName.toLowerCase()
  );
  
  return caseInsensitiveMatch ? CROP_DATABASE[caseInsensitiveMatch] : null;
};

export const calculateHarvestDate = (plantingDate: string, cropName: string): string => {
  const crop = getCropData(cropName);
  if (!crop) return '';
  
  const planting = new Date(plantingDate);
  const harvest = new Date(planting);
  harvest.setDate(harvest.getDate() + crop.growthDays);
  
  return harvest.toISOString().split('T')[0];
};

export const generateMaintenanceSchedule = (plantingDate: string, cropName: string) => {
  const crop = getCropData(cropName);
  if (!crop) return [];
  
  const planting = new Date(plantingDate);
  const schedule = [];
  
  // Watering schedule
  for (let day = crop.wateringFrequency; day < crop.growthDays; day += crop.wateringFrequency) {
    const date = new Date(planting);
    date.setDate(date.getDate() + day);
    schedule.push({
      type: 'Irrigation',
      date: date.toISOString().split('T')[0],
      day: day
    });
  }
  
  // Weeding schedule
  for (let day = crop.weedingFrequency; day < crop.growthDays; day += crop.weedingFrequency) {
    const date = new Date(planting);
    date.setDate(date.getDate() + day);
    schedule.push({
      type: 'Weeding',
      date: date.toISOString().split('T')[0],
      day: day
    });
  }
  
  // Fertilizer schedule
  crop.fertilizerSchedule.forEach(day => {
    const date = new Date(planting);
    date.setDate(date.getDate() + day);
    schedule.push({
      type: 'Fertilizer',
      date: date.toISOString().split('T')[0],
      day: day
    });
  });
  
  // Pest control schedule
  for (let day = crop.pestControlFrequency; day < crop.growthDays; day += crop.pestControlFrequency) {
    const date = new Date(planting);
    date.setDate(date.getDate() + day);
    schedule.push({
      type: 'Pest Control',
      date: date.toISOString().split('T')[0],
      day: day,
      pesticides: crop.pesticides
    });
  }
  
  return schedule.sort((a, b) => a.day - b.day);
};

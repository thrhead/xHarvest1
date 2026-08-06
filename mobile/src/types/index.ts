export type FieldType = 'field' | 'greenhouse';

export type TaskType =
  | 'planting'
  | 'fertilizing'
  | 'spraying'
  | 'harvesting'
  | 'irrigation'
  | 'other';

export type TaskStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface WeatherThresholds {
  rainMm: number;      // varsayılan 5
  windKmh: number;     // varsayılan 15
  minTemp: number;     // varsayılan 5
  maxTemp: number;     // varsayılan 35
}

export interface UserSettings {
  language: 'tr' | 'en';
  notificationHour: number;
  weatherThresholds: WeatherThresholds;
}

export interface Field {
  id: string;
  userId: string;
  name: string;
  type: FieldType;
  location: GeoPoint;
  /** Tarla sınır poligonu (en az 3 nokta). Yoksa sadece pin. */
  polygon?: GeoPoint[];
  areaHectare: number;
  soilType?: string;
  createdAt: Date;
}

export interface Crop {
  id: string;
  userId: string;
  fieldId: string;
  cropTemplateId: string;
  cropName: string;
  variety?: string;
  plantingDate: Date;
  expectedHarvestDate?: Date;
  status: 'planned' | 'active' | 'harvested';
  notes?: string;
}

export interface Task {
  id: string;
  userId: string;
  fieldId: string;
  cropId: string;
  type: TaskType;
  title: string;
  description?: string;
  plannedDate: Date;
  originalDate: Date;
  status: TaskStatus;
  weatherCheckedAt?: Date;
  weatherReason?: string;
  completedAt?: Date;
}

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  precipitationSum: number;
  windSpeedMax: number;
  tempMax: number;
  tempMin: number;
  et0?: number;
  soilMoisture?: number;
}

export interface CropTemplate {
  id: string;
  name: string;
  nameTr: string;
  category: string;
  stages: CropStage[];
  defaultDurationDays: number;
}

export interface CropStage {
  name: string;
  nameTr: string;
  dayOffset: number; // ekimden itibaren
  durationDays: number;
  tasks: {
    type: TaskType;
    title: string;
    titleTr: string;
    description?: string;
  }[];
}

export type InputType = 'fertilizer' | 'pesticide';
export type ApplicationUnit = 'kg' | 'g' | 'L' | 'mL' | 'adet';
export type ApplicationMethod = 'spray' | 'drip' | 'broadcast' | 'foliar' | 'soil' | 'other';

export interface ApplicationLog {
  id: string;
  userId: string;
  fieldId: string;
  cropId?: string;
  taskId?: string;
  inputType: InputType;
  productName: string;
  activeIngredient?: string;
  brand?: string;
  quantity: number;
  unit: ApplicationUnit;
  areaAppliedHa?: number;
  method?: ApplicationMethod;
  appliedAt: Date;
  weatherNote?: string;
  notes?: string;
  createdAt: Date;
}


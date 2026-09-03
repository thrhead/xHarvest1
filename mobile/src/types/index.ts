export type FieldType = 'field' | 'greenhouse';

export type TaskType =
  | 'planting'
  | 'fertilizing'
  | 'fertilization'
  | 'spraying'
  | 'pest_control'
  | 'harvesting'
  | 'harvest'
  | 'irrigation'
  | 'pruning'
  | 'soil_prep'
  | 'field_scouting'
  | 'other';

export type TaskStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface WeatherThresholds {
  rainMm: number;
  windKmh: number;
  minTemp: number;
  maxTemp: number;
}

export interface UserSettings {
  language: 'tr' | 'en';
  notificationHour: number;
  weatherThresholds: WeatherThresholds;
  notificationsEnabled?: boolean;
}

export interface Field {
  id: string;
  userId: string;
  name: string;
  type: FieldType;
  cropName?: string;
  location: GeoPoint;
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
  notes?: string;
  photoUris?: string[];
  postponedUntil?: Date;
  skippedAt?: Date;
  isCustom?: boolean;
  source?: 'crop_plan' | 'manual';
}

export interface DailyWeather {
  date: string;
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
  dayOffset: number;
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
export type ApplicationMethod =
  | 'spray'
  | 'drip'
  | 'broadcast'
  | 'foliar'
  | 'soil'
  | 'other';

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
  /** Pre-harvest interval (gün). İlaç için tipik. */
  phiDays?: number;
  /** Hasat güvenli tarih = appliedAt + phiDays */
  harvestSafeDate?: Date;
  /** Birim maliyet (TRY) — sezon özeti için */
  unitCostTry?: number;
  /** Toplam maliyet (quantity * unitCostTry veya elle) */
  totalCostTry?: number;
}

export type ApplicationLogFilter = {
  fieldId?: string;
  inputType?: InputType;
  from?: Date;
  to?: Date;
  productName?: string;
};

export interface SeasonSummary {
  year: number;
  from: Date;
  to: Date;
  totalApplications: number;
  pesticideCount: number;
  fertilizerCount: number;
  totalCostTry: number;
  byField: {
    fieldId: string;
    fieldName: string;
    count: number;
    costTry: number;
  }[];
  activePhiWarnings: PhiWarning[];
}

export interface PhiWarning {
  logId: string;
  fieldId: string;
  fieldName: string;
  productName: string;
  appliedAt: Date;
  phiDays: number;
  harvestSafeDate: Date;
  daysRemaining: number;
  isBlocked: boolean;
}


/** Stok / depo kalemi */
export interface StockItem {
  id: string;
  userId: string;
  farmId?: string;
  name: string;
  category: 'pesticide' | 'fertilizer' | 'seed' | 'other';
  quantity: number;
  unit: ApplicationUnit;
  minQuantity?: number;
  notes?: string;
  updatedAt: Date;
  createdAt: Date;
}

export type MemberRole = 'owner' | 'agronomist' | 'worker' | 'viewer';

export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  createdAt: Date;
}

export interface FarmMember {
  id: string;
  farmId: string;
  userId: string;
  displayName: string;
  role: MemberRole;
  joinedAt: Date;
}

/** AI hastalık tespiti sonucu (stub / TFLite hazır) */
export interface DiseaseDetectionResult {
  id: string;
  userId: string;
  fieldId?: string;
  imageUri: string;
  predictedLabel: string;
  confidence: number;
  adviceTr: string;
  createdAt: Date;
  modelVersion: string;
}

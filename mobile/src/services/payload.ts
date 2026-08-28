import { CropTemplate } from '../types';
import { getServerBaseUrl } from './firebase';

/**
 * Payload CMS’den ürün şablonlarını çeker.
 * Offline için yerel fallback da mevcut.
 */
export async function fetchCropTemplates(): Promise<CropTemplate[]> {
  try {
    const baseUrl = getServerBaseUrl();
    const res = await fetch(`${baseUrl}/api/crops?limit=50&depth=2`);
    if (!res.ok) throw new Error('CMS yanıt vermedi');
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('JSON formatında yanıt gelmedi');
    const json = await res.json();
    return json.docs.map(mapPayloadCrop);
  } catch (e) {
    console.warn('Payload erişilemedi, yerel şablonlar kullanılıyor', e);
    return LOCAL_CROP_TEMPLATES;
  }
}

function mapPayloadCrop(doc: any): CropTemplate {
  return {
    id: doc.id,
    name: doc.name,
    nameTr: doc.nameTr || doc.name,
    category: doc.category || 'other',
    defaultDurationDays: doc.defaultDurationDays || 120,
    stages: (doc.stages || []).map((s: any) => ({
      name: s.name,
      nameTr: s.nameTr || s.name,
      dayOffset: s.dayOffset,
      durationDays: s.durationDays || 7,
      tasks: (s.tasks || []).map((t: any) => ({
        type: t.type,
        title: t.title,
        titleTr: t.titleTr || t.title,
        description: t.description,
      })),
    })),
  };
}

/** Offline / demo için yerel şablonlar */
export const LOCAL_CROP_TEMPLATES: CropTemplate[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    nameTr: 'Domates',
    category: 'vegetable',
    defaultDurationDays: 110,
    stages: [
      {
        name: 'Seedling',
        nameTr: 'Fide',
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: 'planting', title: 'Transplant seedlings', titleTr: 'Fideleri dik' },
          { type: 'irrigation', title: 'First irrigation', titleTr: 'İlk sulama' },
        ],
      },
      {
        name: 'Vegetative',
        nameTr: 'Vejetatif',
        dayOffset: 25,
        durationDays: 30,
        tasks: [
          { type: 'fertilizing', title: 'Nitrogen fertilizer', titleTr: 'Azotlu gübre' },
          { type: 'spraying', title: 'Preventive spray', titleTr: 'Koruyucu ilaçlama' },
        ],
      },
      {
        name: 'Flowering',
        nameTr: 'Çiçeklenme',
        dayOffset: 55,
        durationDays: 25,
        tasks: [
          { type: 'fertilizing', title: 'Potassium boost', titleTr: 'Potasyum takviyesi' },
          { type: 'spraying', title: 'Blight prevention', titleTr: 'Mildiyö önleme' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 90,
        durationDays: 20,
        tasks: [
          { type: 'harvesting', title: 'First harvest', titleTr: 'İlk hasat' },
          { type: 'harvesting', title: 'Main harvest', titleTr: 'Ana hasat' },
        ],
      },
    ],
  },
  {
    id: 'wheat',
    name: 'Wheat',
    nameTr: 'Buğday',
    category: 'cereal',
    defaultDurationDays: 180,
    stages: [
      {
        name: 'Sowing',
        nameTr: 'Ekim',
        dayOffset: 0,
        durationDays: 10,
        tasks: [
          { type: 'planting', title: 'Sow wheat', titleTr: 'Buğday ek' },
          { type: 'fertilizing', title: 'Base fertilizer', titleTr: 'Taban gübresi' },
        ],
      },
      {
        name: 'Tillering',
        nameTr: 'Kardeşlenme',
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: 'fertilizing', title: 'Top dressing', titleTr: 'Üst gübre' },
          { type: 'spraying', title: 'Herbicide', titleTr: 'Yabancı ot ilacı' },
        ],
      },
      {
        name: 'Heading',
        nameTr: 'Başaklanma',
        dayOffset: 100,
        durationDays: 25,
        tasks: [
          { type: 'spraying', title: 'Fungicide', titleTr: 'Fungisit' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 160,
        durationDays: 15,
        tasks: [
          { type: 'harvesting', title: 'Harvest wheat', titleTr: 'Buğday hasadı' },
        ],
      },
    ],
  },
  {
    id: 'maize',
    name: 'Maize',
    nameTr: 'Mısır',
    category: 'cereal',
    defaultDurationDays: 120,
    stages: [
      {
        name: 'Sowing',
        nameTr: 'Ekim',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'planting', title: 'Sow maize', titleTr: 'Mısır ek' },
          { type: 'fertilizing', title: 'Starter fertilizer', titleTr: 'Başlangıç gübresi' },
        ],
      },
      {
        name: 'Vegetative',
        nameTr: 'Vejetatif',
        dayOffset: 20,
        durationDays: 40,
        tasks: [
          { type: 'fertilizing', title: 'Side dress N', titleTr: 'Azot gübrelemesi' },
          { type: 'irrigation', title: 'Critical irrigation', titleTr: 'Kritik sulama' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 100,
        durationDays: 20,
        tasks: [
          { type: 'harvesting', title: 'Harvest maize', titleTr: 'Mısır hasadı' },
        ],
      },
    ],
  },
];

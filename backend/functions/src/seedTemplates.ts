/**
 * cropTemplates koleksiyonuna örnek şablonları yazar.
 * Bir kez çalıştırın (Firebase Functions shell veya tek seferlik script).
 *
 * Kullanım (emulator veya deploy sonrası):
 *   npx ts-node src/seedTemplates.ts
 * veya Functions shell içinde import edip seedCropTemplates() çağırın.
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const TEMPLATES = [
  {
    id: "tomato",
    name: "Tomato",
    nameTr: "Domates",
    category: "vegetable",
    defaultDurationDays: 110,
    stages: [
      {
        name: "Seedling",
        nameTr: "Fide",
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: "planting", title: "Transplant seedlings", titleTr: "Fideleri dik" },
          { type: "irrigation", title: "First irrigation", titleTr: "İlk sulama" },
        ],
      },
      {
        name: "Vegetative",
        nameTr: "Vejetatif",
        dayOffset: 25,
        durationDays: 30,
        tasks: [
          { type: "fertilizing", title: "Nitrogen fertilizer", titleTr: "Azotlu gübre" },
          { type: "spraying", title: "Preventive spray", titleTr: "Koruyucu ilaçlama" },
        ],
      },
      {
        name: "Flowering",
        nameTr: "Çiçeklenme",
        dayOffset: 55,
        durationDays: 25,
        tasks: [
          { type: "fertilizing", title: "Potassium boost", titleTr: "Potasyum takviyesi" },
          { type: "spraying", title: "Blight prevention", titleTr: "Mildiyö önleme" },
        ],
      },
      {
        name: "Harvest",
        nameTr: "Hasat",
        dayOffset: 90,
        durationDays: 20,
        tasks: [
          { type: "harvesting", title: "First harvest", titleTr: "İlk hasat" },
          { type: "harvesting", title: "Main harvest", titleTr: "Ana hasat" },
        ],
      },
    ],
  },
  {
    id: "wheat",
    name: "Wheat",
    nameTr: "Buğday",
    category: "cereal",
    defaultDurationDays: 180,
    stages: [
      {
        name: "Sowing",
        nameTr: "Ekim",
        dayOffset: 0,
        durationDays: 10,
        tasks: [
          { type: "planting", title: "Sow wheat", titleTr: "Buğday ek" },
          { type: "fertilizing", title: "Base fertilizer", titleTr: "Taban gübresi" },
        ],
      },
      {
        name: "Tillering",
        nameTr: "Kardeşlenme",
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: "fertilizing", title: "Top dressing", titleTr: "Üst gübre" },
          { type: "spraying", title: "Herbicide", titleTr: "Yabancı ot ilacı" },
        ],
      },
      {
        name: "Heading",
        nameTr: "Başaklanma",
        dayOffset: 100,
        durationDays: 25,
        tasks: [{ type: "spraying", title: "Fungicide", titleTr: "Fungisit" }],
      },
      {
        name: "Harvest",
        nameTr: "Hasat",
        dayOffset: 160,
        durationDays: 15,
        tasks: [{ type: "harvesting", title: "Harvest wheat", titleTr: "Buğday hasadı" }],
      },
    ],
  },
  {
    id: "maize",
    name: "Maize",
    nameTr: "Mısır",
    category: "cereal",
    defaultDurationDays: 120,
    stages: [
      {
        name: "Sowing",
        nameTr: "Ekim",
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: "planting", title: "Sow maize", titleTr: "Mısır ek" },
          { type: "fertilizing", title: "Starter fertilizer", titleTr: "Başlangıç gübresi" },
        ],
      },
      {
        name: "Vegetative",
        nameTr: "Vejetatif",
        dayOffset: 20,
        durationDays: 40,
        tasks: [
          { type: "fertilizing", title: "Side dress N", titleTr: "Azot gübrelemesi" },
          { type: "irrigation", title: "Critical irrigation", titleTr: "Kritik sulama" },
        ],
      },
      {
        name: "Harvest",
        nameTr: "Hasat",
        dayOffset: 100,
        durationDays: 20,
        tasks: [{ type: "harvesting", title: "Harvest maize", titleTr: "Mısır hasadı" }],
      },
    ],
  },
];

export async function seedCropTemplates() {
  for (const t of TEMPLATES) {
    const { id, ...data } = t;
    await db.collection("cropTemplates").doc(id).set(data, { merge: true });
    console.log("Seeded:", id);
  }
  console.log("Tamamlandı.");
}

// Doğrudan çalıştırılırsa
if (require.main === module) {
  seedCropTemplates()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

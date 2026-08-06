/**
 * Ürün şablonlarını ve rehberleri seed eder.
 * Kullanım: npm run seed  (CMS monorepo / cms klasöründe)
 */

import { getPayload } from 'payload'
import config from '../payload.config'

const CROPS_TEMPLATES = [
  {
    name: 'Tomato',
    nameTr: 'Domates',
    category: 'vegetable',
    defaultDurationDays: 110,
    stages: [
      {
        name: 'Seedling & Transplanting',
        nameTr: 'Fide ve Dikim',
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: 'planting', title: 'Transplant seedlings to soil', titleTr: 'Fideleri toprağa dik', description: 'Fideler 15-20 cm boylandığında toprağa aktarılır ve can suyu verilir.' },
          { type: 'irrigation', title: 'Initial irrigation', titleTr: 'Can suyu sulaması', description: 'Toprağın nemli kalması sağlanır.' },
        ],
      },
      {
        name: 'Vegetative Growth',
        nameTr: 'Vejetatif Gelişme',
        dayOffset: 25,
        durationDays: 30,
        tasks: [
          { type: 'fertilizing', title: 'Nitrogen & Phosphorus boost', titleTr: 'Azot ve Fosforlu Gübreleme', description: 'Kök ve gövde gelişimi için taban gübresi desteklenir.' },
          { type: 'spraying', title: 'Preventive pest spray', titleTr: 'Koruyucu İlaçlama', description: 'Kırmızı örümcek ve yaprak biti kontrolü yapılır.' },
          { type: 'other', title: 'Pruning & Staking', titleTr: 'Budama ve Askıya Alma', description: 'Koltuk budaması yapılarak ana gövde desteklenir.' },
        ],
      },
      {
        name: 'Flowering & Fruit Set',
        nameTr: 'Çiçeklenme ve Meyve Tutumu',
        dayOffset: 55,
        durationDays: 25,
        tasks: [
          { type: 'fertilizing', title: 'Potassium & Calcium application', titleTr: 'Potasyum ve Kalsiyum Desteği', description: 'Meyve kalitesi ve çiçek burnu çürüklüğünü önlemek için kalsiyum verilir.' },
          { type: 'spraying', title: 'Blight & Mildew control', titleTr: 'Mildiyö ve Erken Yaprak Yanıklığı Önleme', description: 'Rutubetli havalarda fungisit uygulaması yapılır.' },
        ],
      },
      {
        name: 'Ripening & Harvest',
        nameTr: 'Olgunlaşma ve Hasat',
        dayOffset: 80,
        durationDays: 30,
        tasks: [
          { type: 'harvesting', title: 'First harvest pass', titleTr: 'İlk Hasat Periyodu', description: 'Kızaran domatesler kademeli olarak toplanır.' },
          { type: 'harvesting', title: 'Main harvest', titleTr: 'Ana Hasat Periyodu', description: 'Tam olgunluğa erişen ürünler toplanarak pazara hazırlanır.' },
        ],
      },
    ],
  },
  {
    name: 'Pepper',
    nameTr: 'Biber',
    category: 'vegetable',
    defaultDurationDays: 100,
    stages: [
      {
        name: 'Transplanting',
        nameTr: 'Fide Dikimi',
        dayOffset: 0,
        durationDays: 20,
        tasks: [
          { type: 'planting', title: 'Plant pepper seedlings', titleTr: 'Biber fidelerini dik', description: 'Sıra üzeri 35-40 cm mesafe ile dikim yapılır.' },
          { type: 'irrigation', title: 'First deep irrigation', titleTr: 'İlk can suyu', description: 'Köklerin tutunması için bol sulama yapılır.' },
        ],
      },
      {
        name: 'Growth & Flowering',
        nameTr: 'Gelişme ve Çiçeklenme',
        dayOffset: 20,
        durationDays: 35,
        tasks: [
          { type: 'fertilizing', title: 'Balanced NPK fertigation', titleTr: 'Dengeli NPK Gübrelemesi', description: 'Damlama ile dengeli besin verilir.' },
          { type: 'spraying', title: 'Thrips and aphid check', titleTr: 'Thrips ve Yaprak Biti Mücadelesi', description: 'Çiçek döneminde thrips kontrolü kritiktir.' },
        ],
      },
      {
        name: 'Harvesting',
        nameTr: 'Hasat Dönemi',
        dayOffset: 55,
        durationDays: 45,
        tasks: [
          { type: 'harvesting', title: 'Continuous selective harvest', titleTr: 'Kademeli Biber Hasadı', description: '7-10 günde bir yeşil ve ergin biberler toplanır.' },
        ],
      },
    ],
  },
  {
    name: 'Cucumber',
    nameTr: 'Salatalık (Hıyar)',
    category: 'vegetable',
    defaultDurationDays: 70,
    stages: [
      {
        name: 'Sowing & Germination',
        nameTr: 'Ekim ve Çimlenme',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'planting', title: 'Sow cucumber seeds', titleTr: 'Salatalık Tohumu/Fidesi Dikimi', description: 'Sıcak toprağa dikim yapılır.' },
          { type: 'irrigation', title: 'Regular moisture upkeep', titleTr: 'Düzenli Nem Sulaması', description: 'Toprak nemli tutulur.' },
        ],
      },
      {
        name: 'Vining & Flowering',
        nameTr: 'Kollanma ve Çiçeklenme',
        dayOffset: 15,
        durationDays: 25,
        tasks: [
          { type: 'fertilizing', title: 'Potassium-rich fertigation', titleTr: 'Potasyum Ağırlıklı Gübreleme', description: 'Meyve tutumu artırılır.' },
          { type: 'spraying', title: 'Powdery mildew control', titleTr: 'Külleme İlaçlaması', description: 'Yapraklarda beyaz lekeler oluşmadan önlem alınır.' },
        ],
      },
      {
        name: 'Frequent Harvest',
        nameTr: 'Yoğun Hasat',
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: 'harvesting', title: 'Daily / bi-daily picking', titleTr: 'Günlük Hasat', description: 'Salatalıklar kartlaşmadan 2 günde bir toplanır.' },
        ],
      },
    ],
  },
  {
    name: 'Wheat',
    nameTr: 'Buğday',
    category: 'cereal',
    defaultDurationDays: 210,
    stages: [
      {
        name: 'Sowing & Germination',
        nameTr: 'Ekim ve Çimlenme',
        dayOffset: 0,
        durationDays: 20,
        tasks: [
          { type: 'planting', title: 'Sow wheat seeds', titleTr: 'Buğday Tohum Ekimi', description: 'Mibzer ile uygun derinlikte ekim gerçekleştirilir.' },
          { type: 'fertilizing', title: 'Base fertilizer (DAP/NPK)', titleTr: 'Taban Gübresi (DAP)', description: 'Ekimle birlikte taban gübresi verilir.' },
        ],
      },
      {
        name: 'Tillering & Overwintering',
        nameTr: 'Kardeşlenme ve Kışlama',
        dayOffset: 40,
        durationDays: 60,
        tasks: [
          { type: 'fertilizing', title: 'First top dressing (Urea)', titleTr: 'Birinci Üst Gübreleme (Üre)', description: 'Erken ilkbaharda kardeşlenmeyi artırmak için verilir.' },
          { type: 'spraying', title: 'Weed control spraying', titleTr: 'Yabancı Ot İlaçlaması', description: 'Geniş ve dar yapraklı otlara karşı ot ilacı atılır.' },
        ],
      },
      {
        name: 'Jointing & Heading',
        nameTr: 'Sapa Kalkma ve Başaklanma',
        dayOffset: 120,
        durationDays: 45,
        tasks: [
          { type: 'fertilizing', title: 'Second top dressing (AN)', titleTr: 'İkinci Üst Gübreleme (Nitrat)', description: 'Sapa kalkma döneminde verim için nitrat atılır.' },
          { type: 'spraying', title: 'Fungicide protection', titleTr: 'Pas ve Sinek İlaçlaması', description: 'Sarı pas ve yaprak bitlerine karşı koruma yapılır.' },
        ],
      },
      {
        name: 'Grain Filling & Harvest',
        nameTr: 'Dane Doldurma ve Hasat',
        dayOffset: 165,
        durationDays: 45,
        tasks: [
          { type: 'harvesting', title: 'Combine harvester operation', titleTr: 'Biçerdöver ile Buğday Hasadı', description: 'Dane nem oranı %13 altına düştüğünde biçim yapılır.' },
        ],
      },
    ],
  },
  {
    name: 'Maize',
    nameTr: 'Mısır',
    category: 'cereal',
    defaultDurationDays: 130,
    stages: [
      {
        name: 'Sowing',
        nameTr: 'Ekim ve Çıkış',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'planting', title: 'Precision seed sowing', titleTr: 'Havalı Mibzerle Mısır Ekimi', description: 'Sıra arası 70 cm, sıra üzeri 15-18 cm olacak şekilde ekilir.' },
          { type: 'fertilizing', title: 'Starter base fertilizer', titleTr: 'Taban Gübrelemesi', description: 'Kompoze gübre tohuma yakın bant şeklinde verilir.' },
        ],
      },
      {
        name: 'Vegetative & Ara Çapa',
        nameTr: 'Gelişme ve Ara Çapa',
        dayOffset: 20,
        durationDays: 40,
        tasks: [
          { type: 'fertilizing', title: 'Side dress Nitrogen (Urea)', titleTr: 'Boğaz Doldurma ve Üre Gübresi', description: 'Bitki 40-50 cm olduğunda üre verilip boğaz doldurulur.' },
          { type: 'irrigation', title: 'First main irrigation', titleTr: 'İlk Asıl Sulama', description: 'Su ihtiyacının başladığı dönemde sulama yapılır.' },
        ],
      },
      {
        name: 'Tasseling & Silking',
        nameTr: 'Püskül Çıkarma ve Tozlaşma',
        dayOffset: 60,
        durationDays: 30,
        tasks: [
          { type: 'irrigation', title: 'Critical tassel irrigation', titleTr: 'Püskül Dönemi Kritik Sulama', description: 'Su stresi verimi doğrudan düşürür, düzenli sulanır.' },
          { type: 'spraying', title: 'Corn borer treatment', titleTr: 'Koçan Kurdu Mücadelesi', description: 'Zararlı görüldüğünde ruhsatlı ilaç atılır.' },
        ],
      },
      {
        name: 'Ripening & Harvest',
        nameTr: 'Olgunlaşma ve Hasat',
        dayOffset: 90,
        durationDays: 40,
        tasks: [
          { type: 'harvesting', title: 'Grain / Silage harvest', titleTr: 'Mısır Hasadı', description: 'Dane mısır nem oranına göre biçerdöverle toplanır.' },
        ],
      },
    ],
  },
  {
    name: 'Olive',
    nameTr: 'Zeytin',
    category: 'fruit',
    defaultDurationDays: 365,
    stages: [
      {
        name: 'Spring Awakening & Pruning',
        nameTr: 'İlkbahar Uyanışı ve Budama',
        dayOffset: 0,
        durationDays: 45,
        tasks: [
          { type: 'other', title: 'Annual pruning', titleTr: 'Ağaç Budaması ve Havalandırma', description: 'Kuru ve sık dallar temizlenir.' },
          { type: 'fertilizing', title: 'Organic & Mineral fertilization', titleTr: 'Kış/İlkbahar Gübrelemesi', description: 'Kalsiyum nitrat ve kompoze gübre verilir.' },
          { type: 'spraying', title: 'Bordeaux mixture application', titleTr: 'Bordo Bulamacı Uygulaması', description: 'Halkalı leke hastalığına karşı %1.5 luk bordo bulamacı atılır.' },
        ],
      },
      {
        name: 'Flowering & Fruit Set',
        nameTr: 'Çiçeklenme ve Meyve Bağlama',
        dayOffset: 45,
        durationDays: 60,
        tasks: [
          { type: 'fertilizing', title: 'Foliar Boron & Zinc spray', titleTr: 'Yapraktan Bor ve Çinko Desteği', description: 'Çiçek tutumunu artırmak için yaprak gübresi atılır.' },
          { type: 'irrigation', title: 'Summer irrigation cycle', titleTr: 'Yaz Sulamaları', description: 'Çekirdek sertleşme döneminde su verilir.' },
        ],
      },
      {
        name: 'Fruit Growth & Pest Control',
        nameTr: 'Meyve Büyütme ve Sinekle Mücadele',
        dayOffset: 105,
        durationDays: 90,
        tasks: [
          { type: 'spraying', title: 'Olive fruit fly monitoring', titleTr: 'Zeytin Sineği Tuzak ve İlaçlaması', description: 'Tuzak sayılarına göre zeytin sineği mücadelesi yapılır.' },
        ],
      },
      {
        name: 'Harvesting & Oil Pressing',
        nameTr: 'Hasat ve Sıkım',
        dayOffset: 250,
        durationDays: 60,
        tasks: [
          { type: 'harvesting', title: 'Early / Main harvest', titleTr: 'Zeytin Hasadı', description: 'Dip zeytini ile dal zeytini karıştırılmadan toplanır.' },
        ],
      },
    ],
  },
  {
    name: 'Apple',
    nameTr: 'Elma',
    category: 'fruit',
    defaultDurationDays: 200,
    stages: [
      {
        name: 'Dormancy Break & Pruning',
        nameTr: 'Budama ve Göz Kabarma',
        dayOffset: 0,
        durationDays: 30,
        tasks: [
          { type: 'other', title: 'Winter pruning', titleTr: 'Kış Budaması', description: 'Ağaç tacı şekillendirilir.' },
          { type: 'spraying', title: 'Copper spray', titleTr: 'Bakırlı İlaçlama', description: 'Kara lekeye karşı önleyici bakır uygulaması yapılır.' },
        ],
      },
      {
        name: 'Pink Bud & Flowering',
        nameTr: 'Pembe Tomurcuk ve Çiçeklenme',
        dayOffset: 30,
        durationDays: 30,
        tasks: [
          { type: 'spraying', title: 'Apple scab prevention', titleTr: 'Elma Kara Lekesi İlaçlaması', description: 'Hassas pembe tomurcuk döneminde fungisit kullanılır.' },
        ],
      },
      {
        name: 'Fruit Thinning & Growth',
        nameTr: 'Meyve Seyreltme ve Gelişme',
        dayOffset: 60,
        durationDays: 70,
        tasks: [
          { type: 'other', title: 'Manual / Chemical thinning', titleTr: 'Meyve Seyreltme', description: 'Kaliteli elma elde etmek için hüzme başı 1-2 meyve bırakılır.' },
          { type: 'spraying', title: 'Codling moth spray', titleTr: 'Elma İç Kurdu Mücadelesi', description: 'Tahmin uyarı sistemine göre ilaçlama yapılır.' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 130,
        durationDays: 45,
        tasks: [
          { type: 'harvesting', title: 'Selective hand picking', titleTr: 'El Elle Hasadı', description: 'Meyve sapı kırılmadan zedelenmeden toplanır ve kasalanır.' },
        ],
      },
    ],
  },
]

const GUIDES_TEMPLATES = [
  {
    title: 'Drip Irrigation Setup and Maintenance Guide',
    titleTr: 'Damla Sulama Sistemi Kurulumu ve Bakım Rehberi',
    slug: 'damla-sulama-kurulumu-ve-bakimi',
    category: 'irrigation',
    summary: 'Tarımda su tasarrufu sağlayan damla sulama sistemlerinin doğru boru serimi, filtre temizliği ve basınç ayarları rehberi.',
    relatedCropNames: ['Domates', 'Biber', 'Salatalık (Hıyar)', 'Mısır'],
  },
  {
    title: 'Organic Fertilization & Compost Application',
    titleTr: 'Organik Gübreleme ve Kompost Kullanım Teknikleri',
    slug: 'organik-gubreleme-ve-kompost-teknikleri',
    category: 'fertilizing',
    summary: 'Toprak yapısını iyileştiren, humik asit ve kompost destekli sürdürülebilir gübreleme programları.',
    relatedCropNames: ['Domates', 'Zeytin', 'Elma', 'Biber'],
  },
  {
    title: 'Integrated Pest Management Against Fungal Blight',
    titleTr: 'Mantar Hastalıkları ve Mildiyö ile Mücadele',
    slug: 'mantar-hastaliklari-ve-mildiyo-mucadelesi',
    category: 'spraying',
    summary: 'Yüksek nemli havalarda domates, biber ve salatalıkta görülen mildiyö ve küllemeye karşı koruyucu ilaçlama takvimi.',
    relatedCropNames: ['Domates', 'Salatalık (Hıyar)', 'Biber'],
  },
  {
    title: 'Soil Preparation and Base Nutrition Before Sowing',
    titleTr: 'Ekim Öncesi Toprak Hazırlığı ve Taban Gübrelemesi',
    slug: 'ekim-oncesi-toprak-hazirligi-ve-taban-gubrelemesi',
    category: 'general',
    summary: 'Derin sürüm, ikileme ve taban gübresi (DAP/NPK) ile tohuma ideal çimlenme yatağı hazırlama stratejileri.',
    relatedCropNames: ['Buğday', 'Mısır'],
  },
]

export async function runSeed(payload: any) {
  console.log('Seed işlemi başlatılıyor...')

  const createdCropMap: Record<string, any> = {}

  for (const t of CROPS_TEMPLATES) {
    const existing = await payload.find({
      collection: 'crops',
      where: { nameTr: { equals: t.nameTr } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log('Zaten mevcut:', t.nameTr)
      createdCropMap[t.nameTr] = existing.docs[0].id
      continue
    }
    const created = await payload.create({
      collection: 'crops',
      data: t as any,
    })
    console.log('Ürün eklendi:', t.nameTr)
    createdCropMap[t.nameTr] = created.id
  }

  for (const g of GUIDES_TEMPLATES) {
    const existing = await payload.find({
      collection: 'guides',
      where: { slug: { equals: g.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log('Rehber zaten mevcut:', g.titleTr)
      continue
    }

    const relatedIds = g.relatedCropNames
      .map((name) => createdCropMap[name])
      .filter(Boolean)

    await payload.create({
      collection: 'guides',
      data: {
        title: g.title,
        titleTr: g.titleTr,
        slug: g.slug,
        category: g.category as any,
        summary: g.summary,
        relatedCrop: relatedIds,
      },
    })
    console.log('Rehber eklendi:', g.titleTr)
  }

  // Seed User if not present
  const existingUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'tahir.kahraman85@gmail.com' } },
    limit: 1,
  })
  if (existingUser.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'tahir.kahraman85@gmail.com',
        password: 'Password123!',
        name: 'Tahir Kahraman',
        role: 'admin',
      },
    })
    console.log('Kullanıcı eklendi: tahir.kahraman85@gmail.com (Şifre: Password123!)')
  }

  console.log('Seed işlemi başarıyla tamamlandı!')
}

async function cliSeed() {
  const payload = await getPayload({ config })
  await runSeed(payload)
  if (payload.db && typeof payload.db.destroy === 'function') {
    await payload.db.destroy()
  }
  process.exit(0)
}

if (process.argv[1] && (process.argv[1].includes('seed'))) {
  cliSeed().catch((e) => {
    console.error('Seed hatası:', e)
    process.exit(1)
  })
}


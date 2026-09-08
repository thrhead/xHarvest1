import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DEFAULT_CROPS = [
  {
    id: 'crop-domates',
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
    id: 'crop-biber',
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
    name: 'Wheat',
    id: 'crop-bugday',
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
    name: 'Cucumber',
    id: 'crop-salatalik',
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
    name: 'Maize',
    id: 'crop-misir',
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
        ],
      },
      {
        name: 'Vegetative',
        nameTr: 'Gelişme ve Ara Çapa',
        dayOffset: 20,
        durationDays: 40,
        tasks: [
          { type: 'fertilizing', title: 'Side dress Nitrogen (Urea)', titleTr: 'Boğaz Doldurma ve Üre Gübresi', description: 'Bitki 40-50 cm olduğunda üre verilir.' },
        ],
      },
    ],
  },
  {
    id: 'crop-zeytin',
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
    id: 'crop-elma',
    name: 'Apple',
    nameTr: 'Elma',
    category: 'fruit',
    defaultDurationDays: 210,
    stages: [
      {
        name: 'Dormancy & Pruning',
        nameTr: 'Budama ve Göz Kabarma',
        dayOffset: 0,
        durationDays: 30,
        tasks: [
          { type: 'other', title: 'Winter pruning', titleTr: 'Kış Budaması', description: 'Hava ve ışık geçirgenliği için taç budaması yapılır.' },
          { type: 'spraying', title: 'Dormant copper spray', titleTr: 'Göz Kabarması Bakırlı İlaçlama', description: 'Karasakız ve bakteriyel yanıklığa karşı koruma sağlanır.' },
        ],
      },
      {
        name: 'Flowering',
        nameTr: 'Pembe Tomurcuk ve Çiçeklenme',
        dayOffset: 30,
        durationDays: 30,
        tasks: [
          { type: 'spraying', title: 'Scab & Mildew control', titleTr: 'Elma Karalekesi İlaçlaması', description: 'Pembe tomurcuk ve taç yaprak dökümünde ilaçlama tekrarlanır.' },
          { type: 'fertilizing', title: 'Zinc & Boron application', titleTr: 'Çinko ve Bor Desteği', description: 'Meyve tutumunu ve polen kalitesini artırır.' },
        ],
      },
      {
        name: 'Fruit Growth',
        nameTr: 'Meyve Seyreltme ve Gelişme',
        dayOffset: 60,
        durationDays: 60,
        tasks: [
          { type: 'other', title: 'Fruit thinning', titleTr: 'Meyve Seyreltmesi', description: 'Meyve iriliği için huzmelerde 1-2 meyve bırakılır.' },
          { type: 'spraying', title: 'Codling moth control', titleTr: 'İç Kurdu (Cydia pomonella) Mücadelesi', description: 'Feromon tuzak takibine göre yumurta açılımında ilaçlama yapılır.' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 150,
        durationDays: 45,
        tasks: [
          { type: 'harvesting', title: 'Careful picking', titleTr: 'Elma Hasadı', description: 'Sapıyla birlikte zedelenmeden toplanarak kasalanır.' },
        ],
      },
    ],
  },
  {
    id: 'crop-uzum',
    name: 'Grape',
    nameTr: 'Üzüm',
    category: 'fruit',
    defaultDurationDays: 150,
    stages: [
      {
        name: 'Pruning & Budding',
        nameTr: 'Budama ve Gözlerin Uyanması',
        dayOffset: 0,
        durationDays: 30,
        tasks: [
          { type: 'other', title: 'Vineyard pruning', titleTr: 'Asma Budama', description: 'Kış budaması yapılarak verim dengesi kurulur.' }
        ]
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 90,
        durationDays: 60,
        tasks: [
          { type: 'harvesting', title: 'Grape harvest', titleTr: 'Bağ Bozumu (Hasat)', description: 'Salkımlar uygun şeker oranına ulaştığında makasla kesilerek toplanır.' }
        ]
      }
    ]
  },
  {
    id: 'crop-cilek',
    name: 'Strawberry',
    nameTr: 'Çilek',
    category: 'fruit',
    defaultDurationDays: 90,
    stages: [
      {
        name: 'Planting',
        nameTr: 'Fide Dikimi',
        dayOffset: 0,
        durationDays: 20,
        tasks: [
          { type: 'planting', title: 'Planting runners', titleTr: 'Fide Dikimi', description: 'Malçlanmış sıralara çilek fideleri dikilir.' }
        ]
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 55,
        durationDays: 35,
        tasks: [
          { type: 'harvesting', title: 'Hand picking strawberries', titleTr: 'Çilek Hasadı', description: 'Kızaran çilekler ezilmeden sabah serinliğinde toplanır.' }
        ]
      }
    ]
  },
  {
    id: 'crop-salatalik-basit',
    name: 'Cucumber Simple',
    nameTr: 'Salatalık',
    category: 'vegetable',
    defaultDurationDays: 70,
    stages: [
      {
        name: 'Ekim ve Çimlenme',
        nameTr: 'Ekim ve Çimlenme',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'planting', title: 'Sow seeds', titleTr: 'Tohum / Fide Dikimi', description: 'Toprak nemli tutulur.' }
        ]
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: 'harvesting', title: 'Regular picking', titleTr: 'Salatalık Hasadı', description: '2 günde bir toplama yapılır.' }
        ]
      }
    ]
  },
  {
    id: 'crop-diger',
    name: 'Other',
    nameTr: 'Diğer',
    category: 'other',
    defaultDurationDays: 100,
    stages: [
      {
        name: 'Ekim ve Bakım',
        nameTr: 'Ekim ve Bakım',
        dayOffset: 0,
        durationDays: 50,
        tasks: [
          { type: 'planting', title: 'General planting', titleTr: 'Genel Ekim/Dikim', description: 'Ürünün genel dikimi ve ilk bakımı yapılır.' }
        ]
      },
      {
        name: 'Hasat',
        nameTr: 'Hasat',
        dayOffset: 50,
        durationDays: 50,
        tasks: [
          { type: 'harvesting', title: 'Harvesting', titleTr: 'Hasat Dönemi', description: 'Olgunlaşan ürünlerin toplanması.' }
        ]
      }
    ]
  },
]

const DEFAULT_GUIDES = [
  {
    id: 'guide-1',
    title: 'Drip Irrigation Setup and Maintenance Guide',
    titleTr: 'Damla Sulama Sistemi Kurulumu ve Bakım Rehberi',
    slug: 'damla-sulama-kurulumu-ve-bakimi',
    category: 'irrigation',
    summary: 'Tarımda su tasarrufu sağlayan damla sulama sistemlerinin doğru boru serimi, filtre temizliği ve basınç ayarları rehberi.',
    body: 'Damla sulama sistemlerinde ana hat boruları döşenirken eğim hesabı yapılmalı ve filtre ünitesi haftalık olarak temizlenmelidir. Gübreleme esnasında venturi veya dozaj pompası kullanılarak fertigasyon optimize edilmelidir.',
  },
  {
    id: 'guide-2',
    title: 'Organic Fertilization & Compost Application',
    titleTr: 'Organik Gübreleme ve Kompost Kullanım Teknikleri',
    slug: 'organik-gubreleme-ve-kompost-teknikleri',
    category: 'fertilizing',
    summary: 'Toprak yapısını iyileştiren, humik asit ve kompost destekli sürdürülebilir gübreleme programları.',
    body: 'Kompost ve fermente çiftlik gübresi toprağın mikrobiyal canlılığını ve su tutma kapasitesini artırır. Erken ilkbaharda veya sonbahar sürümünde toprağa karıştırılması önerilir.',
  },
  {
    id: 'guide-3',
    title: 'Integrated Pest Management Against Fungal Blight',
    titleTr: 'Mantar Hastalıkları ve Mildiyö ile Mücadele',
    slug: 'mantar-hastaliklari-ve-mildiyo-mucadelesi',
    category: 'spraying',
    summary: 'Yüksek nemli havalarda domates, biber ve salatalıkta görülen mildiyö ve küllemeye karşı koruyucu ilaçlama takvimi.',
    body: 'Gece ve gündüz sıcaklık farklarının yüksek olduğu, bağıl nemin %80 üzerine çıktığı dönemlerde koruyucu bakırlı fungisitler veya sistemik preparatlar uygulanmalıdır. PHI bekleme sürelerine mutlaka uyulmalıdır.',
  },
  {
    id: 'guide-4',
    title: 'Soil Preparation and Base Nutrition Before Sowing',
    titleTr: 'Ekim Öncesi Toprak Hazırlığı ve Taban Gübrelemesi',
    slug: 'ekim-oncesi-toprak-hazirligi-ve-taban-gubrelemesi',
    category: 'general',
    summary: 'Derin sürüm, ikileme ve taban gübresi (DAP/NPK) ile tohuma ideal çimlenme yatağı hazırlama stratejileri.',
    body: 'Toprak analizi sonuçlarına göre taban gübresi (18-46 DAP veya 15-15-15 kompoze) tohum derinliğinin 5-6 cm altına gelecek şekilde bant usulü verilmelidir.',
  },
]

export async function GET() {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    const [cropsRes, guidesRes] = await Promise.all([
      payload.find({ collection: 'crops', limit: 50, depth: false }).catch(() => ({ docs: [] })),
      payload.find({ collection: 'guides', limit: 50, depth: false }).catch(() => ({ docs: [] })),
    ])

    const crops = cropsRes?.docs?.length ? cropsRes.docs : DEFAULT_CROPS
    const guides = guidesRes?.docs?.length ? guidesRes.docs : DEFAULT_GUIDES

    return NextResponse.json({
      crops,
      guides,
      mode: cropsRes?.docs?.length ? 'cms' : 'embedded',
    })
  } catch {
    return NextResponse.json({
      crops: DEFAULT_CROPS,
      guides: DEFAULT_GUIDES,
      mode: 'embedded',
    })
  }
}


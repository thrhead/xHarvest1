import { CropTemplate } from '../types';
import { resolveApiUrl } from './firebase';

/**
 * Payload CMS’den ürün şablonlarını çeker.
 * Offline veya ağ gecikmesi için yerel 10 ürün şablonu fallback olarak kullanılır.
 */
export async function fetchCropTemplates(): Promise<CropTemplate[]> {
  try {
    const url = resolveApiUrl('/api/crops?limit=50&depth=2');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CMS yanıt vermedi: HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('JSON formatında yanıt gelmedi');
    }
    const json = await res.json();
    if (Array.isArray(json?.docs) && json.docs.length > 0) {
      return json.docs.map(mapPayloadCrop);
    }
    return LOCAL_CROP_TEMPLATES;
  } catch (e) {
    console.warn('[Crops] Payload erişilemedi veya dönüştürme hatası, yerel şablonlar kullanılıyor:', e);
    return LOCAL_CROP_TEMPLATES;
  }
}

export function mapPayloadCrop(doc: any): CropTemplate {
  return {
    id: String(doc.id || doc.nameTr || doc.name),
    name: doc.name || doc.nameTr || '',
    nameTr: doc.nameTr || doc.name || '',
    category: doc.category || 'other',
    defaultDurationDays: typeof doc.defaultDurationDays === 'number' ? doc.defaultDurationDays : 120,
    stages: (doc.stages || []).map((s: any) => {
      let taskList: any[] = [];
      if (typeof s.tasks === 'string' && s.tasks.trim()) {
        try {
          const parsed = JSON.parse(s.tasks);
          taskList = Array.isArray(parsed) ? parsed : [];
        } catch {
          taskList = [{ type: 'other', title: s.tasks, titleTr: s.tasks, description: '' }];
        }
      } else if (Array.isArray(s.tasks)) {
        taskList = s.tasks;
      }
      return {
        name: s.name || s.nameTr || '',
        nameTr: s.nameTr || s.name || '',
        dayOffset: typeof s.dayOffset === 'number' ? s.dayOffset : 0,
        durationDays: typeof s.durationDays === 'number' ? s.durationDays : 14,
        tasks: taskList.map((t: any) => ({
          type: (t.type || 'other') as any,
          title: t.title || t.titleTr || '',
          titleTr: t.titleTr || t.title || '',
          description: t.description || '',
        })),
      };
    }),
  };
}

/** 10 Adet Tam Donanımlı Tarımsal Ürün Şablonu */
export const LOCAL_CROP_TEMPLATES: CropTemplate[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    nameTr: 'Domates',
    category: 'vegetable',
    defaultDurationDays: 120,
    stages: [
      {
        name: 'Soil Preparation & Transplanting',
        nameTr: 'Toprak Hazırlığı ve Fide Dikimi',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'soil_prep', title: 'Base Fertilization & Deep Tillage', titleTr: 'Taban Gübrelemesi ve Derin Sürüm', description: 'Dekara 30-40 kg 15-15-15 kompoze gübre veya organik gübre serilerek toprak 25-30 cm derinlikte sürülür.' },
          { type: 'planting', title: 'Bed Preparation & Seedling Planting', titleTr: 'Masura Hazırlığı ve Fide Dikimi', description: 'Damla sulama hatları çekilir. 4-5 yapraklı sağlıklı fideler sıra üzeri 40-50 cm, sıra arası 80-100 cm olacak şekilde dikilir.' },
          { type: 'irrigation', title: 'Initial Irrigation & Root Protection', titleTr: 'Can Suyu ve Kök Boğazı Koruma', description: 'Dikim hemen sonrasında bol can suyu verilir. Kök çürüklüğü riskine karşı koruyucu kök boğazı fungusiti uygulanır.' },
        ],
      },
      {
        name: 'Rooting & Vegetative Growth',
        nameTr: 'Köklenme ve Vejetatif Gelişme',
        dayOffset: 15,
        durationDays: 25,
        tasks: [
          { type: 'soil_prep', title: 'First Hoeing & Earthing Up', titleTr: '1. Çapa ve Boğaz Doldurma', description: 'Fideler tutunduktan sonra yabancı otları temizlemek ve toprak havalanmasını sağlamak için ilk çapa yapılır.' },
          { type: 'fertilization', title: 'Root Stimulant & Phosphorus Fertigation', titleTr: 'Kök Geliştirici ve Fosforlu Fertigasyon', description: 'Kılcal köklenmeyi hızlandırmak için yüksek fosforlu (10-40-10) gübre ve hümik asit damlama ile verilir.' },
          { type: 'pest_control', title: 'Spider Mite & Leafminer Scouting', titleTr: 'Kırmızı Örümcek ve Yaprak Galeri Sineği Kontrolü', description: 'Yaprak altları düzenli taranır; sarı yapışkan tuzaklar yerleştirilerek zararlı popülasyonu izlenir.' },
        ],
      },
      {
        name: 'Flowering & Fruit Set',
        nameTr: 'Çiçeklenme ve Meyve Tutumu',
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: 'pruning', title: 'Staking & Sucker Pruning', titleTr: 'Askıya Alma ve Koltuk Budaması', description: 'Bitkiler ipe veya sırığa bağlanır. Gövde ve yaprak koltuklarından çıkan obur sürgünler temizlenir.' },
          { type: 'fertilization', title: 'Calcium & Boron-Zinc Foliar Feeding', titleTr: 'Kalsiyum ve Bor-Çinko Yaprak Beslemesi', description: 'Çiçek dökümünü engellemek ve çiçek burnu çürüklüğünü önlemek için yapraktan kalsiyum ve mikro element püskürtülür.' },
          { type: 'pest_control', title: 'Mildew & Early Blight Protection', titleTr: 'Mildiyö ve Erken Yanıklık Koruması', description: 'Phytophthora ve Alternaria mantarlarına karşı koruyucu fungisit uygulanır.' },
        ],
      },
      {
        name: 'Fruit Enlargement & Ripening',
        nameTr: 'Meyve Büyütme ve Olgunlaşma',
        dayOffset: 70,
        durationDays: 30,
        tasks: [
          { type: 'fertilization', title: 'High-Potassium Nutrition', titleTr: 'Potasyum Ağırlıklı Besleme', description: 'Meyve iriliği, sertlik ve kırmızı renk artışı için potasyum nitrat (16-8-34) ve magnezyum takviyesi yapılır.' },
          { type: 'pest_control', title: 'Tuta Absoluta & Fruit Borer Control', titleTr: 'Tuta Absoluta (Domates Güvesi) ve Yeşilkurt Mücadelesi', description: 'Feromon tuzaklar ve meyve delikleri kontrol edilir, ruhsatlı biyolojik veya entegre mücadele preparatları uygulanır.' },
          { type: 'irrigation', title: 'Balanced Drip Irrigation', titleTr: 'Düzenli ve Dengeleyici Sulama', description: 'Meyve çatlamasını önlemek için sulama aralıkları sabit tutulur, ani su dalgalanmalarından kaçınılır.' },
        ],
      },
      {
        name: 'Harvest & Post-Harvest Care',
        nameTr: 'Kademeli Hasat ve Son Bakım',
        dayOffset: 100,
        durationDays: 20,
        tasks: [
          { type: 'harvest', title: 'Selective Morning Harvest', titleTr: 'Sabah Serinliğinde Seçici Hasat', description: 'Pazar mesafesine göre pembe veya tam kızarmış domatesler sabah serinliğinde zedelenmeden toplanır.' },
          { type: 'pruning', title: 'Lower Senescent Leaf Removal', titleTr: 'Yaşlı Dip Yaprakların Alınması', description: 'Hasat edilen salkımların altındaki sararmış yapraklar budanarak üst salkımların ışıklanması artırılır.' },
        ],
      },
    ],
  },
  {
    id: 'pepper',
    name: 'Pepper',
    nameTr: 'Biber',
    category: 'vegetable',
    defaultDurationDays: 120,
    stages: [
      {
        name: 'Transplanting & Root Establishment',
        nameTr: 'Fide Dikimi ve Adaptasyon',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'soil_prep', title: 'Soil Bed Preparation', titleTr: 'Toprak Hazırlığı ve Dikim Yastıkları', description: 'Organik maddece zengin toprağa kompoze taban gübresi verilir. Damla hatları çekilir.' },
          { type: 'planting', title: 'Seedling Planting & First Watering', titleTr: 'Fide Dikimi ve Can Suyu', description: 'Fideler sıra arası 60-70 cm, sıra üzeri 35-40 cm olacak şekilde dikilir, can suyu verilir.' },
          { type: 'pest_control', title: 'Phytophthora Crown Rot Protection', titleTr: 'Kök Boğazı Yanıklığı (Phytophthora) Koruması', description: 'Fide kök boğazı mantarına karşı ilk can suyuyla birlikte koruyucu fungusit uygulaması yapılır.' },
        ],
      },
      {
        name: 'Vegetative Growth & Branching',
        nameTr: 'Vejetatif Büyüme ve Çatallanma',
        dayOffset: 15,
        durationDays: 25,
        tasks: [
          { type: 'soil_prep', title: 'Hoeing & Weed Management', titleTr: 'Sıra Arası Çapa ve Yabancı Ot Temizliği', description: 'Kök havalanmasını sağlamak ve yabancı ot rekabetini kesmek için ilk çapalama yapılır.' },
          { type: 'fertilization', title: 'Balanced NPK & Micronutrient Fertigation', titleTr: 'Dengeli Gelişim Fertigasyonu (20-20-20 + ME)', description: 'Bitkinin güçlü taç yapısı oluşturması ve çatal dallanması için dengeli NPK ve çinko-demir yaprak gübresi verilir.' },
          { type: 'pest_control', title: 'Aphids & Thrips Scouting', titleTr: 'Yaprak Biti (Afid) ve Trips Taraması', description: 'Virüs taşıyıcı afid ve tripslere karşı mavi ve sarı yapışkan tuzaklar asılır.' },
        ],
      },
      {
        name: 'Flowering & Fruit Setting',
        nameTr: 'Çiçeklenme ve Meyve Bağlama',
        dayOffset: 40,
        durationDays: 30,
        tasks: [
          { type: 'fertilization', title: 'Calcium Nitrate & Blossom Support', titleTr: 'Kalsiyum Nitrat ve Çiçek Destekleme', description: 'Biber uçlarındaki çürümeyi önlemek için düzenli kalsiyum takviyesi ve bor-molibden uygulaması yapılır.' },
          { type: 'pest_control', title: 'Powdery Mildew & Bacterial Spot Control', titleTr: 'Biber Külleme ve Bakteriyel Leke Kontrolü', description: 'Yaprak üst yüzeyinde külleme lekeleri veya bakteriyel yanıklık belirtileri takip edilir.' },
          { type: 'irrigation', title: 'Regular Drip Irrigation', titleTr: 'Düzenli Aralıklarla Damla Sulama', description: 'Biber kökleri sığ olduğu için toprak sürekli nemli tutulmalı, aşırı su göllenmesinden kaçınılmalıdır.' },
        ],
      },
      {
        name: 'Fruit Sizing & Harvest Period',
        nameTr: 'Meyve İrileşmesi ve Hasat Periyodu',
        dayOffset: 70,
        durationDays: 50,
        tasks: [
          { type: 'harvest', title: 'Weekly Pepper Harvest', titleTr: 'Kademeli Biber Toplama (Haftalık)', description: 'Meyveler pazar standardı boyut ve et kalınlığına ulaştığında sapı koparılmadan makas veya elle bükülerek toplanır.' },
          { type: 'fertilization', title: 'Post-Harvest Potassium & Nitrogen Boost', titleTr: 'Hasat Arası Potasyum ve Azot Takviyesi', description: 'Toplanan meyvelerin ardından yeni gelen biberlerin büyümesi için potasyum ağırlıklı damlama gübresi verilir.' },
        ],
      },
    ],
  },
  {
    id: 'eggplant',
    name: 'Eggplant',
    nameTr: 'Patlıcan',
    category: 'vegetable',
    defaultDurationDays: 130,
    stages: [
      {
        name: 'Soil Bed Preparation & Planting',
        nameTr: 'Toprak Hazırlığı ve Fide Dikimi',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'soil_prep', title: 'Deep Tillage & Base Fertilization', titleTr: 'Derin Toprak İşleme ve Taban Gübreleme', description: 'Sıcak seven patlıcan için toprak 30 cm derinlikte sürülür, dekara çiftlik gübresi ve kompoze gübre karıştırılır.' },
          { type: 'planting', title: 'Planting & Can Suyu', titleTr: 'Fide Dikimi ve İlk Can Suyu', description: 'Sıra arası 80-100 cm, sıra üzeri 50-60 cm mesafeyle dikilir, bol can suyu verilir.' },
        ],
      },
      {
        name: 'Vegetative Growth & Canopy Pruning',
        nameTr: 'Vejetatif Büyüme ve Taç Şekillendirme',
        dayOffset: 15,
        durationDays: 30,
        tasks: [
          { type: 'pruning', title: 'Lower Shoot & Sucker Pruning', titleTr: 'Çatal Altı Koltuk Alma ve Budama', description: 'İlk ana dallanma (çatal) altındaki yan sürgünler ve dipteki sararan yapraklar budanır.' },
          { type: 'soil_prep', title: 'Earthing Up & Weed Cultivation', titleTr: 'Boğaz Doldurma ve Çapa', description: 'Gövdenin güçlü kök atması ve rüzgara dayanması için boğaz doldurma çapası yapılır.' },
          { type: 'pest_control', title: 'Red Spider Mite & Whitefly Control', titleTr: 'Kırmızı Örümcek ve Beyazsinek Mücadelesi', description: 'Yaprak altı kloroz ve emgi zararları kontrol edilir, akarisit ve sarı yapışkan levhalar uygulanır.' },
        ],
      },
      {
        name: 'Flowering & Fruit Development',
        nameTr: 'Çiçeklenme ve Meyve Tutumu',
        dayOffset: 45,
        durationDays: 35,
        tasks: [
          { type: 'fertilization', title: 'Calcium & Potassium Fertigation', titleTr: 'Kalsiyum ve Potasyum Fertigasyonu', description: 'Meyve etinin sıkı olması ve parlak mor rengi için potasyum ve kalsiyum düzenli verilir.' },
          { type: 'pest_control', title: 'Verticillium Wilt & Mildew Scouting', titleTr: 'Verticillium Solgunluğu ve Külleme Gözlemi', description: 'Tek taraflı yaprak pörsümesi ve solgunluk belirtileri taranır; aşırı sulamadan kaçınılır.' },
        ],
      },
      {
        name: 'Harvest & Market Handling',
        nameTr: 'Hasat ve Pazara Hazırlık',
        dayOffset: 80,
        durationDays: 50,
        tasks: [
          { type: 'harvest', title: 'Regular Sheared Harvest', titleTr: 'Düzenli Makaslı Hasat', description: 'Çekirdek bağlamamış parlak meyveler 2-3 cm sapı ile birlikte bağ makasıyla kesilir.' },
          { type: 'fertilization', title: 'Regenerative Nutrition', titleTr: 'Süreklilik Gübrelemesi ve Sulama', description: 'Her 2 hasat sonrasında bitkiyi genç tutmak için dengeli azot-potasyum gübresi uygulanır.' },
        ],
      },
    ],
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    nameTr: 'Salatalık (Hıyar)',
    category: 'vegetable',
    defaultDurationDays: 85,
    stages: [
      {
        name: 'Planting & Rooting',
        nameTr: 'Ekim / Fide Dikimi ve Köklenme',
        dayOffset: 0,
        durationDays: 12,
        tasks: [
          { type: 'soil_prep', title: 'Moist Soil Prep & Drip Lines', titleTr: 'Tavlı Toprak Hazırlığı ve Damlama Kurulumu', description: 'Gevşek, organik maddece zengin toprağa taban gübresi verilir ve damla sulama hatları çekilir.' },
          { type: 'planting', title: 'Seedling Planting & Can Suyu', titleTr: 'Fide Dikimi ve Can Suyu', description: 'Sıra arası 100 cm, sıra üzeri 40-50 cm aralıkla dikilir. Can suyu ile koruyucu ilaç verilir.' },
        ],
      },
      {
        name: 'Vine Growth & Trellising',
        nameTr: 'Gövde Gelişimi ve İpe Alma',
        dayOffset: 12,
        durationDays: 18,
        tasks: [
          { type: 'pruning', title: 'String Trellising & Base Pruning', titleTr: 'İpe Sarma ve İlk 4-5 Boğum Budaması', description: 'Gövde ipe sarılır. Topraktan ilk 40-50 cm yükseklikteki sürgün ve meyve tomurcukları temizlenir.' },
          { type: 'fertilization', title: 'Rapid Vegetative Fertigation', titleTr: 'Hızlı Gelişim Fertigasyonu (NPK + Magnezyum)', description: 'Hızlı gelişim için 18-18-18 ve magnezyum sülfat damlama ile uygulanır.' },
          { type: 'pest_control', title: 'Spider Mite & Thrips Inspection', titleTr: 'Kırmızı Örümcek ve Thrips Gözlemi', description: 'Hıyar yapraklarında gümüşi lekeler ve ağlar incelenir; sarı/mavi tuzaklar takip edilir.' },
        ],
      },
      {
        name: 'Flowering & Heavy Fruiting',
        nameTr: 'Çiçeklenme ve Yoğun Meyve Tutumu',
        dayOffset: 30,
        durationDays: 20,
        tasks: [
          { type: 'irrigation', title: 'Frequent Irrigation Schedule', titleTr: 'Sık ve Düzenli Sulama Rejimi', description: 'Meyve acılaşmasını ve şekil bozukluğunu önlemek için günlük veya gün aşırı düzenli sulama yapılır.' },
          { type: 'fertilization', title: 'Potassium & Calcium Boost', titleTr: 'Potasyum ve Kalsiyum Desteği', description: 'Düzgün ve gevrek meyve yapısı için potasyum nitrat ve kalsiyum verilir.' },
          { type: 'pest_control', title: 'Downy Mildew & Powdery Mildew Spray', titleTr: 'Yalancı Mildiyö ve Külleme İlaçlaması', description: 'Yaprak sararmaları ve unlu küf tabakasına karşı koruyucu fungisit püskürtülür.' },
        ],
      },
      {
        name: 'Peak Harvest Period',
        nameTr: 'Yoğun Hasat Dönemi',
        dayOffset: 50,
        durationDays: 35,
        tasks: [
          { type: 'harvest', title: 'Alternate Day Harvest', titleTr: 'Gün Aşırı Düzenli Hasat', description: 'Meyvelerin kartlaşmaması için 2 günde bir sabah serinliğinde hasat yapılır.' },
          { type: 'pruning', title: 'Lower Old Leaf Pruning', titleTr: 'Kartlaşmış Dip Yaprakların Temizliği', description: 'Havasızlığı önlemek için alt kısımdaki sararmış yapraklar toplanır.' },
        ],
      },
    ],
  },
  {
    id: 'wheat',
    name: 'Wheat',
    nameTr: 'Buğday',
    category: 'cereal',
    defaultDurationDays: 220,
    stages: [
      {
        name: 'Seedbed Preparation & Sowing',
        nameTr: 'Tohum Yatağı Hazırlığı ve Ekim',
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: 'soil_prep', title: 'Base Fertilizer & Tillage', titleTr: 'Taban Gübrelemesi (DAP / 20-20-0) ve Sürüm', description: 'Dekara 15-20 kg DAP veya 20-20-0 kompoze gübre atılarak ikileme ve tırmık çekilir.' },
          { type: 'planting', title: 'Certified Seed Drill Sowing', titleTr: 'Sertifikalı Tohum ile Mibzerle Ekim', description: 'İlaçlanmış sertifikalı buğday tohumu mibzerle 4-5 cm derinliğe ekilir (18-22 kg/da).' },
        ],
      },
      {
        name: 'Emergence & Tillering',
        nameTr: 'Çıkış ve Kardeşlenme',
        dayOffset: 25,
        durationDays: 60,
        tasks: [
          { type: 'field_scouting', title: 'Emergence & Tillering Assessment', titleTr: 'Çıkış Sayımı ve Kardeşlenme Kontrolü', description: 'Metrekaredeki bitki sayısı ve kardeşlenme kapasitesi kontrol edilir.' },
          { type: 'pest_control', title: 'Broadleaf & Grass Weed Herbicide', titleTr: 'Geniş ve Dar Yapraklı Yabancı Ot Mücadelesi', description: 'Kardeşlenme sonuna kadar yabancı ot yoğunluğuna göre uygun herbisit uygulanır.' },
        ],
      },
      {
        name: 'Stem Elongation & Topdressing',
        nameTr: 'Sapa Kalkma ve Üst Gübreleme',
        dayOffset: 85,
        durationDays: 40,
        tasks: [
          { type: 'fertilization', title: 'Nitrogen Topdressing (Urea / CAN)', titleTr: '1. ve 2. Üst Gübreleme (Üre / Nitrat)', description: 'İlkbaharda yağış öncesi dekara 10-15 kg Üre (%46 N) veya Amonyum Nitrat saçılır.' },
          { type: 'pest_control', title: 'Yellow Rust & Powdery Mildew Spray', titleTr: 'Sarı Pas ve Külleme İlaçlaması', description: 'Sarı pas ve septorya lekesine karşı bayrak yaprak koruma fungisiti atılır.' },
          { type: 'field_scouting', title: 'Overwintered Sunn Pest Scouting', titleTr: 'Kışlamış Süne Ergin Sayımı', description: 'Tarlada metrekarede kışlamış ergin süne sayımı yapılarak eşik değerler takip edilir.' },
        ],
      },
      {
        name: 'Heading, Flowering & Grain Filling',
        nameTr: 'Başaklanma ve Tane Dolumu',
        dayOffset: 125,
        durationDays: 45,
        tasks: [
          { type: 'pest_control', title: 'Sunn Pest Nymph Spraying', titleTr: 'Süne Nimf İlaçlaması', description: 'Metrekarede 10 adet ve üzeri nimf görüldüğünde süne emgisini önlemek için ilaçlama yapılır.' },
          { type: 'fertilization', title: 'Zinc & Urea Foliar Application', titleTr: 'Çinko ve Üre Yaprak Takviyesi', description: 'Tane protein oranını ve hektolitre ağırlığını artırmak için yapraktan sıvı çinko ve üre uygulanır.' },
          { type: 'irrigation', title: 'Grain Milk Stage Irrigation', titleTr: 'İmkan Varsa Süt Olum Sulaması', description: 'Sulanan alanlarda dane dolumunu azamiye çıkarmak için süt olum döneminde 1 su verilir.' },
        ],
      },
      {
        name: 'Ripening & Combine Harvest',
        nameTr: 'Sarı/Tam Olum ve Hasat',
        dayOffset: 170,
        durationDays: 50,
        tasks: [
          { type: 'field_scouting', title: 'Grain Moisture Testing', titleTr: 'Tane Nem Kontrolü (%13-14)', description: 'Tane neminin %13-14 altına düştüğü tespit edilir.' },
          { type: 'harvest', title: 'Combine Harvester Operation', titleTr: 'Biçerdöver ile Hasat', description: 'Biçerdöver ayarları dane kırmayacak şekilde ayarlanarak hasat tamamlanır.' },
        ],
      },
    ],
  },
  {
    id: 'maize',
    name: 'Corn',
    nameTr: 'Mısır',
    category: 'cereal',
    defaultDurationDays: 140,
    stages: [
      {
        name: 'Soil Preparation & Planting',
        nameTr: 'Toprak Hazırlığı ve Ekim',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'soil_prep', title: 'Deep Plowing & Base Fertilization', titleTr: 'Derin Sürüm ve Taban Gübrelemesi', description: 'Toprak sıcaklığı 10-12°C olduğunda dekara 25-35 kg kompoze taban gübresi karıştırılır.' },
          { type: 'planting', title: 'Pneumatic Precision Planting', titleTr: 'Pnömatik Mibzerle Ekim', description: 'Sıra arası 70 cm, sıra üzeri 14-18 cm olacak şekilde 5-6 cm derinliğe pnömatik mibzerle ekilir.' },
          { type: 'pest_control', title: 'Cutworm & Wireworm Seed Treatment', titleTr: 'Bozkurt ve Tel Kurdu Koruması', description: 'Toprak altı zararlılarına karşı tohum ilaçlaması ve çıkış öncesi herbisit uygulanır.' },
        ],
      },
      {
        name: '6-8 Leaf Stage & Rapid Growth',
        nameTr: '6-8 Yaprak ve Hızlı Vejetatif Gelişme',
        dayOffset: 15,
        durationDays: 35,
        tasks: [
          { type: 'soil_prep', title: 'Inter-row Cultivation & Earthing Up', titleTr: 'Ara Çapa ve Boğaz Doldurma', description: 'Bitkiler 30-40 cm boya geldiğinde ara çapa makinesi ile boğaz doldurulur.' },
          { type: 'fertilization', title: '1st Top Nitrogen & 1st Irrigation', titleTr: '1. Üst Azot Gübrelemesi ve İlk Sulama', description: 'Dekara 20-25 kg Üre (%46 N) gübresi boğaz doldurma ile verilip ardından ilk sulama yapılır.' },
          { type: 'fertilization', title: 'Zinc Foliar Application', titleTr: 'Çinko Yaprak Gübrelemesi', description: 'Mısırda çinko noksanlığına karşı yapraktan çinko şelat püskürtülür.' },
        ],
      },
      {
        name: 'Tasseling, Silking & Pollination',
        nameTr: 'Püskül Çıkarma ve Koçan Bağlama',
        dayOffset: 50,
        durationDays: 30,
        tasks: [
          { type: 'irrigation', title: 'Critical Tasseling Irrigation', titleTr: 'Kritik Tepe ve Koçan Püskülü Sulaması', description: 'Su tüketiminin zirve yaptığı bu evrede asla su stresine sokulmaz; bol sulanır.' },
          { type: 'pest_control', title: 'Corn Borer & Earworm Insecticide', titleTr: 'Mısır Kurdu ve Koçan Kurdu Mücadelesi', description: 'Feromon tuzaklar izlenir, tepe püskülü çıkışında ruhsatlı insektisit atılır.' },
          { type: 'fertilization', title: '2nd Top Nitrogen & Potassium', titleTr: '2. Üst Gübreleme (Potasyum Nitrat / AN)', description: 'Tane dolgunluğu için potasyum ve azot takviyesi yapılır.' },
        ],
      },
      {
        name: 'Grain Filling & Black Layer',
        nameTr: 'Tane Dolumu ve Olgunlaşma',
        dayOffset: 80,
        durationDays: 40,
        tasks: [
          { type: 'irrigation', title: 'Milk & Dent Stage Watering', titleTr: 'Süt ve Diş Olum Sulaması', description: 'Danelerin dolması için sulamaya devam edilir, diş olumunun sonuna doğru kademeli kesilir.' },
          { type: 'field_scouting', title: 'Black Layer Maturity Check', titleTr: 'Siyah Tabaka (Black Layer) Kontrolü', description: 'Koçan danelerinin dip kısmında siyah tabaka oluşumu kontrol edilir.' },
        ],
      },
      {
        name: 'Harvest',
        nameTr: 'Hasat',
        dayOffset: 120,
        durationDays: 20,
        tasks: [
          { type: 'harvest', title: 'Grain Corn Combine Harvest', titleTr: 'Biçerdöver ile Tane Mısır Hasadı', description: 'Tane nemi %14-16 civarına gerilediğinde mısır tablası takılı biçerdöverle hasat edilir.' },
        ],
      },
    ],
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    nameTr: 'Ayçiçeği',
    category: 'industrial',
    defaultDurationDays: 120,
    stages: [
      {
        name: 'Soil Preparation & Sowing',
        nameTr: 'Toprak Hazırlığı ve Ekim',
        dayOffset: 0,
        durationDays: 15,
        tasks: [
          { type: 'soil_prep', title: 'Seedbed Prep & Base Fertilizer', titleTr: 'Tohum Yatağı Hazırlığı ve Taban Gübreleme', description: 'Dekara 20-25 kg 20-20-0 taban gübresi atılarak toprak inceltilir.' },
          { type: 'planting', title: 'Pneumatic Precision Sowing', titleTr: 'Pnömatik Mibzerle Ekim', description: 'Sıra arası 70 cm, sıra üzeri 25-30 cm mesafeyle 4-5 cm derinliğe ekim yapılır.' },
          { type: 'pest_control', title: 'Pre-emergence Herbicide', titleTr: 'Çıkış Öncesi Yabancı Ot İlaçlaması', description: 'Yabancı otlara ve Canavar Otu (Orobanche)\'na karşı toleranslı tohum/herbisit uygulanır.' },
        ],
      },
      {
        name: 'Vegetative Growth & Hoeing',
        nameTr: 'Fide Gelişimi ve Çapa',
        dayOffset: 15,
        durationDays: 35,
        tasks: [
          { type: 'soil_prep', title: 'Inter-row Hoeing & Thinning', titleTr: 'Ara Çapa ve Tekleme', description: '4-6 yapraklı dönemde sıra araları traktör çapasıyla işlenir.' },
          { type: 'fertilization', title: 'Nitrogen Topdressing & Boron Foliar', titleTr: 'Azotlu Üst Gübreleme ve Bor Uygulaması', description: 'Çapa ile birlikte azotlu gübre verilir. Tabla kısırlığını önlemek için yapraktan bor püskürtülür.' },
          { type: 'pest_control', title: 'Meadow Caterpillar & Cutworm Scouting', titleTr: 'Çayır Tırtılı ve Bozkurt Taraması', description: 'Yaprak yiyen tırtıl zararlıları takip edilir.' },
        ],
      },
      {
        name: 'Budding (Star Stage) & Flowering',
        nameTr: 'Yıldız Tabla (Tomurcuk) ve Çiçeklenme',
        dayOffset: 50,
        durationDays: 30,
        tasks: [
          { type: 'irrigation', title: 'Star Stage Critical Irrigation', titleTr: 'Kritik Tabla Teşekkülü Sulaması', description: 'Sulanabilir alanlarda verimi en çok artıran tabla teşekkülü sulaması yapılır.' },
          { type: 'pest_control', title: 'Beehive Placement & Sclerotinia Care', titleTr: 'Arı Kovanı Yerleşimi ve Tabla Çürüklüğü Koruması', description: 'Döllenmeyi artırmak için dekara 1 kovan yerleştirilir. Beyaz çürüklüğe karşı önlem alınır.' },
        ],
      },
      {
        name: 'Grain Filling & Harvest',
        nameTr: 'Tane Dolumu ve Hasat',
        dayOffset: 80,
        durationDays: 40,
        tasks: [
          { type: 'field_scouting', title: 'Back-of-Head Color & Moisture Check', titleTr: 'Tabla Arkası Renk ve Nem Takibi', description: 'Tabla arkası kahverengiye döndüğünde ve nem %9-10 seviyesine indiğinde hasat olgunluğu gelmiştir.' },
          { type: 'harvest', title: 'Combine Harvesting', titleTr: 'Biçerdöver ile Hasat', description: 'Ayçiçeği tablası takılı biçerdöverle hasat yapılır.' },
        ],
      },
    ],
  },
  {
    id: 'cotton',
    name: 'Cotton',
    nameTr: 'Pamuk',
    category: 'industrial',
    defaultDurationDays: 170,
    stages: [
      {
        name: 'Seedbed Preparation & Sowing',
        nameTr: 'Tohum Yatağı Hazırlığı ve Ekim',
        dayOffset: 0,
        durationDays: 25,
        tasks: [
          { type: 'soil_prep', title: 'Ridge Bed Prep & Base Fertilizer', titleTr: 'Sırt Hazırlığı ve Taban Gübrelemesi', description: 'Toprak 15-18°C tavda iken sırtlar oluşturulur, dekara 25-30 kg 20-20-0 taban gübresi karıştırılır.' },
          { type: 'planting', title: 'Delinted Seed Planting', titleTr: 'Havsız (Deltapine) Tohum Ekimi', description: 'Sıra arası 70 cm, sıra üzeri 12-15 cm olacak şekilde 3-4 cm derinliğe ekim yapılır.' },
          { type: 'pest_control', title: 'Seedling Damping-off & Thrips Control', titleTr: 'Fide Kök Çürüklüğü ve Trips İlaçlaması', description: 'Çıkış sonrası yaprak kıvrılması yapan tripslere ve kök çürüklüğüne karşı erken mücadele yapılır.' },
        ],
      },
      {
        name: 'Squaring & First Bloom',
        nameTr: 'Taraklanma ve İlk Çiçek',
        dayOffset: 25,
        durationDays: 45,
        tasks: [
          { type: 'soil_prep', title: 'Cultivation & Furrow Ridging', titleTr: 'Boğaz Doldurma ve Çapa', description: 'Sulama karıkları açılır ve boğaz doldurma çapası yapılır.' },
          { type: 'fertilization', title: 'Nitrogen Topdressing', titleTr: 'Üst Azot Gübrelemesi (Üre / Nitrat)', description: 'Tarak döneminde dekara 15-20 kg azotlu gübre verilip ardından sulama yapılır.' },
          { type: 'pruning', title: 'Plant Growth Regulator (Mepiquat Chloride)', titleTr: 'Bitki Gelişim Düzenleyici (Pix) Uygulaması', description: 'Aşırı boylanmayı önlemek ve tarak tutumunu artırmak için Mepiquat Chloride püskürtülür.' },
          { type: 'pest_control', title: 'Bollworm & Spider Mite Scouting', titleTr: 'Yeşilkurt ve Kırmızı Örümcek Sayımı', description: '100 bitkide tarak dökümü ve kurt yumurtası kontrol edilerek eşik aşımında ilaçlama yapılır.' },
        ],
      },
      {
        name: 'Boll Development & Maturation',
        nameTr: 'Koza Oluşumu ve Dolumu',
        dayOffset: 70,
        durationDays: 55,
        tasks: [
          { type: 'irrigation', title: 'Furrow / Drip Irrigation Schedule', titleTr: 'Periyodik Karık veya Damla Sulama', description: 'Koza büyüme evresinde 10-14 gün aralıklarla düzenli sulama yapılır.' },
          { type: 'fertilization', title: 'Potassium Nitrate Foliar Feeding', titleTr: 'Potasyum Nitrat ile Lif Kalitesi Beslemesi', description: 'Lif mukavemeti ve koza ağırlığı için yapraktan potasyum nitrat ve magnezyum verilir.' },
          { type: 'pest_control', title: 'Whitefly & Armyworm Management', titleTr: 'Beyazsinek ve Çizgili Yaprak Kurdu Mücadelesi', description: 'Lifte tatlımsı madde (yapışkanlık) oluşmaması için beyazsinek popülasyonu baskılanır.' },
        ],
      },
      {
        name: 'Boll Opening, Defoliation & Harvest',
        nameTr: 'Koza Açımı, Yaprak Döktürme ve Hasat',
        dayOffset: 125,
        durationDays: 45,
        tasks: [
          { type: 'pruning', title: 'Defoliant & Boll Opener Application', titleTr: 'Yaprak Döktürücü (Defoliant) ve Koza Açıcı', description: 'Kozaların %60-70\'i açtığında makineli hasada uygun hale getirmek için yaprak döktürücü uygulanır.' },
          { type: 'harvest', title: 'Mechanical Cotton Picker Harvest', titleTr: 'Makineli Pamuk Hasadı', description: 'Yapraklar tamamen döküldükten sonra pamuk toplama makineleri ile hasat yapılır.' },
        ],
      },
    ],
  },
  {
    id: 'olive',
    name: 'Olive',
    nameTr: 'Zeytin',
    category: 'fruit',
    defaultDurationDays: 300,
    stages: [
      {
        name: 'Dormancy & Pruning',
        nameTr: 'Kış Dinlenmesi ve Budama',
        dayOffset: 0,
        durationDays: 60,
        tasks: [
          { type: 'pruning', title: 'Crop & Rejuvenation Pruning', titleTr: 'Mahsul ve Gençleştirme Budaması', description: 'Ağacın iç kısmına ışık girmesini sağlayacak şekilde taç ortası açılır, obur dallar kesilir.' },
          { type: 'pest_control', title: 'Bordeaux Mixture (Copper) Spray', titleTr: 'Bordo Bulamacı (%1.5-2) Uygulaması', description: 'Budama yaralarının kapanması ve halkalı lekeye karşı kışlık bakır uygulaması yapılır.' },
          { type: 'fertilization', title: 'Winter Base Fertilizer & Manure', titleTr: 'Kış Taban Gübrelemesi ve Çiftlik Gübresi', description: 'Taç izdüşümüne fosfor, potasyum ve yanmış çiftlik gübresi karıştırılır.' },
        ],
      },
      {
        name: 'Inflorescence (Somak) & Bloom',
        nameTr: 'Somak (Çiçek) Oluşumu ve Çiçeklenme',
        dayOffset: 60,
        durationDays: 60,
        tasks: [
          { type: 'fertilization', title: 'Boron, Zinc & Nitrogen Foliar Feed', titleTr: 'Bor, Çinko ve Azot Yaprak Gübrelemesi', description: 'Çiçek tutumunu ve somak kalitesini artırmak için yapraktan bor ve çinko püskürtülür.' },
          { type: 'pest_control', title: 'Olive Moth & Cottony Scale Control', titleTr: 'Zeytin Güvesi (Çiçek Nesli) ve Pamuklu Bit', description: 'Çiçek tomurcuklarındaki güve tırtılları kontrol edilir.' },
          { type: 'pest_control', title: 'Peacock Spot 2nd Copper Application', titleTr: 'Halkalı Leke 2. İlaçlaması', description: 'Çiçek somakları belirginleştiğinde ilkbahar bakırlı fungusiti uygulanır.' },
        ],
      },
      {
        name: 'Fruit Set, Pit Hardening & Growth',
        nameTr: 'Meyve Tutumu, Çekirdek Sertleşmesi ve Büyüme',
        dayOffset: 120,
        durationDays: 90,
        tasks: [
          { type: 'irrigation', title: 'Summer Drip Irrigation', titleTr: 'Yaz Kuraklığında Damla Sulama', description: 'Zeytinde periyodisiteyi azaltmak ve dane irileşmesi için düzenli sulama yapılır.' },
          { type: 'pest_control', title: 'Olive Fruit Fly Trap Monitoring', titleTr: 'Zeytin Sineği (Bactrocera oleae) Tuzak Takibi', description: 'Tuzaklarda sinek sayımı ve vuruk kontrolü yapılır; eşik aşıldığında ilaçlama yapılır.' },
          { type: 'fertilization', title: 'Potassium Feeding for Oil Synthesis', titleTr: 'Potasyumlu Besleme ile Yağ Oluşumu', description: 'Meyve etinde yağ sentezini artırmak için potasyum sülfat verilir.' },
        ],
      },
      {
        name: 'Veraison, Ripening & Harvest',
        nameTr: 'Renk Dönümü ve Hasat',
        dayOffset: 210,
        durationDays: 90,
        tasks: [
          { type: 'harvest', title: 'Table & Oil Olive Harvest', titleTr: 'Sofralık / Yağlık Kademeli Hasat', description: 'Zeytinler mora/siyaha döndüğünde yere sergi serilerek mekanik tarakla toplanır.' },
          { type: 'harvest', title: 'Crate Transport & Quick Cold Press', titleTr: 'Kasalarla Hızlı Sıkıma Sevk', description: 'Kaliteli sızma zeytinyağı için toplanan zeytinler delikli kasalarla 24 saat içinde sıkılır.' },
          { type: 'pest_control', title: 'Post-Harvest Copper Application', titleTr: 'Hasat Sonrası Bordo Bulamacı', description: 'Tarak yaralarından dal kanseri bulaşmasını önlemek için hasat biter bitmez bakır atılır.' },
        ],
      },
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    nameTr: 'Elma',
    category: 'fruit',
    defaultDurationDays: 220,
    stages: [
      {
        name: 'Dormancy & Winter Pruning',
        nameTr: 'Kış Uykusu ve Budama',
        dayOffset: 0,
        durationDays: 45,
        tasks: [
          { type: 'pruning', title: 'Winter Pruning & Canopy Management', titleTr: 'Kış Budaması ve Taç Şekillendirme', description: 'Ağacın güneşlenmesini artıran terbiye budaması yapılır; hastalıklı sürgünler çıkarılır.' },
          { type: 'pest_control', title: 'Dormant Oil & Copper Spray', titleTr: 'Kışlık Yağ ve Bordo Bulamacı Uygulaması', description: 'Kışlayan kabuklu bit ve kara leke sporlarına karşı kışlık yağ ile Bordo Bulamacı uygulanır.' },
          { type: 'fertilization', title: 'Soil-Based Base Fertilization', titleTr: 'Toprak Analizli Taban Gübrelemesi', description: 'Ağaç taç izdüşümüne fosfor, potasyum ve kompost gömülür.' },
        ],
      },
      {
        name: 'Green Tip, Pink Bud & Flowering',
        nameTr: 'Fare Kulağı, Pembe Tomurcuk ve Çiçeklenme',
        dayOffset: 45,
        durationDays: 35,
        tasks: [
          { type: 'pest_control', title: 'Apple Scab & Powdery Mildew Spray', titleTr: 'Elma Kara Lekesi (Venturia) ve Külleme İlaçlaması', description: 'Pembe tomurcuk ve çiçek taç yaprakları döküldüğünde kara lekeye karşı koruyucu fungisit atılır.' },
          { type: 'field_scouting', title: 'Honeybee Hive Placement', titleTr: 'Bal Arısı Kovanı Yerleşimi', description: 'Meyve tutumunu garantiye almak için çiçeklenme başında bahçeye kovan yerleştirilir.' },
          { type: 'fertilization', title: 'Boron, Zinc & Seaweed Foliar Spray', titleTr: 'Bor, Çinko ve Deniz Yosunu Püskürtme', description: 'Çiçek kalitesi ve meyve tutumunu artırmak için yapraktan bor-çinko uygulanır.' },
        ],
      },
      {
        name: 'Fruit Thinning & Growth',
        nameTr: 'Meyve Seyreltme ve Gelişme',
        dayOffset: 80,
        durationDays: 60,
        tasks: [
          { type: 'pruning', title: 'Manual or Chemical Fruit Thinning', titleTr: 'El veya Kimyasal Meyve Seyreltme', description: 'Hüzmelerde sadece kral meyve (ortadaki 1-2 adet) bırakılarak periyodisite önlenir.' },
          { type: 'pest_control', title: 'Codling Moth Pest Management', titleTr: 'Elma İç Kurdu (Cydia pomonella) Mücadelesi', description: 'Feromon tuzaklar takip edilerek iç kurdu larva çıkışında ilaçlama yapılır.' },
          { type: 'fertilization', title: 'Calcium Sprays Against Bitter Pit', titleTr: 'Acı Benek Önleyici Kalsiyum Uygulamaları', description: 'Meyve gelişim döneminde 14 gün arayla yapraktan kalsiyum püskürtülür.' },
        ],
      },
      {
        name: 'Fruit Coloring, Ripening & Harvest',
        nameTr: 'Olgunlaşma, Renklenme ve Hasat',
        dayOffset: 140,
        durationDays: 80,
        tasks: [
          { type: 'field_scouting', title: 'Starch-Iodine Test & Firmness Check', titleTr: 'Nişasta-İyot Testi ve Sertlik Ölçümü', description: 'Hasat kriterleri (nişasta açılması, briks ve sertlik değeri) ölçülerek hasat günü belirlenir.' },
          { type: 'harvest', title: 'Gentle Hand Harvest & Crate Storage', titleTr: 'Zedelenmeden Elle Hasat ve Kasalama', description: 'Meyveler sapıyla birlikte yukarı bükülerek elle toplanır ve kasalanır.' },
        ],
      },
    ],
  },
];

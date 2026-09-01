// @ts-check
const CROPS_DATA = [
  {
    nameTr: 'Domates',
    name: 'Tomato',
    category: 'vegetable',
    defaultDurationDays: 120,
    stages: [
      {
        nameTr: 'Toprak Hazırlığı ve Fide Dikimi',
        name: 'Soil Preparation & Transplanting',
        dayOffset: 0,
        durationDays: 15,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Taban Gübrelemesi ve Derin Sürüm',
            title: 'Base Fertilization & Deep Tillage',
            description: 'Dekara 30-40 kg 15-15-15 kompoze gübre veya organik gübre serilerek toprak 25-30 cm derinlikte sürülür, kesekler parçalanarak düzlenir.'
          },
          {
            type: 'planting',
            titleTr: 'Masura Hazırlığı ve Fide Dikimi',
            title: 'Bed Preparation & Seedling Planting',
            description: 'Damla sulama hatları çekilir. 4-5 yapraklı sağlıklı fideler sıra üzeri 40-50 cm, sıra arası 80-100 cm olacak şekilde dikilir ve kök boğazı sıkıştırılır.'
          },
          {
            type: 'irrigation',
            titleTr: 'Can Suyu ve Kök Boğazı Koruma',
            title: 'Initial Irrigation & Root Protection',
            description: 'Dikim hemen sonrasında bol can suyu verilir. Çökerten ve kök çürüklüğü riskine karşı koruyucu kök boğazı fungusiti uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Köklenme ve Vejetatif Gelişme',
        name: 'Rooting & Vegetative Growth',
        dayOffset: 15,
        durationDays: 25,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: '1. Çapa ve Boğaz Doldurma',
            title: 'First Hoeing & Earthing Up',
            description: 'Fideler tutunduktan sonra yabancı otları temizlemek ve toprak havalanmasını sağlamak için ilk çapa yapılır, hafif boğaz doldurulur.'
          },
          {
            type: 'fertilization',
            titleTr: 'Kök Geliştirici ve Fosforlu Fertigasyon',
            title: 'Root Stimulant & Phosphorus Fertigation',
            description: 'Kılcal köklenmeyi hızlandırmak için yüksek fosforlu (10-40-10) gübre ve hümik-fülvik asit damlama ile verilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Kırmızı Örümcek ve Yaprak Galeri Sineği Kontrolü',
            title: 'Spider Mite & Leafminer Scouting',
            description: 'Yaprak altları düzenli taranır; sarı yapışkan tuzaklar yerleştirilerek zararlı popülasyonu izlenir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Çiçeklenme ve Meyve Tutumu',
        name: 'Flowering & Fruit Set',
        dayOffset: 40,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'Askıya Alma ve Koltuk Budaması',
            title: 'Staking & Sucker Pruning',
            description: 'Bitkiler ipe veya sırığa bağlanır. Gövde ve yaprak koltuklarından çıkan obur sürgünler (koltuklar) düzenli olarak temizlenir.'
          },
          {
            type: 'fertilization',
            titleTr: 'Kalsiyum ve Bor-Çinko Yaprak Beslemesi',
            title: 'Calcium & Boron-Zinc Foliar Feeding',
            description: 'Çiçek dökümünü engellemek ve çiçek burnu çürüklüğünü (dip çürüklüğü) önlemek için yapraktan kalsiyum ve mikro element püskürtülür.'
          },
          {
            type: 'pest_control',
            titleTr: 'Mildiyö ve Erken Yanıklık Koruması',
            title: 'Mildew & Early Blight Protection',
            description: 'Yüksek nem ve 20-25°C sıcaklıkta görülen Phytophthora ve Alternaria mantarlarına karşı koruyucu fungisit uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Meyve Büyütme ve Olgunlaşma',
        name: 'Fruit Enlargement & Ripening',
        dayOffset: 70,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'fertilization',
            titleTr: 'Potasyum Ağırlıklı Besleme',
            title: 'High-Potassium Nutrition',
            description: 'Meyve iriliği, sertlik, kırmızı renk ve brix (şeker) artışı için potasyum nitrat (16-8-34) ve magnezyum takviyesi yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Tuta Absoluta (Domates Güvesi) ve Yeşilkurt Mücadelesi',
            title: 'Tuta Absoluta & Fruit Borer Control',
            description: 'Feromon tuzaklar ve meyve delikleri kontrol edilir, ruhsatlı biyolojik veya entegre mücadele preparatları uygulanır.'
          },
          {
            type: 'irrigation',
            titleTr: 'Düzenli ve Dengeleyici Sulama',
            title: 'Balanced Drip Irrigation',
            description: 'Meyve çatlamasını önlemek için sulama aralıkları sabit tutulur, ani su dalgalanmalarından ve aşırı kurutmadan kaçınılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Kademeli Hasat ve Son Bakım',
        name: 'Harvest & Post-Harvest Care',
        dayOffset: 100,
        durationDays: 20,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Sabah Serinliğinde Seçici Hasat',
            title: 'Selective Morning Harvest',
            description: 'Pazar mesafesine göre pembe veya tam kızarmış domatesler saplı veya sapsız olarak sabah serinliğinde zedelenmeden toplanır.'
          },
          {
            type: 'pruning',
            titleTr: 'Yaşlı Dip Yaprakların Alınması',
            title: 'Lower Senescent Leaf Removal',
            description: 'Hasat edilen salkımların altındaki sararmış ve hava akışını engelleyen yapraklar budanarak üst salkımların ışıklanması artırılır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Biber',
    name: 'Pepper',
    category: 'vegetable',
    defaultDurationDays: 120,
    stages: [
      {
        nameTr: 'Fide Dikimi ve Adaptasyon',
        name: 'Transplanting & Root Establishment',
        dayOffset: 0,
        durationDays: 15,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Toprak Hazırlığı ve Dikim Yastıkları',
            title: 'Soil Bed Preparation',
            description: 'Organik maddece zengin, iyi drene edilmiş toprağa kompoze taban gübresi verilir. Damla hatları çekilir.'
          },
          {
            type: 'planting',
            titleTr: 'Fide Dikimi ve Can Suyu',
            title: 'Seedling Planting & First Watering',
            description: 'Fideler sıra arası 60-70 cm, sıra üzeri 35-40 cm olacak şekilde dikilir, can suyu verilir ve kök boğazı doldurulur.'
          },
          {
            type: 'pest_control',
            titleTr: 'Kök Boğazı Yanıklığı (Phytophthora) Koruması',
            title: 'Phytophthora Crown Rot Protection',
            description: 'Fide kök boğazı mantarına karşı ilk can suyuyla birlikte koruyucu fungusit uygulaması yapılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Vejetatif Büyüme ve Çatallanma',
        name: 'Vegetative Growth & Branching',
        dayOffset: 15,
        durationDays: 25,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Sıra Arası Çapa ve Yabancı Ot Temizliği',
            title: 'Hoeing & Weed Management',
            description: 'Kök havalanmasını sağlamak ve yabancı ot rekabetini kesmek için ilk çapalama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Dengeli Gelişim Fertigasyonu (20-20-20 + ME)',
            title: 'Balanced NPK & Micronutrient Fertigation',
            description: 'Bitkinin güçlü taç yapısı oluşturması ve çatal dallanması için dengeli NPK ve çinko-demir yaprak gübresi verilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Yaprak Biti (Afid) ve Trips Taraması',
            title: 'Aphids & Thrips Scouting',
            description: 'Virüs taşıyıcı afid ve tripslere karşı mavi ve sarı yapışkan tuzaklar asılır, gerekirse biyolojik mücadele uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Çiçeklenme ve Meyve Bağlama',
        name: 'Flowering & Fruit Setting',
        dayOffset: 40,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'fertilization',
            titleTr: 'Kalsiyum Nitrat ve Çiçek Destekleme',
            title: 'Calcium Nitrate & Blossom Support',
            description: 'Biber uçlarındaki çürümeyi (blossom end rot) önlemek için düzenli kalsiyum takviyesi ve bor-molibden uygulaması yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Biber Külleme ve Bakteriyel Leke Kontrolü',
            title: 'Powdery Mildew & Bacterial Spot Control',
            description: 'Yaprak üst yüzeyinde külleme lekeleri veya bakteriyel yanıklık belirtileri takip edilerek uygun ilaçlama yapılır.'
          },
          {
            type: 'irrigation',
            titleTr: 'Düzenli Aralıklarla Damla Sulama',
            title: 'Regular Drip Irrigation',
            description: 'Biber kökleri sığ olduğu için toprak sürekli nemli tutulmalı, aşırı su göllenmesinden ve su stresinden kaçınılmalıdır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Meyve İrileşmesi ve Hasat Periyodu',
        name: 'Fruit Sizing & Harvest Period',
        dayOffset: 70,
        durationDays: 50,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Kademeli Biber Toplama (Haftalık)',
            title: 'Weekly Pepper Harvest',
            description: 'Meyveler pazar standardı boyut ve et kalınlığına ulaştığında sapı koparılmadan makas veya elle bükülerek toplanır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Hasat Arası Potasyum ve Azot Takviyesi',
            title: 'Post-Harvest Potassium & Nitrogen Boost',
            description: 'Toplanan meyvelerin ardından yeni gelen biberlerin büyümesi için potasyum ağırlıklı damlama gübresi verilir.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Patlıcan',
    name: 'Eggplant',
    category: 'vegetable',
    defaultDurationDays: 130,
    stages: [
      {
        nameTr: 'Toprak Hazırlığı ve Fide Dikimi',
        name: 'Soil Bed Preparation & Planting',
        dayOffset: 0,
        durationDays: 15,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Derin Toprak İşleme ve Taban Gübreleme',
            title: 'Deep Tillage & Base Fertilization',
            description: 'Sıcak seven patlıcan için toprak 30 cm derinlikte sürülür, dekara 3-4 ton yanmış çiftlik gübresi ve kompoze gübre karıştırılır.'
          },
          {
            type: 'planting',
            titleTr: 'Fide Dikimi ve İlk Can Suyu',
            title: 'Planting & Can Suyu',
            description: 'Sıra arası 80-100 cm, sıra üzeri 50-60 cm mesafeyle dikilir, can suyu verilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Vejetatif Büyüme ve Taç Şekillendirme',
        name: 'Vegetative Growth & Canopy Pruning',
        dayOffset: 15,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'Çatal Altı Koltuk Alma ve Budama',
            title: 'Lower Shoot & Sucker Pruning',
            description: 'İlk ana dallanma (çatal) altındaki yan sürgünler ve dipteki sararan yapraklar budanarak hava sirkülasyonu sağlanır.'
          },
          {
            type: 'soil_prep',
            titleTr: 'Boğaz Doldurma ve Çapa',
            title: 'Earthing Up & Weed Cultivation',
            description: 'Gövdenin güçlü kök atması ve rüzgara dayanması için boğaz doldurma çapası yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Kırmızı Örümcek ve Beyazsinek Mücadelesi',
            title: 'Red Spider Mite & Whitefly Control',
            description: 'Yaprak altı kloroz ve emgi zararları kontrol edilir, akarisit ve sarı yapışkan levhalar uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Çiçeklenme ve Meyve Tutumu',
        name: 'Flowering & Fruit Development',
        dayOffset: 45,
        durationDays: 35,
        tasks: JSON.stringify([
          {
            type: 'fertilization',
            titleTr: 'Kalsiyum ve Potasyum Fertigasyonu',
            title: 'Calcium & Potassium Fertigation',
            description: 'Meyve etinin sıkı olması, rengin parlak mor-siyah kalması için potasyum ve kalsiyum düzenli verilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Verticillium Solgunluğu ve Külleme Gözlemi',
            title: 'Verticillium Wilt & Mildew Scouting',
            description: 'Tek taraflı yaprak pörsümesi ve solgunluk belirtileri taranır; aşırı sulamadan kaçınılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Hasat ve Pazara Hazırlık',
        name: 'Harvest & Market Handling',
        dayOffset: 80,
        durationDays: 50,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Düzenli Makaslı Hasat',
            title: 'Regular Sheared Harvest',
            description: 'Çekirdek bağlamamış, parlak koyu renkli meyveler yeşil çanak yaprağı ve 2-3 cm sapı ile birlikte bağ makasıyla kesilir.'
          },
          {
            type: 'fertilization',
            titleTr: 'Süreklilik Gübrelemesi ve Sulama',
            title: 'Regenerative Nutrition',
            description: 'Her 2 hasat sonrasında bitkiyi genç tutmak için dengeli azot-potasyum gübresi uygulanır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Salatalık (Hıyar)',
    name: 'Cucumber',
    category: 'vegetable',
    defaultDurationDays: 85,
    stages: [
      {
        nameTr: 'Ekim / Fide Dikimi ve Köklenme',
        name: 'Planting & Rooting',
        dayOffset: 0,
        durationDays: 12,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Tavlı Toprak Hazırlığı ve Damlama Kurulumu',
            title: 'Moist Soil Prep & Drip Lines',
            description: 'Gevşek, organik maddece zengin toprağa taban gübresi verilir ve damla sulama hatları çekilir.'
          },
          {
            type: 'planting',
            titleTr: 'Fide Dikimi ve Can Suyu',
            title: 'Seedling Planting & Can Suyu',
            description: 'Sıra arası 100 cm, sıra üzeri 40-50 cm aralıkla dikilir. Kök boğazı çürüklüğüne karşı can suyu ile koruyucu ilaç verilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Gövde Gelişimi ve İpe Alma',
        name: 'Vine Growth & Trellising',
        dayOffset: 12,
        durationDays: 18,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'İpe Sarma ve İlk 4-5 Boğum Budaması',
            title: 'String Trellising & Base Pruning',
            description: 'Gövde ipe sarılır. Topraktan ilk 40-50 cm yükseklikteki yaprak koltuklarında oluşan sürgün ve meyve tomurcukları temizlenir.'
          },
          {
            type: 'fertilization',
            titleTr: 'Hızlı Gelişim Fertigasyonu (NPK + Magnezyum)',
            title: 'Rapid Vegetative Fertigation',
            description: 'Hızlı vejetatif gelişim için 18-18-18 ve magnezyum sülfat damlama ile uygulanır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Kırmızı Örümcek ve Thrips Gözlemi',
            title: 'Spider Mite & Thrips Inspection',
            description: 'Hıyar yapraklarında gümüşi lekeler ve ağlar incelenir; sarı/mavi tuzaklar takip edilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Çiçeklenme ve Yoğun Meyve Tutumu',
        name: 'Flowering & Heavy Fruiting',
        dayOffset: 30,
        durationDays: 20,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Sık ve Düzenli Sulama Rejimi',
            title: 'Frequent Irrigation Schedule',
            description: 'Meyve acılaşmasını ve şekil bozukluğunu önlemek için günlük veya gün aşırı düzenli sulama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Potasyum ve Kalsiyum Desteği',
            title: 'Potassium & Calcium Boost',
            description: 'Düzgün ve gevrek meyve yapısı için potasyum nitrat ve kalsiyum verilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Yalancı Mildiyö ve Külleme İlaçlaması',
            title: 'Downy Mildew & Powdery Mildew Spray',
            description: 'Yaprak sararmaları ve unlu küf tabakasına karşı koruyucu fungisit püskürtülür.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Yoğun Hasat Dönemi',
        name: 'Peak Harvest Period',
        dayOffset: 50,
        durationDays: 35,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Gün Aşırı Düzenli Hasat',
            title: 'Alternate Day Harvest',
            description: 'Meyvelerin kartlaşmaması ve yeni meyve tutumunun teşvik edilmesi için 2 günde bir sabah serinliğinde hasat yapılır.'
          },
          {
            type: 'pruning',
            titleTr: 'Kartlaşmış Dip Yaprakların Temizliği',
            title: 'Lower Old Leaf Pruning',
            description: 'Havasızlığı önlemek ve ışık girişini artırmak için alt kısımdaki sararmış yapraklar toplanır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Buğday',
    name: 'Wheat',
    category: 'cereal',
    defaultDurationDays: 220,
    stages: [
      {
        nameTr: 'Tohum Yatağı Hazırlığı ve Ekim',
        name: 'Seedbed Preparation & Sowing',
        dayOffset: 0,
        durationDays: 25,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Taban Gübrelemesi (DAP / 20-20-0) ve Sürüm',
            title: 'Base Fertilizer & Tillage',
            description: 'Toprak analizi sonucuna göre dekara 15-20 kg DAP veya 20-20-0 kompoze gübre atılarak ikileme ve tırmık çekilir.'
          },
          {
            type: 'planting',
            titleTr: 'Sertifikalı Tohum ile Mibzerle Ekim',
            title: 'Certified Seed Drill Sowing',
            description: 'Sürme ve rastığa karşı ilaçlanmış sertifikalı buğday tohumu mibzerle 4-5 cm derinliğe ekilir (18-22 kg/da).'
          }
        ], null, 2)
      },
      {
        nameTr: 'Çıkış ve Kardeşlenme',
        name: 'Emergence & Tillering',
        dayOffset: 25,
        durationDays: 60,
        tasks: JSON.stringify([
          {
            type: 'field_scouting',
            titleTr: 'Çıkış Sayımı ve Kardeşlenme Kontrolü',
            title: 'Emergence & Tillering Assessment',
            description: 'Metrekaredeki bitki sayısı ve kardeşlenme kapasitesi kontrol edilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Geniş ve Dar Yapraklı Yabancı Ot Mücadelesi',
            title: 'Broadleaf & Grass Weed Herbicide',
            description: 'Kardeşlenme sonuna kadar yabancı ot yoğunluğuna göre uygun herbisit uygulaması yapılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Sapa Kalkma ve Üst Gübreleme',
        name: 'Stem Elongation & Topdressing',
        dayOffset: 85,
        durationDays: 40,
        tasks: JSON.stringify([
          {
            type: 'fertilization',
            titleTr: '1. ve 2. Üst Gübreleme (Üre / Nitrat)',
            title: 'Nitrogen Topdressing (Urea / CAN)',
            description: 'İlkbaharda yağış öncesi dekara 10-15 kg Üre (%46 N) veya Amonyum Nitrat (%26-33 N) fırfır ile homojen saçılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Sarı Pas ve Külleme İlaçlaması',
            title: 'Yellow Rust & Powdery Mildew Spray',
            description: 'İlkbahar yağışlarıyla artan sarı pas (Puccinia striiformis) ve septorya lekesine karşı bayrak yaprak koruma fungisiti atılır.'
          },
          {
            type: 'field_scouting',
            titleTr: 'Kışlamış Süne Ergin Sayımı',
            title: 'Overwintered Sunn Pest Scouting',
            description: 'Tarlada metrekarede kışlamış ergin süne sayımı yapılarak il tarım eşik değerleri takip edilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Başaklanma ve Tane Dolumu',
        name: 'Heading, Flowering & Grain Filling',
        dayOffset: 125,
        durationDays: 45,
        tasks: JSON.stringify([
          {
            type: 'pest_control',
            titleTr: 'Süne Nimf İlaçlaması',
            title: 'Sunn Pest Nymph Spraying',
            description: 'Metrekarede 10 adet ve üzeri nimf görüldüğünde süne emgisini ve kalite kaybını önlemek için ilaçlama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Çinko ve Üre Yaprak Takviyesi',
            title: 'Zinc & Urea Foliar Application',
            description: 'Tane protein oranını ve hektolitre ağırlığını artırmak için yapraktan sıvı çinko ve düşük biüreli üre uygulanır.'
          },
          {
            type: 'irrigation',
            titleTr: 'İmkan Varsa Süt Olum Sulaması',
            title: 'Grain Milk Stage Irrigation',
            description: 'Sulanan alanlarda dane dolumunu azamiye çıkarmak için başaklanma/süt olum döneminde 1 su verilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Sarı/Tam Olum ve Hasat',
        name: 'Ripening & Combine Harvest',
        dayOffset: 170,
        durationDays: 50,
        tasks: JSON.stringify([
          {
            type: 'field_scouting',
            titleTr: 'Tane Nem Kontrolü (%13-14)',
            title: 'Grain Moisture Testing',
            description: 'Tane rutubet ölçer ile nemin %13-14 altına düştüğü tespit edilir.'
          },
          {
            type: 'harvest',
            titleTr: 'Biçerdöver ile Hasat',
            title: 'Combine Harvester Operation',
            description: 'Biçerdöver batör ve elek ayarları dane kırmayacak ve döküntü yapmayacak şekilde ayarlanarak hasat tamamlanır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Mısır',
    name: 'Corn',
    category: 'cereal',
    defaultDurationDays: 140,
    stages: [
      {
        nameTr: 'Toprak Hazırlığı ve Ekim',
        name: 'Soil Preparation & Planting',
        dayOffset: 0,
        durationDays: 15,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Derin Sürüm ve Taban Gübrelemesi',
            title: 'Deep Plowing & Base Fertilization',
            description: 'Toprak sıcaklığı 10-12°C olduğunda dekara 25-35 kg kompoze (DAP veya 20-20-0) taban gübresi karıştırılır.'
          },
          {
            type: 'planting',
            titleTr: 'Pnömatik Mibzerle Ekim',
            title: 'Pneumatic Precision Planting',
            description: 'Sıra arası 70 cm, sıra üzeri 14-18 cm olacak şekilde 5-6 cm derinliğe pnömatik mibzerle ekim yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Bozkurt ve Tel Kurdu Koruması',
            title: 'Cutworm & Wireworm Seed Treatment',
            description: 'Toprak altı zararlılarına karşı tohum ilaçlaması ve çıkış öncesi herbisit uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: '6-8 Yaprak ve Hızlı Vejetatif Gelişme',
        name: '6-8 Leaf Stage & Rapid Growth',
        dayOffset: 15,
        durationDays: 35,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Ara Çapa ve Boğaz Doldurma',
            title: 'Inter-row Cultivation & Earthing Up',
            description: 'Bitkiler 30-40 cm boya geldiğinde ara çapa makinesi ile yabancı otlar temizlenir ve destek kökleri için boğaz doldurulur.'
          },
          {
            type: 'fertilization',
            titleTr: '1. Üst Azot Gübrelemesi ve İlk Sulama',
            title: '1st Top Nitrogen & 1st Irrigation',
            description: 'Dekara 20-25 kg Üre (%46 N) gübresi boğaz doldurma ile verilerek hemen ardından ilk sulama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Çinko Yaprak Gübrelemesi',
            title: 'Zinc Foliar Application',
            description: 'Mısırda çinko noksanlığına (beyaz şerit) karşı yapraktan çinko şelat püskürtülür.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Püskül Çıkarma ve Koçan Bağlama',
        name: 'Tasseling, Silking & Pollination',
        dayOffset: 50,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Kritik Tepe ve Koçan Püskülü Sulaması',
            title: 'Critical Tasseling Irrigation',
            description: 'Bitkinin su tüketiminin zirve yaptığı bu evrede asla su stresine sokulmaz; düzenli aralıklarla bol sulanır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Mısır Kurdu ve Koçan Kurdu Mücadelesi',
            title: 'Corn Borer & Earworm Insecticide',
            description: 'Feromon tuzaklar ve yaprak koltuklarındaki yumurta paketleri izlenir, tepe püskülü çıkışında ruhsatlı insektisit atılır.'
          },
          {
            type: 'fertilization',
            titleTr: '2. Üst Gübreleme (Potasyum Nitrat / AN)',
            title: '2nd Top Nitrogen & Potassium',
            description: 'Tane dolgunluğu için potasyum ve azot takviyesi yapılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Tane Dolumu ve Olgunlaşma',
        name: 'Grain Filling & Black Layer',
        dayOffset: 80,
        durationDays: 40,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Süt ve Diş Olum Sulaması',
            title: 'Milk & Dent Stage Watering',
            description: 'Danelerin dolması için sulamaya devam edilir, diş olumunun sonuna doğru sulama kademeli kesilir.'
          },
          {
            type: 'field_scouting',
            titleTr: 'Siyah Tabaka (Black Layer) Kontrolü',
            title: 'Black Layer Maturity Check',
            description: 'Koçan danelerinin dip kısmında siyah tabaka oluşumu kontrol edilerek fizyolojik olgunluk tespit edilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Hasat',
        name: 'Harvest',
        dayOffset: 120,
        durationDays: 20,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Biçerdöver ile Tane Mısır Hasadı',
            title: 'Grain Corn Combine Harvest',
            description: 'Tane nemi %14-16 civarına gerilediğinde mısır tablası takılı biçerdöverle hasat gerçekleştirilir.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Ayçiçeği',
    name: 'Sunflower',
    category: 'industrial',
    defaultDurationDays: 120,
    stages: [
      {
        nameTr: 'Toprak Hazırlığı ve Ekim',
        name: 'Soil Preparation & Sowing',
        dayOffset: 0,
        durationDays: 15,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Tohum Yatağı Hazırlığı ve Taban Gübreleme',
            title: 'Seedbed Prep & Base Fertilizer',
            description: 'Dekara 20-25 kg 20-20-0 veya kompoze taban gübresi atılarak toprak inceltilir ve bastırılır.'
          },
          {
            type: 'planting',
            titleTr: 'Pnömatik Mibzerle Ekim',
            title: 'Pneumatic Precision Sowing',
            description: 'Sıra arası 70 cm, sıra üzeri 25-30 cm mesafeyle 4-5 cm derinliğe ekim yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Çıkış Öncesi Yabancı Ot İlaçlaması',
            title: 'Pre-emergence Herbicide',
            description: 'Dar ve geniş yapraklı yabancı otlara veya Canavar Otu (Orobanche)\'na karşı toleranslı tohum/herbisit uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Fide Gelişimi ve Çapa',
        name: 'Vegetative Growth & Hoeing',
        dayOffset: 15,
        durationDays: 35,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Ara Çapa ve Tekleme',
            title: 'Inter-row Hoeing & Thinning',
            description: '4-6 yapraklı dönemde sıra araları traktör çapasıyla işlenir, gerekirse tekleme yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Azotlu Üst Gübreleme ve Bor Uygulaması',
            title: 'Nitrogen Topdressing & Boron Foliar',
            description: 'Çapa ile birlikte üre/nitrat gübresi verilir. Tabla kısırlığını önlemek için yapraktan bor püskürtülür.'
          },
          {
            type: 'pest_control',
            titleTr: 'Çayır Tırtılı ve Bozkurt Taraması',
            title: 'Meadow Caterpillar & Cutworm Scouting',
            description: 'Yaprak yiyen tırtıl zararlıları takip edilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Yıldız Tabla (Tomurcuk) ve Çiçeklenme',
        name: 'Budding (Star Stage) & Flowering',
        dayOffset: 50,
        durationDays: 30,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Kritik Tabla Teşekkülü Sulaması',
            title: 'Star Stage Critical Irrigation',
            description: 'Sulanabilir alanlarda verimi ve yağ oranını en çok artıran tabla teşekkülü ve çiçeklenme sulaması yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Arı Kovanı Yerleşimi ve Tabla Çürüklüğü Koruması',
            title: 'Beehive Placement & Sclerotinia Care',
            description: 'Döllenmeyi artırmak için dekara 1 kovan yerleştirilir. Beyaz çürüklük ve mildiyöye karşı koruyucu önlem alınır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Tane Dolumu ve Hasat',
        name: 'Grain Filling & Harvest',
        dayOffset: 80,
        durationDays: 40,
        tasks: JSON.stringify([
          {
            type: 'field_scouting',
            titleTr: 'Tabla Arkası Renk ve Nem Takibi',
            title: 'Back-of-Head Color & Moisture Check',
            description: 'Tabla arkası limon sarısından kahverengiye döndüğünde ve tane nemi %9-10 seviyesine indiğinde hasat olgunluğu gelmiştir.'
          },
          {
            type: 'harvest',
            titleTr: 'Biçerdöver ile Hasat',
            title: 'Combine Harvesting',
            description: 'Ayçiçeği tablası takılı biçerdöverle dane dökülmeden ve kabuk soyulmadan hasat yapılır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Pamuk',
    name: 'Cotton',
    category: 'industrial',
    defaultDurationDays: 170,
    stages: [
      {
        nameTr: 'Tohum Yatağı Hazırlığı ve Ekim',
        name: 'Seedbed Preparation & Sowing',
        dayOffset: 0,
        durationDays: 25,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Sırt Hazırlığı ve Taban Gübrelemesi',
            title: 'Ridge Bed Prep & Base Fertilizer',
            description: 'Toprak 15-18°C tavda iken sırtlar oluşturulur, dekara 25-30 kg 20-20-0 taban gübresi karıştırılır.'
          },
          {
            type: 'planting',
            titleTr: 'Havsız (Deltapine) Tohum Ekimi',
            title: 'Delinted Seed Planting',
            description: 'Sıra arası 70 cm, sıra üzeri 12-15 cm olacak şekilde 3-4 cm derinliğe ekim yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Fide Kök Çürüklüğü ve Trips İlaçlaması',
            title: 'Seedling Damping-off & Thrips Control',
            description: 'Çıkış sonrası yaprak kıvrılması yapan tripslere ve kök çürüklüğüne karşı erken mücadele yapılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Taraklanma ve İlk Çiçek',
        name: 'Squaring & First Bloom',
        dayOffset: 25,
        durationDays: 45,
        tasks: JSON.stringify([
          {
            type: 'soil_prep',
            titleTr: 'Boğaz Doldurma ve Çapa',
            title: 'Cultivation & Furrow Ridging',
            description: 'Sulama karıkları açılır ve boğaz doldurma çapası yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Üst Azot Gübrelemesi (Üre / Nitrat)',
            title: 'Nitrogen Topdressing',
            description: 'Tarak döneminde dekara 15-20 kg azotlu gübre verilip ardından sulama yapılır.'
          },
          {
            type: 'pruning',
            titleTr: 'Bitki Gelişim Düzenleyici (Pix) Uygulaması',
            title: 'Plant Growth Regulator (Mepiquat Chloride)',
            description: 'Aşırı vejetatif boylanmayı önlemek ve tarak tutumunu artırmak için Mepiquat Chloride püskürtülür.'
          },
          {
            type: 'pest_control',
            titleTr: 'Yeşilkurt ve Kırmızı Örümcek Sayımı',
            title: 'Bollworm & Spider Mite Scouting',
            description: '100 bitkide tarak dökümü ve kurt yumurtası kontrol edilerek eşik aşımında ilaçlama yapılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Koza Oluşumu ve Dolumu',
        name: 'Boll Development & Maturation',
        dayOffset: 70,
        durationDays: 55,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Periyodik Karık veya Damla Sulama',
            title: 'Furrow / Drip Irrigation Schedule',
            description: 'Koza büyüme evresinde 10-14 gün aralıklarla düzenli sulama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Potasyum Nitrat ile Lif Kalitesi Beslemesi',
            title: 'Potassium Nitrate Foliar Feeding',
            description: 'Lif mukavemeti ve koza ağırlığı için yapraktan potasyum nitrat ve magnezyum verilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Beyazsinek ve Çizgili Yaprak Kurdu Mücadelesi',
            title: 'Whitefly & Armyworm Management',
            description: 'Lifte tatlımsı madde (yapışkanlık) oluşmaması için beyazsinek popülasyonu baskılanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Koza Açımı, Yaprak Döktürme ve Hasat',
        name: 'Boll Opening, Defoliation & Harvest',
        dayOffset: 125,
        durationDays: 45,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'Yaprak Döktürücü (Defoliant) ve Koza Açıcı',
            title: 'Defoliant & Boll Opener Application',
            description: 'Kozaların %60-70\'i açtığında makineli hasada uygun hale getirmek için yaprak döktürücü uygulanır.'
          },
          {
            type: 'harvest',
            titleTr: 'Makineli Pamuk Hasadı',
            title: 'Mechanical Cotton Picker Harvest',
            description: 'Yapraklar tamamen döküldükten sonra pamuk toplama makineleri ile çiğ kalktıktan sonra hasat yapılır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Zeytin',
    name: 'Olive',
    category: 'fruit',
    defaultDurationDays: 300,
    stages: [
      {
        nameTr: 'Kış Dinlenmesi ve Budama',
        name: 'Dormancy & Pruning',
        dayOffset: 0,
        durationDays: 60,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'Mahsul ve Gençleştirme Budaması',
            title: 'Crop & Rejuvenation Pruning',
            description: 'Ağacın iç kısmına ışık girmesini sağlayacak şekilde taç ortası açılır, obur ve kuru dallar kesilir.'
          },
          {
            type: 'pest_control',
            titleTr: 'Bordo Bulamacı (%1.5-2) Uygulaması',
            title: 'Bordeaux Mixture (Copper) Spray',
            description: 'Budama yaralarının kapanması, zeytin dal kanseri ve halkalı lekeye karşı kışlık bakır uygulaması yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Kış Taban Gübrelemesi ve Çiftlik Gübresi',
            title: 'Winter Base Fertilizer & Manure',
            description: 'Taç izdüşümüne fosfor, potasyum ve yanmış çiftlik gübresi verilip toprağa karıştırılır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Somak (Çiçek) Oluşumu ve Çiçeklenme',
        name: 'Inflorescence (Somak) & Bloom',
        dayOffset: 60,
        durationDays: 60,
        tasks: JSON.stringify([
          {
            type: 'fertilization',
            titleTr: 'Bor, Çinko ve Azot Yaprak Gübrelemesi',
            title: 'Boron, Zinc & Nitrogen Foliar Feed',
            description: 'Çiçek tutumunu ve somak kalitesini artırmak için çiçeklenme öncesi yapraktan bor ve çinko püskürtülür.'
          },
          {
            type: 'pest_control',
            titleTr: 'Zeytin Güvesi (Çiçek Nesli) ve Pamuklu Bit',
            title: 'Olive Moth & Cottony Scale Control',
            description: 'Çiçek tomurcuklarındaki güve tırtılları kontrol edilir; gerekirse biyolojik preparat (Bacillus thuringiensis) atılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Halkalı Leke 2. İlaçlaması',
            title: 'Peacock Spot 2nd Copper Application',
            description: 'Çiçek somakları belirginleştiğinde ilkbahar bakırlı fungusiti uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Meyve Tutumu, Çekirdek Sertleşmesi ve Büyüme',
        name: 'Fruit Set, Pit Hardening & Growth',
        dayOffset: 120,
        durationDays: 90,
        tasks: JSON.stringify([
          {
            type: 'irrigation',
            titleTr: 'Yaz Kuraklığında Damla Sulama',
            title: 'Summer Drip Irrigation',
            description: 'Zeytinde periyodisiteyi (var yılı/yok yılı) azaltmak ve dane irileşmesi için düzenli sulama yapılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Zeytin Sineği (Bactrocera oleae) Tuzak Takibi',
            title: 'Olive Fruit Fly Trap Monitoring',
            description: 'Sarı yapışkan ve feromon tuzaklarda sinek sayımı ve vuruk kontrolü yapılır; eşik aşıldığında zehirli yem kısmi ilaçlaması yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Potasyumlu Besleme ile Yağ Oluşumu',
            title: 'Potassium Feeding for Oil Synthesis',
            description: 'Ağustos-Eylül döneminde meyve etinde yağ sentezini artırmak için potasyum sülfat verilir.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Renk Dönümü ve Hasat',
        name: 'Veraison, Ripening & Harvest',
        dayOffset: 210,
        durationDays: 90,
        tasks: JSON.stringify([
          {
            type: 'harvest',
            titleTr: 'Sofralık / Yağlık Kademeli Hasat',
            title: 'Table & Oil Olive Harvest',
            description: 'Yeşil sofralık zeytinler sarı-yeşil renkte; yağlık zeytinler ise mora/siyaha döndüğünde yere sergi serilerek mekanik tarakla toplanır.'
          },
          {
            type: 'harvest',
            titleTr: 'Kasalarla Hızlı Sıkıma Sevk',
            title: 'Crate Transport & Quick Cold Press',
            description: 'Asitliği düşük kaliteli sızma zeytinyağı için toplanan zeytinler çuvallara değil hava alan kasalara konularak 24 saat içinde sıkılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Hasat Sonrası Bordo Bulamacı',
            title: 'Post-Harvest Copper Application',
            description: 'Sırık veya tarak yaralarından dal kanseri bulaşmasını önlemek için hasat biter bitmez %2\'lik Bordo Bulamacı atılır.'
          }
        ], null, 2)
      }
    ]
  },
  {
    nameTr: 'Elma',
    name: 'Apple',
    category: 'fruit',
    defaultDurationDays: 220,
    stages: [
      {
        nameTr: 'Kış Uykusu ve Budama',
        name: 'Dormancy & Winter Pruning',
        dayOffset: 0,
        durationDays: 45,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'Kış Budaması ve Taç Şekillendirme',
            title: 'Winter Pruning & Canopy Management',
            description: 'Ağacın güneşlenmesini artıran terbiye budaması yapılır; hastalıklı ve birbirine binen sürgünler çıkarılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Kışlık Yağ ve Bordo Bulamacı Uygulaması',
            title: 'Dormant Oil & Copper Spray',
            description: 'Kışlayan kabuklu bit, kırmızı örümcek yumurtaları ve kara leke sporlarına karşı kışlık yağ ile Bordo Bulamacı uygulanır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Toprak Analizli Taban Gübrelemesi',
            title: 'Soil-Based Base Fertilization',
            description: 'Ağaç taç izdüşümüne fosfor, potasyum ve kompost verilerek toprağa gömülür.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Fare Kulağı, Pembe Tomurcuk ve Çiçeklenme',
        name: 'Green Tip, Pink Bud & Flowering',
        dayOffset: 45,
        durationDays: 35,
        tasks: JSON.stringify([
          {
            type: 'pest_control',
            titleTr: 'Elma Kara Lekesi (Venturia) ve Külleme İlaçlaması',
            title: 'Apple Scab & Powdery Mildew Spray',
            description: 'Pembe tomurcuk ve çiçek taç yaprakları döküldüğünde kara lekeye karşı kritik koruyucu fungisit ilaçlaması yapılır.'
          },
          {
            type: 'field_scouting',
            titleTr: 'Bal Arısı Kovanı Yerleşimi',
            title: 'Honeybee Hive Placement',
            description: 'Yabancı tozlaşma ve meyve tutumunu garantiye almak için çiçeklenme başında bahçeye kovan yerleştirilir.'
          },
          {
            type: 'fertilization',
            titleTr: 'Bor, Çinko ve Deniz Yosunu Püskürtme',
            title: 'Boron, Zinc & Seaweed Foliar Spray',
            description: 'Çiçek kalitesi ve meyve tutumunu artırmak için yapraktan bor-çinko uygulanır.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Meyve Seyreltme ve Gelişme',
        name: 'Fruit Thinning & Growth',
        dayOffset: 80,
        durationDays: 60,
        tasks: JSON.stringify([
          {
            type: 'pruning',
            titleTr: 'El veya Kimyasal Meyve Seyreltme',
            title: 'Manual or Chemical Fruit Thinning',
            description: 'Hüzmelerde (buket) sadece kral meyve (ortadaki 1-2 adet) bırakılarak periyodisite önlenir ve meyve iriliği artırılır.'
          },
          {
            type: 'pest_control',
            titleTr: 'Elma İç Kurdu (Cydia pomonella) Mücadelesi',
            title: 'Codling Moth Pest Management',
            description: 'Feromon tuzaklar ve sıcaklık toplamı (etkili sıcaklıklar) takip edilerek iç kurdu larva çıkışında ilaçlama yapılır.'
          },
          {
            type: 'fertilization',
            titleTr: 'Acı Benek Önleyici Kalsiyum Uygulamaları',
            title: 'Calcium Sprays Against Bitter Pit',
            description: 'Meyve gelişim döneminde 14 gün arayla yapraktan kalsiyum klorür/nitrat püskürtülür.'
          }
        ], null, 2)
      },
      {
        nameTr: 'Olgunlaşma, Renklenme ve Hasat',
        name: 'Fruit Coloring, Ripening & Harvest',
        dayOffset: 140,
        durationDays: 80,
        tasks: JSON.stringify([
          {
            type: 'field_scouting',
            titleTr: 'Nişasta-İyot Testi ve Sertlik Ölçümü',
            title: 'Starch-Iodine Test & Firmness Check',
            description: 'Hasat kriterleri (nişasta açılması, briks ve penetrometre sertlik değeri) ölçülerek hasat günü belirlenir.'
          },
          {
            type: 'harvest',
            titleTr: 'Zedelenmeden Elle Hasat ve Kasalama',
            title: 'Gentle Hand Harvest & Crate Storage',
            description: 'Meyveler sapıyla birlikte yukarı hafif bükülerek elle toplanır, plastik kasalara yerleştirilerek hızla soğuk hava deposuna iletilir.'
          }
        ], null, 2)
      }
    ]
  }
];

async function main() {
  console.log('Starting seed and cleanup process...');
  
  // Login
  const loginRes = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tahir.kahraman85@gmail.com', password: 'Password123!' })
  });
  
  if (!loginRes.ok) {
    throw new Error('Login failed: ' + (await loginRes.text()));
  }
  
  const loginJson = await loginRes.json();
  const token = loginJson.token;
  console.log('Authenticated successfully!');

  // Fetch current crops
  const curRes = await fetch('http://localhost:3000/api/crops?limit=200', {
    headers: { Authorization: `JWT ${token}` }
  });
  const curData = await curRes.json();
  const existingDocs = curData.docs || [];
  console.log(`Found ${existingDocs.length} existing crops in database.`);

  // 1. Delete all existing crops to avoid any duplicates or old incomplete structures
  for (const doc of existingDocs) {
    console.log(`Deleting old record ID ${doc.id} (${doc.nameTr || doc.name})...`);
    await fetch(`http://localhost:3000/api/crops/${doc.id}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` }
    });
  }

  // 2. Create the clean, complete 10 crops with their custom phonological stages and detailed tasks
  console.log('\nCreating 10 clean crops with tailored phonological stages & rich agronomic tasks...');
  for (const crop of CROPS_DATA) {
    const createRes = await fetch('http://localhost:3000/api/crops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`
      },
      body: JSON.stringify(crop)
    });
    
    if (!createRes.ok) {
      console.error(`Failed to create crop ${crop.nameTr}:`, await createRes.text());
    } else {
      const created = await createRes.json();
      console.log(`✓ Created: [ID: ${created.doc?.id || created.id}] ${crop.nameTr} (${crop.name}) - ${crop.stages.length} aşama`);
    }
  }

  // 3. Verify final state
  const finalRes = await fetch('http://localhost:3000/api/crops?limit=100', {
    headers: { Authorization: `JWT ${token}` }
  });
  const finalData = await finalRes.json();
  console.log(`\nFinal state: ${finalData.docs.length} crops verified in database.`);
  for (const c of finalData.docs) {
    console.log(` - ID ${c.id}: ${c.nameTr} (${c.name}) [${c.category}] - ${c.stages?.length || 0} Aşamalar`);
    if (c.stages) {
      for (const s of c.stages) {
        let taskCount = 0;
        try {
          const parsed = JSON.parse(s.tasks);
          taskCount = Array.isArray(parsed) ? parsed.length : 1;
        } catch {
          taskCount = s.tasks ? 1 : 0;
        }
        console.log(`     * ${s.nameTr} (Offset: ${s.dayOffset} gün, Süre: ${s.durationDays} gün, Görev Sayısı: ${taskCount})`);
      }
    }
  }
}

main().catch(console.error);

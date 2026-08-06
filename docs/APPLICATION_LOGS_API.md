# İlaçlama / Gübre Kaydı — Servis metod imzaları

Kaynak: `mobile/src/services/firebase.ts` + `mobile/src/store/appStore.ts`

## Tipler (özet)

```ts
type InputType = 'fertilizer' | 'pesticide';
type ApplicationUnit = 'kg' | 'g' | 'L' | 'mL' | 'adet';
type ApplicationMethod = 'spray' | 'drip' | 'broadcast' | 'foliar' | 'soil' | 'other';

interface ApplicationLog {
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

interface ApplicationLogFilter {
  fieldId?: string;
  inputType?: InputType;
  from?: Date;   // appliedAt >=
  to?: Date;     // appliedAt <=
  productName?: string; // substring, case-insensitive (opsiyonel)
}
```

---

## Firebase servis katmanı

```ts
/** Liste — en yeni appliedAt üstte */
function getApplicationLogs(
  userId: string,
  filter?: ApplicationLogFilter
): Promise<ApplicationLog[]>;

/** Tek kayıt */
function getApplicationLog(
  userId: string,
  logId: string
): Promise<ApplicationLog | null>;

/** Oluştur — id döner */
function createApplicationLog(
  data: Omit<ApplicationLog, 'id' | 'createdAt'>
): Promise<string>;

/** Kısmi güncelle */
function updateApplicationLog(
  logId: string,
  data: Partial<Omit<ApplicationLog, 'id' | 'userId' | 'createdAt'>>
): Promise<void>;

/** Sil */
function deleteApplicationLog(logId: string): Promise<void>;
```

### Filtre davranışı

| Alan | Mantık |
|------|--------|
| `fieldId` | Eşitlik |
| `inputType` | Eşitlik |
| `from` / `to` | `appliedAt` aralığı (gün başı / gün sonu client’ta normalize edilebilir) |
| `productName` | `includes` (trim, lowercase) |

Demo modda filtre bellek üzerinde uygulanır.  
Firestore’da: `where('userId'==uid)` + isteğe bağlı `fieldId` / `inputType` + client-side tarih/isim veya composite index.

---

## Store (Zustand) imzaları

```ts
refreshLogs(): Promise<void>;
createLog(data: Omit<ApplicationLog, 'id' | 'createdAt'>): Promise<string>;
updateLog(id: string, data: Partial<ApplicationLog>): Promise<void>;
deleteLog(id: string): Promise<void>;
// state: applicationLogs: ApplicationLog[]
```

---

## Görev tamamla — sequence diyagramı

```
Kullanıcı          TasksScreen           AppStore/fb          add-log
   |                    |                     |                  |
   |  ✓ (tamamla)       |                     |                  |
   |------------------->|                     |                  |
   |                    |                     |                  |
   |     [Alert]        |                     |                  |
   |  tip fertilizing   |                     |                  |
   |  veya spraying mi? |                     |                  |
   |                    |                     |                  |
   |--- İptal --------->| (kapanır)           |                  |
   |                    |                     |                  |
   |--- Sadece tamamla->|                     |                  |
   |                    |-- completeTask(id)->|                  |
   |                    |   status=completed  |                  |
   |                    |<-- refreshTasks ----|                  |
   |                    |                     |                  |
   |--- Kayıt ekle ---->|                     |                  |
   |                    |-- completeTask(id)->|                  |
   |                    |-- router.push ----->|----------------->|
   |                    |   ?fieldId&taskId   |   form öncedoldur|
   |                    |   &taskType         |                  |
   |                    |                     |  kullanıcı miktar|
   |                    |                     |  + ürün adı girer|
   |                    |                     |-- createLog ---->|
   |                    |                     |   (+ taskId bag) |
   |                    |                     |<-- id -----------|
   |                    |                     |  router.back()   |
```

### Diğer görev tipleri (planting, irrigation, …)

```
Kullanıcı → Alert: İptal | Tamamla
                └─ completeTask only  (log teklif edilmez)
```

### Notlar

1. Log silinince görev **geri açılmaz**.  
2. `taskId` opsiyonel; görevden gelindiyse formda banner gösterilir.  
3. `appliedAt` formdaki tarih alanından gelir (varsayılan bugün), görev `plannedDate` değil.

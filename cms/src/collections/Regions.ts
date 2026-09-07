import type { CollectionConfig } from 'payload'

export const Regions: CollectionConfig = {
  slug: 'regions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tuikCode', 'source', 'centerLat', 'centerLng', 'isActive'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Bölge / İl Adı',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Benzersiz Kod (Slug)',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'tuik_il',
      options: [
        { label: 'TÜİK İl', value: 'tuik_il' },
        { label: 'TÜİK İlçe (Faz 5)', value: 'tuik_ilce' },
        { label: 'Tarımsal Havza / Özel', value: 'manual' },
      ],
      label: 'Bölge Türü / Kaynak',
    },
    {
      name: 'tuikCode',
      type: 'text',
      label: 'TÜİK / Plaka Kodu',
      admin: {
        description: 'Örn: 01, 06, 34, 42',
      },
    },
    {
      name: 'centerLat',
      type: 'number',
      required: true,
      label: 'Merkez Enlem (Lat)',
    },
    {
      name: 'centerLng',
      type: 'number',
      required: true,
      label: 'Merkez Boylam (Lng)',
    },
    {
      name: 'defaultZoom',
      type: 'number',
      defaultValue: 9,
      label: 'Varsayılan Zoom',
    },
    {
      name: 'boundary',
      type: 'json',
      label: 'Sınır / Bounding Box (GeoJSON)',
      admin: {
        description: 'GeoJSON veya { minLat, maxLat, minLng, maxLng, coordinates } formatında poligon sınırı',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'regions',
      label: 'Üst Bölge / İl (İlçe Hiyerarşisi İçin)',
      admin: {
        condition: (data) => data?.source === 'tuik_ilce',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif mi?',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Sıralama Önceliği',
    },
  ],
}

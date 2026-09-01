import type { CollectionConfig } from 'payload'

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: {
    singular: 'Rehber / Kılavuz',
    plural: 'Rehberler / Kılavuzlar',
  },
  admin: {
    useAsTitle: 'titleTr',
    defaultColumns: ['titleTr', 'category', 'relatedCrop', 'updatedAt'],
    group: 'Tarımsal İçerik',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'titleTr', type: 'text', required: true, label: 'Rehber Başlığı (Türkçe)', admin: { width: '50%' } },
        { name: 'title', type: 'text', required: true, label: 'Rehber Başlığı (İngilizce)', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slug',
          type: 'text',
          unique: true,
          required: true,
          label: 'URL / Slug',
          admin: {
            description: 'Örnek: damla-sulama-kurulumu-ve-bakimi',
            width: '50%',
          },
        },
        {
          name: 'category',
          type: 'select',
          label: 'Kategori',
          options: [
            { label: 'İlaçlama ve Zirai Mücadele', value: 'spraying' },
            { label: 'Gübreleme ve Besleme', value: 'fertilizing' },
            { label: 'Sulama Sistemleri', value: 'irrigation' },
            { label: 'Genel Tarım Bilgisi', value: 'general' },
          ],
          defaultValue: 'general',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'relatedCrop',
      type: 'relationship',
      relationTo: 'crops',
      hasMany: true,
      label: 'İlgili Ekinler / Ürünler',
      admin: {
        description: 'Bu rehberin geçerli olduğu ürünleri seçebilirsiniz',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Kısa Özet',
      admin: {
        description: 'Mobil kart ve liste görünümünde gösterilecek kısa açıklama',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Detaylı Rehber İçeriği',
      admin: {
        description: 'Uygulama yöntemleri, dikkat edilecek hususlar ve teknik detaylar',
      },
    },
  ],
}


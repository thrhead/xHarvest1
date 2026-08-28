import type { CollectionConfig } from 'payload'

export const Crops: CollectionConfig = {
  slug: 'crops',
  labels: {
    singular: 'Ürün (Ekin)',
    plural: 'Ürünler (Ekinler)',
  },
  admin: {
    useAsTitle: 'nameTr',
    defaultColumns: ['nameTr', 'category', 'defaultDurationDays', 'updatedAt'],
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
        { name: 'nameTr', type: 'text', required: true, label: 'Ürün Adı (Türkçe)', admin: { width: '50%' } },
        { name: 'name', type: 'text', required: true, label: 'Ürün Adı (İngilizce)', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          label: 'Kategori',
          options: [
            { label: 'Sebze', value: 'vegetable' },
            { label: 'Tahıl / Hububat', value: 'cereal' },
            { label: 'Meyve / Ağaç', value: 'fruit' },
            { label: 'Endüstri Bitkisi', value: 'industrial' },
            { label: 'Baklagil', value: 'legume' },
            { label: 'Diğer', value: 'other' },
          ],
          defaultValue: 'vegetable',
          admin: { width: '50%' },
        },
        {
          name: 'defaultDurationDays',
          type: 'number',
          required: true,
          defaultValue: 120,
          label: 'Varsayılan Yetişme Süresi (Gün)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'stages',
      type: 'array',
      label: 'Fenolojik Gelişim Aşamaları ve Görevler',
      labels: {
        singular: 'Aşama',
        plural: 'Aşamalar',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nameTr', type: 'text', required: true, label: 'Aşama Adı (TR)', admin: { width: '50%' } },
            { name: 'name', type: 'text', required: true, label: 'Aşama Adı (EN)', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'dayOffset',
              type: 'number',
              required: true,
              label: 'Ekimden İtibaren Başlangıç Günü (Offset)',
              defaultValue: 0,
              admin: { width: '50%' },
            },
            {
              name: 'durationDays',
              type: 'number',
              defaultValue: 14,
              label: 'Aşama Süresi (Gün)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'tasks',
          type: 'json',
          label: 'Aşama Görevleri (Zirai İşlem Listesi)',
          admin: {
            description: 'Bu aşamadaki görevler (gübreleme, ilaçlama, sulama vb. JSON formatında)',
          },
        },
      ],
    },
  ],
}


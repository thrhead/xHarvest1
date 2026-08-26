import type { CollectionConfig } from 'payload'

export const Fields: CollectionConfig = {
  slug: 'fields',
  labels: {
    singular: 'Tarla / Parsel',
    plural: 'Tarlalar / Parseller',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'cropName', 'type', 'areaDecares', 'createdAt'],
    group: 'Tarımsal İşletme',
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
      label: 'Tarla Adı',
    },
    {
      name: 'cropName',
      type: 'text',
      required: true,
      label: 'Ekili Ürün (Ekin)',
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Açık Tarla', value: 'field' },
        { label: 'Sera', value: 'greenhouse' },
      ],
      defaultValue: 'field',
      label: 'Tarla Tipi',
    },
    {
      name: 'areaDecares',
      type: 'number',
      label: 'Alan (Dönüm / Da)',
    },
    {
      name: 'coordinates',
      type: 'json',
      label: 'Köşe / Konum Koordinatları',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Harita Rengi',
    },
    {
      name: 'customId',
      type: 'text',
      label: 'Özel İstemci ID',
    },
  ],
}

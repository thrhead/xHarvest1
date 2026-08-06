import type { CollectionConfig } from 'payload'

export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: {
    useAsTitle: 'titleTr',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'titleTr', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'İlaçlama', value: 'spraying' },
        { label: 'Gübreleme', value: 'fertilizing' },
        { label: 'Sulama', value: 'irrigation' },
        { label: 'Genel', value: 'general' },
      ],
      defaultValue: 'general',
    },
    {
      name: 'summary',
      type: 'textarea',
      label: 'Kısa özet (TR)',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'İçerik',
    },
    {
      name: 'relatedCrop',
      type: 'relationship',
      relationTo: 'crops',
      hasMany: true,
    },
  ],
}

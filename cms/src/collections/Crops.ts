import type { CollectionConfig } from 'payload'

export const Crops: CollectionConfig = {
  slug: 'crops',
  admin: {
    useAsTitle: 'nameTr',
    defaultColumns: ['nameTr', 'category', 'defaultDurationDays', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name (EN)',
    },
    {
      name: 'nameTr',
      type: 'text',
      required: true,
      label: 'Ad (TR)',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Sebze', value: 'vegetable' },
        { label: 'Tahıl', value: 'cereal' },
        { label: 'Meyve', value: 'fruit' },
        { label: 'Diğer', value: 'other' },
      ],
      defaultValue: 'vegetable',
    },
    {
      name: 'defaultDurationDays',
      type: 'number',
      required: true,
      defaultValue: 120,
      label: 'Varsayılan süre (gün)',
    },
    {
      name: 'stages',
      type: 'array',
      label: 'Aşamalar',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'nameTr', type: 'text', required: true },
        {
          name: 'dayOffset',
          type: 'number',
          required: true,
          label: 'Ekimden itibaren gün',
        },
        {
          name: 'durationDays',
          type: 'number',
          defaultValue: 14,
        },
        {
          name: 'tasks',
          type: 'array',
          fields: [
            {
              name: 'type',
              type: 'select',
              options: [
                { label: 'Ekim', value: 'planting' },
                { label: 'Gübreleme', value: 'fertilizing' },
                { label: 'İlaçlama', value: 'spraying' },
                { label: 'Hasat', value: 'harvesting' },
                { label: 'Sulama', value: 'irrigation' },
                { label: 'Diğer', value: 'other' },
              ],
              required: true,
            },
            { name: 'title', type: 'text', required: true },
            { name: 'titleTr', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
          ],
        },
      ],
    },
  ],
}

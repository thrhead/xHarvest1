import type { CollectionConfig } from 'payload'

// Vercel'de storage adapter olmadan upload kapali — sadece metadata
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Harici gorsel URL (Vercel storage yok)',
      },
    },
  ],
}

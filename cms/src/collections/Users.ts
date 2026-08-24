import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'createdAt'],
    group: 'Yönetim',
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: () => true, // Allow first user creation / registration
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Ad Soyad',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      required: true,
      options: [
        { label: 'Admin (Tam Yetki)', value: 'admin' },
        { label: 'Editör (İçerik Yöneticisi)', value: 'editor' },
        { label: 'Kullanıcı', value: 'user' },
      ],
      label: 'Kullanıcı Rolü',
      access: {
        update: ({ req }) => req.user?.role === 'admin' || !req.user,
      },
    },
  ],
}


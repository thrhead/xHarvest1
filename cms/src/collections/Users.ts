import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 28800,
    verify: false,
    maxLoginAttempts: 5,
    cookies: {
      sameSite: 'None',
      secure: true,
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'admin',
    },
  ],
}

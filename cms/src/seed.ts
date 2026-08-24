import type { Payload } from 'payload'

export async function runSeed(payload: Payload) {
  const crops = [
    {
      name: 'Tomato',
      nameTr: 'Domates',
      category: 'vegetable' as const,
      defaultDurationDays: 120,
      stages: [
        {
          name: 'Seedling',
          nameTr: 'Fide',
          dayOffset: 0,
          durationDays: 30,
          tasks: [
            {
              type: 'irrigation' as const,
              title: 'Water seedlings',
              titleTr: 'Fide sulama',
              description: 'Nem koru',
            },
          ],
        },
        {
          name: 'Harvest',
          nameTr: 'Hasat',
          dayOffset: 90,
          durationDays: 30,
          tasks: [
            {
              type: 'harvesting' as const,
              title: 'Pick',
              titleTr: 'Hasat',
              description: 'Olgun meyveleri topla',
            },
          ],
        },
      ],
    },
    {
      name: 'Wheat',
      nameTr: 'Bugday',
      category: 'cereal' as const,
      defaultDurationDays: 180,
      stages: [
        {
          name: 'Growth',
          nameTr: 'Gelisim',
          dayOffset: 0,
          durationDays: 120,
          tasks: [
            {
              type: 'fertilizing' as const,
              title: 'N top dress',
              titleTr: 'Azot ust gubre',
              description: 'Kardeg',
            },
          ],
        },
      ],
    },
  ]

  for (const crop of crops) {
    await payload.create({ collection: 'crops', data: crop })
  }

  await payload.create({
    collection: 'guides',
    data: {
      title: 'Irrigation basics',
      titleTr: 'Sulama temelleri',
      slug: 'sulama-temelleri',
      category: 'irrigation',
      summary: 'Damla sulama ve ET0 ozeti',
      body: 'Toprak nemini izle, sabah erken sulama tercih et.',
    },
  })

  await payload.create({
    collection: 'guides',
    data: {
      title: 'PHI safety',
      titleTr: 'PHI / bekleme suresi',
      slug: 'phi-bekleme',
      category: 'spraying',
      summary: 'Ilac sonrasi hasat bekleme',
      body: 'Etiket PHI gununu kontrol et, hasatSafeDate hesapla.',
    },
  })

  payload.logger.info('Seed completed: crops + guides')
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.movie.createMany({
      data: [
        { title: 'The Matrix', year: 1999, director: 'Wachowskis' },
        { title: 'Inception', year: 2010, director: 'Christopher Nolan' },
        { title: 'Interstellar', year: 2014, director: 'Christopher Nolan' }
      ]
    })
    console.log('✅ Database has been seeded.')
  } catch (err) {
    console.error('❌ Error while seeding:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()

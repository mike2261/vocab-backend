import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { id: 'dev-user-id' },
    update: {},
    create: { id: 'dev-user-id', email: 'dev@local.dev', displayName: 'Dev User' },
  })
  console.log('Dev user seeded')
}

main().finally(() => prisma.$disconnect())

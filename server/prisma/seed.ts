import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('password', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'msroyenterpriseindia@gmail.com' },
    update: {},
    create: {
      email: 'msroyenterpriseindia@gmail.com',
      password: adminPassword,
      name: 'Pritam Roy',
      role: 'ADMIN',
    },
  })

  // Create employee user
  // const employeePassword = await bcrypt.hash('employee123', 10)
  // const employee = await prisma.user.upsert({
  //   where: { email: 'employee@example.com' },
  //   update: {},
  //   create: {
  //     email: 'employee@example.com',
  //     password: employeePassword,
  //     name: 'Employee User',
  //     role: 'EMPLOYEE',
  //   },
  // })

  console.log('Seeded users:', { admin })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


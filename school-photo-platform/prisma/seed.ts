import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start seeding...')

  // 1. Очистка базы данных (удаляем в правильном порядке из-за связей)
  // Удаляем зависимые таблицы сначала
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.editRequest.deleteMany() 
  await prisma.classroom.deleteMany()
  await prisma.school.deleteMany()
  await prisma.user.deleteMany()

  // 2. Хешируем пароль (пароль для всех будет "123456")
  const hashedPassword = await bcrypt.hash('123456', 10)

  const teacherPasswordHash = await bcrypt.hash('123', 10)

  // 3. Создаем СУПЕР АДМИНА
  const superAdmin = await prisma.user.create({
    data: {
      email: 'super@admin.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      firstName: 'Big',
      lastName: 'Boss',
    },
  })
  console.log(`👤 Created Super Admin: ${superAdmin.email} (Pass: 123456)`)

  // 4. Создаем ФОТОГРАФА (Обычный админ)
  const photographer = await prisma.user.create({
    data: {
      email: 'photo@grapher.com',
      password: hashedPassword,
      role: Role.ADMIN,
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  console.log(`📸 Created Photographer: ${photographer.email} (Pass: 123456)`)

  // 5. Создаем ШКОЛУ (Привязываем к фотографу)
  // Обрати внимание: поля city больше нет, есть slug и primaryColor
  const school = await prisma.school.create({
    data: {
      name: 'Школа №1 (Тестовая)',
      slug: 'school-1-test', 
      adminId: photographer.id,
      primaryColor: '#f97316', // Оранжевый по дефолту
    },
  })
  console.log(`🏫 Created School: ${school.name} (Slug: ${school.slug})`)

  // 6. Создаем КЛАСС
  // Обрати внимание: используем teacherLogin вместо teacherSlug
  const classroom = await prisma.classroom.create({
    data: {
      name: '11 Б',
      schoolId: school.id,
      teacherLogin: 'teacher_11b',
      teacherPassword: teacherPasswordHash, // Простой пароль для учителя
    },
  })
  const classroom2 = await prisma.classroom.create({
    data: {
      name: '4g',
      schoolId: school.id,
      teacherLogin: 'astana_4g',
      teacherPassword: '450934', // Простой пароль для учителя
    },
  })
  console.log(`👩‍🏫 Created Classroom: ${classroom.name} (Login: ${classroom.teacherLogin} / Pass: 123)`)

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


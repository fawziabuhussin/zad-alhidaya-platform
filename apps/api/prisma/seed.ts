import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zad-alhidaya.com' },
    update: {},
    create: {
      name: 'مدير النظام',
      email: 'admin@zad-alhidaya.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create teacher user
  const teacherPassword = await hashPassword('teacher123');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@zad-alhidaya.com' },
    update: {},
    create: {
      name: 'الشيخ أحمد محمد',
      email: 'teacher@zad-alhidaya.com',
      passwordHash: teacherPassword,
      role: 'TEACHER',
    },
  });
  console.log('✅ Teacher user created:', teacher.email);

  // Create student user
  const studentPassword = await hashPassword('student123');
  const student = await prisma.user.upsert({
    where: { email: 'student@zad-alhidaya.com' },
    update: {},
    create: {
      name: 'طالب العلم',
      email: 'student@zad-alhidaya.com',
      passwordHash: studentPassword,
      role: 'STUDENT',
    },
  });
  console.log('✅ Student user created:', student.email);

  // Create categories
  const fiqhCategory = await prisma.category.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440001' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'الفقه',
      description: 'دورات في الفقه الإسلامي',
      order: 1,
    },
  });

  const hadithCategory = await prisma.category.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440002' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'الحديث',
      description: 'دورات في علوم الحديث',
      order: 2,
    },
  });

  const tafsirCategory = await prisma.category.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440003' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'التفسير',
      description: 'دورات في تفسير القرآن الكريم',
      order: 3,
    },
  });

  const aqidaCategory = await prisma.category.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440004' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'العقيدة',
      description: 'دورات في العقيدة الإسلامية',
      order: 4,
    },
  });

  console.log('✅ Categories created');

  // Course 1: الفقه
  const course1 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440001' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'مبادئ الفقه الإسلامي',
      description: 'دورة شاملة في مبادئ الفقه الإسلامي تغطي الأصول والقواعد الأساسية مع أمثلة تطبيقية',
      coverImage: 'https://via.placeholder.com/800x450.png?text=Fiqh+Course',
      categoryId: fiqhCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const course1Module1 = await prisma.module.create({
    data: {
      courseId: course1.id,
      title: 'المقدمة والأصول',
      order: 1,
    },
  });

  const course1Module2 = await prisma.module.create({
    data: {
      courseId: course1.id,
      title: 'أحكام الطهارة',
      order: 2,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: course1Module1.id,
        title: 'مقدمة في الفقه الإسلامي',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy1',
        order: 1,
        durationMinutes: 30,
      },
      {
        moduleId: course1Module1.id,
        title: 'مصادر الفقه الأربعة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy2',
        order: 2,
        durationMinutes: 25,
      },
      {
        moduleId: course1Module2.id,
        title: 'أحكام الوضوء والطهارة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy3',
        order: 1,
        durationMinutes: 20,
      },
    ],
  });

  // Course 2: الحديث
  const course2 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440002' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440002',
      title: 'علوم الحديث النبوي',
      description: 'دورة متخصصة في علوم الحديث الشريف تشمل مصطلح الحديث ودراسة الأسانيد',
      coverImage: 'https://via.placeholder.com/800x450.png?text=Hadith+Course',
      categoryId: hadithCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const course2Module1 = await prisma.module.create({
    data: {
      courseId: course2.id,
      title: 'مقدمة في علوم الحديث',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: course2Module1.id,
        title: 'تعريف الحديث النبوي',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy4',
        order: 1,
        durationMinutes: 35,
      },
      {
        moduleId: course2Module1.id,
        title: 'أقسام الحديث: الصحيح والحسن والضعيف',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy5',
        order: 2,
        durationMinutes: 40,
      },
      {
        moduleId: course2Module1.id,
        title: 'دراسة الأسانيد',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy6',
        order: 3,
        durationMinutes: 30,
      },
    ],
  });

  // Course 3: التفسير
  const course3 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440003' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440003',
      title: 'تفسير القرآن الكريم',
      description: 'دورة في تفسير القرآن الكريم مع التركيز على السور المكية والمدنية',
      coverImage: 'https://via.placeholder.com/800x450.png?text=Tafsir+Course',
      categoryId: tafsirCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const course3Module1 = await prisma.module.create({
    data: {
      courseId: course3.id,
      title: 'مقدمة في التفسير',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: course3Module1.id,
        title: 'تعريف التفسير والتأويل',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy7',
        order: 1,
        durationMinutes: 45,
      },
      {
        moduleId: course3Module1.id,
        title: 'أسباب النزول وأهميتها',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy8',
        order: 2,
        durationMinutes: 30,
      },
      {
        moduleId: course3Module1.id,
        title: 'تفسير سورة الفاتحة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy9',
        order: 3,
        durationMinutes: 40,
      },
    ],
  });

  // Course 4: العقيدة
  const course4 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440004' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440004',
      title: 'العقيدة الإسلامية',
      description: 'دورة شاملة في العقيدة الإسلامية تغطي أركان الإيمان والإسلام',
      coverImage: 'https://via.placeholder.com/800x450.png?text=Aqida+Course',
      categoryId: aqidaCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const course4Module1 = await prisma.module.create({
    data: {
      courseId: course4.id,
      title: 'أركان الإيمان',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: course4Module1.id,
        title: 'الإيمان بالله تعالى',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy10',
        order: 1,
        durationMinutes: 50,
      },
      {
        moduleId: course4Module1.id,
        title: 'الإيمان بالملائكة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy11',
        order: 2,
        durationMinutes: 35,
      },
      {
        moduleId: course4Module1.id,
        title: 'الإيمان بالكتب والرسل',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLdummy12',
        order: 3,
        durationMinutes: 45,
      },
    ],
  });

  console.log('✅ Courses created with modules and lessons');

  // Create exams for courses
  const exam1 = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان منتصف الفصل - الفقه',
      description: 'امتحان شامل في مبادئ الفقه الإسلامي',
      durationMinutes: 60,
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2025-12-31T23:59:59'),
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Add questions to exam 1
  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam1.id,
        prompt: 'ما هو تعريف الفقه؟',
        choices: JSON.stringify(['علم الأحكام الشرعية', 'علم الحديث', 'علم التفسير', 'علم النحو']),
        correctIndex: 0,
        points: 20,
        order: 1,
      },
      {
        examId: exam1.id,
        prompt: 'كم عدد مصادر الفقه الأساسية؟',
        choices: JSON.stringify(['أربعة', 'خمسة', 'ستة', 'سبعة']),
        correctIndex: 0,
        points: 20,
        order: 2,
      },
      {
        examId: exam1.id,
        prompt: 'ما هي أركان الوضوء؟',
        choices: JSON.stringify(['النية والغسل', 'النية والمسح', 'النية والترتيب', 'النية والموالاة']),
        correctIndex: 0,
        points: 30,
        order: 3,
      },
      {
        examId: exam1.id,
        prompt: 'ما حكم الوضوء للصلاة؟',
        choices: JSON.stringify(['واجب', 'سنة', 'مستحب', 'مباح']),
        correctIndex: 0,
        points: 30,
        order: 4,
      },
    ],
  });

  const exam2 = await prisma.exam.create({
    data: {
      courseId: course2.id,
      title: 'امتحان علوم الحديث',
      description: 'امتحان في مصطلحات الحديث',
      durationMinutes: 45,
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2025-12-31T23:59:59'),
      maxScore: 100,
      passingScore: 60,
    },
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: exam2.id,
        prompt: 'ما هو الحديث الصحيح؟',
        choices: JSON.stringify(['ما اتصل سنده', 'ما رواه العدل', 'ما توفرت فيه شروط القبول', 'ما كان مشهوراً']),
        correctIndex: 2,
        points: 50,
        order: 1,
      },
      {
        examId: exam2.id,
        prompt: 'ما الفرق بين الحديث الصحيح والحسن؟',
        choices: JSON.stringify(['لا فرق', 'في الحسن ضعف يسير', 'في الصحيح ضعف', 'كلاهما واحد']),
        correctIndex: 1,
        points: 50,
        order: 2,
      },
    ],
  });

  console.log('✅ Exams created with questions');

  // Create homeworks
  const homework1 = await prisma.homework.create({
    data: {
      courseId: course1.id,
      title: 'واجب الأسبوع الأول - الفقه',
      description: 'اكتب بحثاً مختصراً عن مصادر الفقه الإسلامي مع ذكر مثال لكل مصدر',
      dueDate: new Date('2025-02-01T23:59:59'),
      maxScore: 100,
    },
  });

  const homework2 = await prisma.homework.create({
    data: {
      courseId: course2.id,
      title: 'واجب مصطلحات الحديث',
      description: 'اشرح الفرق بين الحديث الصحيح والحسن والضعيف مع أمثلة',
      dueDate: new Date('2025-02-15T23:59:59'),
      maxScore: 100,
    },
  });

  const homework3 = await prisma.homework.create({
    data: {
      courseId: course3.id,
      title: 'واجب التفسير',
      description: 'فسر سورة الفاتحة مع ذكر أسباب النزول إن وجدت',
      dueDate: new Date('2025-02-20T23:59:59'),
      maxScore: 100,
    },
  });

  console.log('✅ Homeworks created');

  // Enroll student in all courses
  for (const course of [course1, course2, course3, course4]) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course.id,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Student enrolled in all courses');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

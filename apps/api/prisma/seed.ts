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
    update: { coverImage: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440001',
      title: 'مبادئ الفقه الإسلامي',
      description: 'دورة شاملة في مبادئ الفقه الإسلامي تغطي الأصول والقواعد الأساسية مع أمثلة تطبيقية',
      coverImage: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&h=450&fit=crop',
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
    update: { coverImage: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440002',
      title: 'علوم الحديث النبوي',
      description: 'دورة متخصصة في علوم الحديث الشريف تشمل مصطلح الحديث ودراسة الأسانيد',
      coverImage: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&h=450&fit=crop',
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
    update: { coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440003',
      title: 'تفسير القرآن الكريم',
      description: 'دورة في تفسير القرآن الكريم مع التركيز على السور المكية والمدنية',
      coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&h=450&fit=crop',
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
    update: { coverImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440004',
      title: 'العقيدة الإسلامية',
      description: 'دورة شاملة في العقيدة الإسلامية تغطي أركان الإيمان والإسلام',
      coverImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&h=450&fit=crop',
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

  // ============================================
  // ADVANCED COURSES WITH PREREQUISITES (ALL STATES)
  // ============================================
  console.log('📚 Creating advanced courses with prerequisites...');
  
  // Course 5: New course that student is NOT enrolled in (for "not enrolled" state)
  const course5 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440005' },
    update: { coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440005',
      title: 'علم الأصول',
      description: 'دورة في أصول الفقه وقواعد الاستنباط',
      coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&h=450&fit=crop',
      categoryId: fiqhCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const course5Module1 = await prisma.module.create({
    data: {
      courseId: course5.id,
      title: 'مقدمة في الأصول',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: course5Module1.id,
        title: 'تعريف أصول الفقه',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLusul1',
        order: 1,
        durationMinutes: 40,
      },
    ],
  });
  // Note: Student is NOT enrolled in course5

  // Advanced Course 1: Shows all 3 states
  const advancedCourse = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440010' },
    update: { coverImage: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440010',
      title: 'الفقه المتقدم - المعاملات المالية',
      description: 'دورة متقدمة في فقه المعاملات المالية الإسلامية. هذه الدورة تتطلب إكمال ثلاث دورات سابقة لعرض جميع حالات المتطلبات.',
      coverImage: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop',
      categoryId: fiqhCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const advancedModule1 = await prisma.module.create({
    data: {
      courseId: advancedCourse.id,
      title: 'فقه البيوع',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: advancedModule1.id,
        title: 'شروط البيع الصحيح',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLadvanced1',
        order: 1,
        durationMinutes: 45,
      },
      {
        moduleId: advancedModule1.id,
        title: 'أنواع البيوع المحرمة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLadvanced2',
        order: 2,
        durationMinutes: 40,
      },
    ],
  });

  // Add 3 prerequisites to show all states:
  // 1. course1 (Fiqh) - will have passing grade = COMPLETED
  // 2. course4 (Aqida) - enrolled but no passing grade = ENROLLED  
  // 3. course5 (Usul) - not enrolled = NOT ENROLLED
  
  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_prerequisiteCourseId: {
        courseId: advancedCourse.id,
        prerequisiteCourseId: course1.id,
      },
    },
    update: {},
    create: {
      courseId: advancedCourse.id,
      prerequisiteCourseId: course1.id,
    },
  });

  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_prerequisiteCourseId: {
        courseId: advancedCourse.id,
        prerequisiteCourseId: course4.id,
      },
    },
    update: {},
    create: {
      courseId: advancedCourse.id,
      prerequisiteCourseId: course4.id,
    },
  });

  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_prerequisiteCourseId: {
        courseId: advancedCourse.id,
        prerequisiteCourseId: course5.id,
      },
    },
    update: {},
    create: {
      courseId: advancedCourse.id,
      prerequisiteCourseId: course5.id,
    },
  });

  // Advanced Course 2: All prerequisites completed (shows green "ready to enroll" state)
  const advancedCourse2 = await prisma.course.upsert({
    where: { id: '660e8400-e29b-41d4-a716-446655440011' },
    update: { coverImage: 'https://images.unsplash.com/photo-1579187707643-35646d22b596?w=800&h=450&fit=crop' },
    create: {
      id: '660e8400-e29b-41d4-a716-446655440011',
      title: 'التفسير المتقدم - سورة البقرة',
      description: 'دورة متقدمة في تفسير سورة البقرة. المتطلبات السابقة مكتملة - يمكنك التسجيل مباشرة!',
      coverImage: 'https://images.unsplash.com/photo-1579187707643-35646d22b596?w=800&h=450&fit=crop',
      categoryId: tafsirCategory.id,
      teacherId: teacher.id,
      status: 'PUBLISHED',
      price: 0,
    },
  });

  const advancedCourse2Module1 = await prisma.module.create({
    data: {
      courseId: advancedCourse2.id,
      title: 'تفسير الآيات 1-50',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: advancedCourse2Module1.id,
        title: 'مقدمة سورة البقرة',
        type: 'VIDEO',
        youtubeUrl: 'https://www.youtube.com/embed/videoseries?list=PLtafsir1',
        order: 1,
        durationMinutes: 50,
      },
    ],
  });

  // This course requires course3 (Tafsir basics) which will have passing grade
  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_prerequisiteCourseId: {
        courseId: advancedCourse2.id,
        prerequisiteCourseId: course3.id,
      },
    },
    update: {},
    create: {
      courseId: advancedCourse2.id,
      prerequisiteCourseId: course3.id,
    },
  });

  console.log('   ✅ Advanced courses created with prerequisites:');
  console.log('');
  console.log('   📘 الفقه المتقدم - المعاملات المالية (3 متطلبات - جميع الحالات):');
  console.log('      ✅ مبادئ الفقه الإسلامي → مكتمل (درجة 85%)');
  console.log('      ⏰ العقيدة الإسلامية → قيد الدراسة (مسجل، بدون درجة ناجحة)');
  console.log('      📖 علم الأصول → غير مسجل (الطالب غير مسجل في هذه الدورة)');
  console.log('      🔗 URL: /courses/660e8400-e29b-41d4-a716-446655440010');
  console.log('');
  console.log('   📗 التفسير المتقدم - سورة البقرة (1 متطلب - مكتمل):');
  console.log('      ✅ تفسير القرآن الكريم → مكتمل (درجة 78%)');
  console.log('      ✨ جاهز للتسجيل - زر التسجيل مفعّل');
  console.log('      🔗 URL: /courses/660e8400-e29b-41d4-a716-446655440011');

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

  // Enroll student in courses (NOT course5 - to show "غير مسجل" state)
  // course1: will have passing grade = COMPLETED
  // course2, course3: enrolled with passing grades
  // course4: enrolled WITHOUT passing grade = IN PROGRESS ("قيد الدراسة")
  // course5: NOT enrolled = "غير مسجل"
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
  // Explicitly ensure student is NOT enrolled in course5
  await prisma.enrollment.deleteMany({
    where: {
      userId: student.id,
      courseId: course5.id,
    },
  });

  console.log('✅ Student enrolled in courses 1-4 (NOT course5 for "غير مسجل" state)');

  // ============================================
  // TEST DATA FOR EXAM REVIEW FEATURE
  // ============================================
  console.log('🧪 Creating exam review test data...');

  // Get all lessons for course1 to mark as completed
  const course1Lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course1.id,
      },
    },
  });

  // Mark all course1 lessons as completed for student
  for (const lesson of course1Lessons) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: student.id,
          lessonId: lesson.id,
        },
      },
      update: { completedAt: new Date() },
      create: {
        userId: student.id,
        lessonId: lesson.id,
        completedAt: new Date(),
      },
    });
  }

  // Create test exams with specific scenarios
  const now = new Date();
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Scenario 1: Exam ended + Passed → Review ENABLED
  const examEndedPassed = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان منتهي - ناجح (المراجعة متاحة)',
      description: 'هذا الامتحان انتهى وأنت ناجح - زر المراجعة متاح',
      durationMinutes: 30,
      startDate: startDate,
      endDate: pastDate,
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Create questions individually to capture IDs
  const q1EndedPassed = await prisma.examQuestion.create({
    data: {
      examId: examEndedPassed.id,
      prompt: 'سؤال اختبار المراجعة 1',
      choices: JSON.stringify(['الإجابة الصحيحة', 'خطأ 1', 'خطأ 2', 'خطأ 3']),
      correctIndex: 0,
      explanation: 'هذا شرح للإجابة الصحيحة - يجب أن تراه بعد النجاح',
      points: 50,
      order: 1,
    },
  });

  const q2EndedPassed = await prisma.examQuestion.create({
    data: {
      examId: examEndedPassed.id,
      prompt: 'سؤال اختبار المراجعة 2',
      choices: JSON.stringify(['خطأ', 'الإجابة الصحيحة', 'خطأ', 'خطأ']),
      correctIndex: 1,
      explanation: 'شرح السؤال الثاني',
      points: 50,
      order: 2,
    },
  });

  // Create passing attempt (100/100 - both correct)
  await prisma.examAttempt.create({
    data: {
      examId: examEndedPassed.id,
      userId: student.id,
      answers: JSON.stringify({ [q1EndedPassed.id]: 0, [q2EndedPassed.id]: 1 }),
      score: 100,
      status: 'AUTO_GRADED',
      startedAt: pastDate,
      submittedAt: pastDate,
    },
  });

  // Scenario 2: Exam ended + Failed → Review HIDDEN
  const examEndedFailed = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان منتهي - راسب (المراجعة مخفية)',
      description: 'هذا الامتحان انتهى وأنت راسب - زر المراجعة مخفي',
      durationMinutes: 30,
      startDate: startDate,
      endDate: pastDate,
      maxScore: 100,
      passingScore: 60,
    },
  });

  const q1EndedFailed = await prisma.examQuestion.create({
    data: {
      examId: examEndedFailed.id,
      prompt: 'سؤال الامتحان الراسب',
      choices: JSON.stringify(['الإجابة الصحيحة', 'خطأ 1', 'خطأ 2', 'خطأ 3']),
      correctIndex: 0,
      explanation: 'هذا الشرح لن يظهر لك لأنك راسب',
      points: 100,
      order: 1,
    },
  });

  // Create failing attempt (0/100 - wrong answer)
  await prisma.examAttempt.create({
    data: {
      examId: examEndedFailed.id,
      userId: student.id,
      answers: JSON.stringify({ [q1EndedFailed.id]: 2 }),
      score: 0,
      status: 'AUTO_GRADED',
      startedAt: pastDate,
      submittedAt: pastDate,
    },
  });

  // Scenario 3: Exam active + Passed → Review DISABLED with tooltip
  const examActivePassed = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان نشط - ناجح (المراجعة معطلة)',
      description: 'هذا الامتحان لم ينتهِ بعد وأنت ناجح - زر المراجعة معطل مع رسالة',
      durationMinutes: 30,
      startDate: startDate,
      endDate: futureDate,
      maxScore: 100,
      passingScore: 60,
    },
  });

  const q1ActivePassed = await prisma.examQuestion.create({
    data: {
      examId: examActivePassed.id,
      prompt: 'سؤال الامتحان النشط',
      choices: JSON.stringify(['الإجابة الصحيحة', 'خطأ 1', 'خطأ 2', 'خطأ 3']),
      correctIndex: 0,
      explanation: 'هذا الشرح سيظهر بعد انتهاء الامتحان',
      points: 100,
      order: 1,
    },
  });

  // Create passing attempt (100/100)
  await prisma.examAttempt.create({
    data: {
      examId: examActivePassed.id,
      userId: student.id,
      answers: JSON.stringify({ [q1ActivePassed.id]: 0 }),
      score: 100,
      status: 'AUTO_GRADED',
      startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Scenario 4: Exam active + Failed → Review HIDDEN
  const examActiveFailed = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان نشط - راسب (المراجعة مخفية)',
      description: 'هذا الامتحان لم ينتهِ بعد وأنت راسب - زر المراجعة مخفي',
      durationMinutes: 30,
      startDate: startDate,
      endDate: futureDate,
      maxScore: 100,
      passingScore: 60,
    },
  });

  const q1ActiveFailed = await prisma.examQuestion.create({
    data: {
      examId: examActiveFailed.id,
      prompt: 'سؤال الامتحان النشط الراسب',
      choices: JSON.stringify(['الإجابة الصحيحة', 'خطأ 1', 'خطأ 2', 'خطأ 3']),
      correctIndex: 0,
      explanation: 'لن ترى هذا الشرح',
      points: 100,
      order: 1,
    },
  });

  // Create failing attempt (0/100 - wrong answer)
  await prisma.examAttempt.create({
    data: {
      examId: examActiveFailed.id,
      userId: student.id,
      answers: JSON.stringify({ [q1ActiveFailed.id]: 3 }),
      score: 0,
      status: 'AUTO_GRADED',
      startedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Scenario 5: Exam ended + No attempt → Review HIDDEN (shows "منتهي" status)
  const examEndedNoAttempt = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: 'امتحان منتهي - بدون محاولة',
      description: 'هذا الامتحان انتهى ولم تجربه - يظهر كمنتهي بدون زر مراجعة',
      durationMinutes: 30,
      startDate: startDate,
      endDate: pastDate,
      maxScore: 100,
      passingScore: 60,
    },
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: examEndedNoAttempt.id,
        prompt: 'سؤال الامتحان بدون محاولة',
        choices: JSON.stringify(['الإجابة الصحيحة', 'خطأ 1', 'خطأ 2', 'خطأ 3']),
        correctIndex: 0,
        explanation: 'لن ترى هذا لأنك لم تجرب الامتحان',
        points: 100,
        order: 1,
      },
    ],
  });

  // No attempt created for this exam

  console.log('✅ Exam review test data created:');
  console.log('   - امتحان منتهي - ناجح: زر المراجعة مفعّل');
  console.log('   - امتحان منتهي - راسب: زر المراجعة مخفي');
  console.log('   - امتحان نشط - ناجح: زر المراجعة معطل + تلميح');
  console.log('   - امتحان نشط - راسب: زر المراجعة مخفي');
  console.log('   - امتحان منتهي - بدون محاولة: لا يوجد زر مراجعة');

  // ============================================
  // TEST DATA FOR SMART NAVIGATION FEATURE
  // ============================================
  console.log('🧭 Creating Smart Navigation test data...');

  // Get course2 lessons for partial progress
  const course2Lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course2.id,
      },
    },
    orderBy: { order: 'asc' },
  });

  // Mark only FIRST lesson of course2 as completed (partial progress)
  if (course2Lessons.length > 0) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: student.id,
          lessonId: course2Lessons[0].id,
        },
      },
      update: { completedAt: new Date() },
      create: {
        userId: student.id,
        lessonId: course2Lessons[0].id,
        completedAt: new Date(),
      },
    });
    console.log('   ✅ Partial progress: Course2 first lesson completed');
  }

  // Create ACTIVE exams WITHOUT attempts (for notification badge)
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

  // Active exam 1 - urgent (ends in 2 days)
  await prisma.exam.create({
    data: {
      courseId: course2.id,
      title: 'امتحان عاجل - الحديث',
      description: 'امتحان ينتهي قريباً - يجب إكماله خلال يومين',
      durationMinutes: 30,
      startDate: startDate,
      endDate: twoDaysFromNow,
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Active exam 2 - normal (ends in 4 days)
  await prisma.exam.create({
    data: {
      courseId: course3.id,
      title: 'امتحان التفسير الأسبوعي',
      description: 'امتحان أسبوعي في التفسير',
      durationMinutes: 45,
      startDate: startDate,
      endDate: fourDaysFromNow,
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Active exam 3 - normal (ends in 6 days)
  await prisma.exam.create({
    data: {
      courseId: course4.id,
      title: 'امتحان العقيدة الشهري',
      description: 'امتحان شهري في العقيدة',
      durationMinutes: 60,
      startDate: startDate,
      endDate: sixDaysFromNow,
      maxScore: 100,
      passingScore: 60,
    },
  });

  console.log('   ✅ Created 3 active exams without attempts (for badge)');

  // Create UPCOMING exams (start date in future) for "قادم" filter
  const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
  const twentyDaysFromNow = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

  // Upcoming exam 1
  await prisma.exam.create({
    data: {
      courseId: course2.id,
      title: 'امتحان قادم - مصطلحات الحديث',
      description: 'امتحان سيفتح الأسبوع القادم',
      durationMinutes: 45,
      startDate: tenDaysFromNow,
      endDate: fifteenDaysFromNow,
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Upcoming exam 2
  await prisma.exam.create({
    data: {
      courseId: course3.id,
      title: 'امتحان قادم - تفسير سورة آل عمران',
      description: 'امتحان نهاية الشهر في التفسير',
      durationMinutes: 60,
      startDate: fifteenDaysFromNow,
      endDate: twentyDaysFromNow,
      maxScore: 100,
      passingScore: 60,
    },
  });

  console.log('   ✅ Created 2 upcoming exams (for قادم filter)');

  // Create pending HOMEWORK with future due dates (for notification badge)
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // Pending homework 1 - urgent
  await prisma.homework.create({
    data: {
      courseId: course2.id,
      title: 'واجب عاجل - تصنيف الأحاديث',
      description: 'صنف 5 أحاديث إلى صحيح وحسن وضعيف مع التعليل',
      dueDate: twoDaysFromNow,
      maxScore: 100,
    },
  });

  // Pending homework 2
  await prisma.homework.create({
    data: {
      courseId: course3.id,
      title: 'واجب تفسير سورة البقرة',
      description: 'فسر الآيات 1-5 من سورة البقرة',
      dueDate: threeDaysFromNow,
      maxScore: 100,
    },
  });

  // Pending homework 3
  await prisma.homework.create({
    data: {
      courseId: course4.id,
      title: 'بحث في أركان الإيمان',
      description: 'اكتب بحثاً عن ركن الإيمان بالقدر',
      dueDate: fiveDaysFromNow,
      maxScore: 100,
    },
  });

  console.log('   ✅ Created 3 pending homeworks with future due dates (for badge)');

  console.log('🧭 Smart Navigation test data created:');
  console.log('   - 3 active exams (badge shows "3 متاح الآن")');
  console.log('   - 2 upcoming exams (for قادم filter)');
  console.log('   - 3 pending homeworks (badge shows "3 في الانتظار")');
  console.log('   - Course2 partial progress (Continue Learning shows next lesson)');
  console.log('   - 6 upcoming deadlines (within 7 days)');

  console.log('🔍 Exam Search/Filter test data summary:');
  console.log('   - متاح الآن (active): 3+ exams within start/end date, no attempt');
  console.log('   - مكتمل (completed): 4+ exams with attempts');
  console.log('   - قادم (upcoming): 2 exams with future start date');
  console.log('   - منتهي (expired): 1+ exams past end date, no attempt');

  // ============================================
  // PREREQUISITE GRADES (for testing prerequisite status)
  // ============================================
  console.log('📊 Creating prerequisite grades...');

  // Helper to get letter grade (define early for prerequisite grades)
  const getLetterGradeHelper = (percentage: number): string => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Create passing grade for course1 (Fiqh) - shows as "COMPLETED"
  await prisma.grade.upsert({
    where: {
      userId_courseId_type_itemId: {
        userId: student.id,
        courseId: course1.id,
        type: 'FINAL',
        itemId: 'prereq-final-course1',
      },
    },
    update: {
      score: 85,
      maxScore: 100,
      percentage: 85,
      letterGrade: getLetterGradeHelper(85),
    },
    create: {
      userId: student.id,
      courseId: course1.id,
      type: 'FINAL',
      itemId: 'prereq-final-course1',
      score: 85,
      maxScore: 100,
      percentage: 85,
      letterGrade: getLetterGradeHelper(85),
    },
  });

  // Create passing grade for course3 (Tafsir) - shows as "COMPLETED"  
  await prisma.grade.upsert({
    where: {
      userId_courseId_type_itemId: {
        userId: student.id,
        courseId: course3.id,
        type: 'FINAL',
        itemId: 'prereq-final-course3',
      },
    },
    update: {
      score: 78,
      maxScore: 100,
      percentage: 78,
      letterGrade: getLetterGradeHelper(78),
    },
    create: {
      userId: student.id,
      courseId: course3.id,
      type: 'FINAL',
      itemId: 'prereq-final-course3',
      score: 78,
      maxScore: 100,
      percentage: 78,
      letterGrade: getLetterGradeHelper(78),
    },
  });

  // Note: course4 (Aqida) has NO grade - shows as "ENROLLED" (student is enrolled from earlier)
  // Note: course5 (Usul) has NO enrollment - shows as "NOT ENROLLED"

  console.log('   ✅ Prerequisite grades created:');
  console.log('');
  console.log('   📊 حالات المتطلبات للدورة المتقدمة:');
  console.log('      ┌─────────────────────────────────┬──────────┬─────────────────┐');
  console.log('      │ الدورة                          │ الحالة   │ السبب           │');
  console.log('      ├─────────────────────────────────┼──────────┼─────────────────┤');
  console.log('      │ مبادئ الفقه الإسلامي           │ ✅ مكتمل  │ درجة 85% ≥ 60%  │');
  console.log('      │ العقيدة الإسلامية              │ ⏰ قيد    │ مسجل، بدون درجة │');
  console.log('      │ علم الأصول                     │ 📖 غير   │ غير مسجل        │');
  console.log('      └─────────────────────────────────┴──────────┴─────────────────┘');
  console.log('');
  console.log('   💡 للاختبار: افتح /courses/660e8400-e29b-41d4-a716-446655440010');
  console.log('      ستشاهد الحالات الثلاث في قسم "المتطلبات السابقة"');

  // ============================================
  // TEST DATA FOR GRADES VISUAL TREND
  // ============================================
  console.log('📊 Creating Grades test data for visual trend...');

  // Helper to get letter grade
  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Find all student users in the system
  const allStudents = await prisma.user.findMany({
    where: { role: 'STUDENT' },
  });

  console.log(`   Found ${allStudents.length} student(s) in database`);

  // For each student, find their enrolled courses and create grades
  for (const studentUser of allStudents) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentUser.id },
      include: { course: true },
    });

    if (enrollments.length === 0) {
      console.log(`   ⚠️ Student ${studentUser.email} has no enrollments, skipping...`);
      continue;
    }

    // Delete existing seeded grades for this student
    await prisma.grade.deleteMany({
      where: {
        userId: studentUser.id,
        itemId: { startsWith: 'seed-' },
      },
    });

    const courses = enrollments.map((e) => e.course);
    console.log(`   Creating grades for ${studentUser.email} (${courses.length} courses)`);

    // Create grades showing improving trend across all enrolled courses
    const gradeScores = [65, 70, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95];
    let gradeIndex = 0;

    for (let i = 0; i < courses.length && gradeIndex < gradeScores.length; i++) {
      const course = courses[i];
      const types = ['EXAM', 'HOMEWORK', 'QUIZ', 'EXAM'];

      for (let j = 0; j < types.length && gradeIndex < gradeScores.length; j++) {
        const score = gradeScores[gradeIndex];
        const percentage = score;
        const daysAgo = 60 - gradeIndex * 5;
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        await prisma.grade.upsert({
          where: {
            userId_courseId_type_itemId: {
              userId: studentUser.id,
              courseId: course.id,
              type: types[j],
              itemId: `seed-${types[j].toLowerCase()}-${gradeIndex}`,
            },
          },
          update: {
            score: score,
            maxScore: 100,
            percentage: percentage,
            letterGrade: getLetterGrade(percentage),
            createdAt: createdAt,
          },
          create: {
            userId: studentUser.id,
            courseId: course.id,
            type: types[j],
            itemId: `seed-${types[j].toLowerCase()}-${gradeIndex}`,
            score: score,
            maxScore: 100,
            percentage: percentage,
            letterGrade: getLetterGrade(percentage),
            createdAt: createdAt,
          },
        });
        gradeIndex++;
      }
    }
    console.log(`   ✅ Created ${gradeIndex} grades for ${studentUser.email}`);
  }

  console.log('📊 Grades test data summary:');
  console.log('   - Created grades with improving trend (65% → 95%)');
  console.log('   - Grades span 60 days for trend visualization');
  console.log('   - Types: EXAM, HOMEWORK, QUIZ distributed across courses');

  // ============================================
  // TIMER UX TEST EXAMS (Multiple for different scenarios)
  // ============================================
  console.log('⏱️ Creating Timer UX test exams...');

  // EXAM 1: Very short (3 min) - Quick timer test
  const timerQuickExam = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: '⚡ اختبار سريع - 3 دقائق',
      description: 'امتحان سريع جداً لاختبار المؤقت. المدة: 3 دقائق فقط - سيظهر تنبيه فوري تقريباً!',
      durationMinutes: 3, // Very short - warning shows almost immediately
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2027-12-31T23:59:59'),
      maxScore: 100,
      passingScore: 60,
    },
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: timerQuickExam.id,
        prompt: 'ما هو أول ركن من أركان الإسلام؟',
        choices: JSON.stringify(['الشهادتان', 'الصلاة', 'الزكاة', 'الصوم']),
        correctIndex: 0,
        points: 50,
        order: 1,
      },
      {
        examId: timerQuickExam.id,
        prompt: 'كم عدد أركان الإيمان؟',
        choices: JSON.stringify(['خمسة', 'ستة', 'سبعة', 'أربعة']),
        correctIndex: 1,
        points: 50,
        order: 2,
      },
    ],
  });

  // EXAM 2: Standard test (6 min) - Warning at 5 minutes
  const timerTestExam = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: '⏱️ اختبار الوقت - 6 دقائق',
      description: 'امتحان تجريبي لاختبار واجهة المؤقت. المدة: 6 دقائق (سيظهر تنبيه صوتي عند الدقيقة 5)',
      durationMinutes: 6, // Warning triggers at 5 minutes remaining
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2027-12-31T23:59:59'),
      maxScore: 100,
      passingScore: 60,
    },
  });

  // Create 10 questions to test navigation sidebar
  await prisma.examQuestion.createMany({
    data: [
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الأول: ما هو أول ركن من أركان الإسلام؟',
        choices: JSON.stringify(['الشهادتان', 'الصلاة', 'الزكاة', 'الصوم']),
        correctIndex: 0,
        points: 10,
        order: 1,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الثاني: كم عدد الصلوات المفروضة في اليوم؟',
        choices: JSON.stringify(['ثلاث', 'أربع', 'خمس', 'ست']),
        correctIndex: 2,
        points: 10,
        order: 2,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الثالث: في أي شهر يكون صيام رمضان؟',
        choices: JSON.stringify(['شعبان', 'رمضان', 'شوال', 'ذو الحجة']),
        correctIndex: 1,
        points: 10,
        order: 3,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الرابع: ما هو نصاب الزكاة في النقود؟',
        choices: JSON.stringify(['85 غرام ذهب', '100 غرام ذهب', '50 غرام ذهب', '200 غرام ذهب']),
        correctIndex: 0,
        points: 10,
        order: 4,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الخامس: متى يجب الحج على المسلم؟',
        choices: JSON.stringify(['كل سنة', 'مرة في العمر', 'كل خمس سنوات', 'كل عشر سنوات']),
        correctIndex: 1,
        points: 10,
        order: 5,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال السادس: ما هو أول ما يحاسب عليه العبد يوم القيامة؟',
        choices: JSON.stringify(['الزكاة', 'الصيام', 'الصلاة', 'الحج']),
        correctIndex: 2,
        points: 10,
        order: 6,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال السابع: كم عدد ركعات صلاة الفجر؟',
        choices: JSON.stringify(['ركعتان', 'ثلاث ركعات', 'أربع ركعات', 'ركعة واحدة']),
        correctIndex: 0,
        points: 10,
        order: 7,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال الثامن: ما هي سورة الفاتحة؟',
        choices: JSON.stringify(['أطول سورة', 'أقصر سورة', 'أم الكتاب', 'سورة التوحيد']),
        correctIndex: 2,
        points: 10,
        order: 8,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال التاسع: كم عدد أركان الإيمان؟',
        choices: JSON.stringify(['خمسة', 'ستة', 'سبعة', 'أربعة']),
        correctIndex: 1,
        points: 10,
        order: 9,
      },
      {
        examId: timerTestExam.id,
        prompt: 'السؤال العاشر: من هو خاتم الأنبياء والمرسلين؟',
        choices: JSON.stringify(['موسى عليه السلام', 'عيسى عليه السلام', 'محمد صلى الله عليه وسلم', 'إبراهيم عليه السلام']),
        correctIndex: 2,
        points: 10,
        order: 10,
      },
    ],
  });

  // EXAM 3: Long exam (15 min) - Normal duration
  const timerLongExam = await prisma.exam.create({
    data: {
      courseId: course1.id,
      title: '📝 امتحان عادي - 15 دقيقة',
      description: 'امتحان بمدة عادية. سيتحول لون المؤقت من أخضر (>10 دقائق) إلى برتقالي (5-10 دقائق) إلى أحمر (<5 دقائق)',
      durationMinutes: 15, // Normal duration to see color transitions
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2027-12-31T23:59:59'),
      maxScore: 100,
      passingScore: 60,
    },
  });

  await prisma.examQuestion.createMany({
    data: [
      {
        examId: timerLongExam.id,
        prompt: 'ما هي أركان الإسلام الخمسة؟',
        choices: JSON.stringify([
          'الشهادتان، الصلاة، الزكاة، الصوم، الحج',
          'الإيمان، الصلاة، الصدق، الصوم، الحج',
          'التوحيد، الصلاة، الزكاة، الجهاد، الحج',
          'الشهادتان، الصلاة، الصدقة، الصوم، العمرة',
        ]),
        correctIndex: 0,
        points: 25,
        order: 1,
      },
      {
        examId: timerLongExam.id,
        prompt: 'ما هو حكم صلاة الجماعة؟',
        choices: JSON.stringify(['فرض عين', 'فرض كفاية', 'سنة مؤكدة', 'مستحب']),
        correctIndex: 2,
        points: 25,
        order: 2,
      },
      {
        examId: timerLongExam.id,
        prompt: 'متى فرضت الصلاة؟',
        choices: JSON.stringify(['في ليلة الإسراء والمعراج', 'في غزوة بدر', 'في فتح مكة', 'في الهجرة']),
        correctIndex: 0,
        points: 25,
        order: 3,
      },
      {
        examId: timerLongExam.id,
        prompt: 'ما هو الركن الأعظم في الصلاة؟',
        choices: JSON.stringify(['التكبير', 'القيام', 'الركوع', 'السجود']),
        correctIndex: 3,
        points: 25,
        order: 4,
      },
    ],
  });

  console.log('⏱️ Timer UX Test Exams created:');
  console.log('   📌 ⚡ اختبار سريع - 3 دقائق:');
  console.log('      - 2 أسئلة فقط');
  console.log('      - تنبيه فوري تقريباً (أقل من 5 دقائق من البداية)');
  console.log('      - مثالي لاختبار التنبيه الصوتي والألوان بسرعة');
  console.log('   📌 ⏱️ اختبار الوقت - 6 دقائق:');
  console.log('      - 10 أسئلة لاختبار التنقل');
  console.log('      - تنبيه عند الدقيقة 5');
  console.log('   📌 📝 امتحان عادي - 15 دقيقة:');
  console.log('      - 4 أسئلة');
  console.log('      - لمشاهدة تحول الألوان: أخضر → برتقالي → أحمر');
  console.log('   🔗 Test URL: /dashboard/exams');

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

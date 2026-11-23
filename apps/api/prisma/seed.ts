import {
  PrismaClient,
  Role,
  PaymentStatus,
  TicketCategory,
  TicketStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student.demo@brightpath.test' },
    update: {},
    create: {
      email: 'student.demo@brightpath.test',
      passwordHash,
      role: Role.student,
      displayName: 'Demo Student',
      student: {
        create: { demoTag: 'demo' },
      },
    },
    include: { student: true },
  });

  await prisma.user.upsert({
    where: { email: 'finance.demo@brightpath.test' },
    update: {},
    create: {
      email: 'finance.demo@brightpath.test',
      passwordHash,
      role: Role.finance_reviewer,
      displayName: 'Demo Finance',
    },
  });

  await prisma.user.upsert({
    where: { email: 'support.demo@brightpath.test' },
    update: {},
    create: {
      email: 'support.demo@brightpath.test',
      passwordHash,
      role: Role.support_agent,
      displayName: 'Support Team Lead',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin.demo@brightpath.test' },
    update: {},
    create: {
      email: 'admin.demo@brightpath.test',
      passwordHash,
      role: Role.admin,
      displayName: 'Platform Admin',
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: 'upsc-foundation' },
    update: {},
    create: {
      name: 'UPSC Foundation 2026',
      slug: 'upsc-foundation',
      description: 'Comprehensive UPSC prep program',
    },
  });

  if (studentUser.student) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: studentUser.student.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        studentId: studentUser.student.id,
        courseId: course.id,
      },
    });
  }

  await prisma.scheduleEvent.deleteMany({ where: { courseId: course.id } });

  const sessionTopics = [
    { title: 'Indian Polity — Federalism', description: 'Centre–state relations, schedules, and case laws.' },
    { title: 'Economy — RBI & monetary policy', description: 'Repo rate, inflation targeting, and banking reforms.' },
    { title: 'Modern History — Freedom movement', description: 'Gandhian phase, INA, and partition context.' },
    { title: 'CSAT — Data interpretation', description: 'Tables, percentages, and trend charts practice.' },
    { title: 'Essay writing — Governance themes', description: 'Structure, thesis, and counter-arguments.' },
    { title: 'Geography — Climate & monsoon', description: 'El Niño, jet streams, and agriculture linkages.' },
    { title: 'Ethics — Case study workshop', description: 'Apply principles to real-world dilemma prompts.' },
    { title: 'Current affairs — Weekly roundup', description: 'PIB, schemes, and editorials distilled for Mains.' },
  ];

  const scheduleStarts: Date[] = [];
  const base = new Date();
  base.setHours(18, 0, 0, 0);
  for (let offset = 0; offset < 30; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const dow = d.getDay();
    if ([1, 3, 5, 6].includes(dow)) {
      scheduleStarts.push(new Date(d));
    }
  }

  let topicIdx = 0;
  for (const startsAt of scheduleStarts) {
    const topic = sessionTopics[topicIdx % sessionTopics.length];
    topicIdx += 1;
    await prisma.scheduleEvent.create({
      data: {
        courseId: course.id,
        title: topic.title,
        startsAt,
        description: `${topic.description} · Live class with Q&A · Recording uploaded within 24h.`,
      },
    });
  }

  await prisma.faqDocument.upsert({
    where: { sourceKey: 'faq-class-schedule' },
    update: {
      title: 'Class schedule FAQ',
      content:
        'Live classes are listed in your dashboard. The next scheduled class appears under Upcoming Events.',
    },
    create: {
      sourceKey: 'faq-class-schedule',
      title: 'Class schedule FAQ',
      courseId: course.id,
      content:
        'Live classes are listed in your dashboard. The next scheduled class appears under Upcoming Events.',
    },
  });

  await prisma.troubleshootingPlaybook.upsert({
    where: { slug: 'android-video-l1' },
    update: {},
    create: {
      slug: 'android-video-l1',
      title: 'Android video playback L1',
      androidOnly: true,
      steps: [
        { step: 1, action: 'Force stop the app and clear app cache' },
        { step: 2, action: 'Disable battery optimization for BrightPath' },
        { step: 3, action: 'Switch to Wi‑Fi and retry playback' },
        {
          step: 4,
          action:
            'Known issue: some Android WebView versions fail on DRM — we are shipping a fix; escalate if still broken',
        },
      ],
    },
  });

  if (studentUser.student) {
    const payments = [
      {
        providerRef: 'DEMO-REV-pending-001',
        status: PaymentStatus.pending,
        amountCents: 499900,
        description: 'Course installment — pending bank confirmation',
      },
      {
        providerRef: 'DEMO-OK-paid-001',
        status: PaymentStatus.succeeded,
        amountCents: 99900,
        description: 'Add-on test series',
      },
    ];
    for (const p of payments) {
      await prisma.paymentTransaction.upsert({
        where: { providerRef: p.providerRef },
        update: { status: p.status },
        create: {
          studentId: studentUser.student.id,
          ...p,
        },
      });
    }

    await prisma.ticket.deleteMany({
      where: { studentId: studentUser.student.id },
    });

    const now = Date.now();
    const demoTickets: {
      category: TicketCategory;
      status: TicketStatus;
      summary: string;
      aiResolved: boolean;
      channel: string;
      offsetDays: number;
    }[] = [
      {
        category: TicketCategory.course_content,
        status: TicketStatus.resolved,
        summary: 'Asked when Polity Module 4 live class runs — answered from timetable.',
        aiResolved: true,
        channel: 'web_chat',
        offsetDays: 2,
      },
      {
        category: TicketCategory.video_app,
        status: TicketStatus.in_progress,
        summary: 'Android app buffering on LTE; playbook steps shared, monitoring device report.',
        aiResolved: false,
        channel: 'web_chat',
        offsetDays: 1,
      },
      {
        category: TicketCategory.payment,
        status: TicketStatus.open,
        summary: 'Installment DEMO-REV-pending-001 shows pending after bank debit.',
        aiResolved: false,
        channel: 'web_chat',
        offsetDays: 0,
      },
      {
        category: TicketCategory.refund,
        status: TicketStatus.escalated,
        summary: 'Refund request for add-on test series — awaiting finance approval.',
        aiResolved: false,
        channel: 'web_chat',
        offsetDays: 4,
      },
      {
        category: TicketCategory.login_account,
        status: TicketStatus.resolved,
        summary: 'Password reset link not received — resent to registered email.',
        aiResolved: true,
        channel: 'email',
        offsetDays: 6,
      },
    ];

    for (const t of demoTickets) {
      const createdAt = new Date(now - t.offsetDays * 24 * 60 * 60 * 1000);
      await prisma.ticket.create({
        data: {
          studentId: studentUser.student.id,
          category: t.category,
          status: t.status,
          summary: t.summary,
          aiResolved: t.aiResolved,
          channel: t.channel,
          escalatedAt:
            t.status === TicketStatus.escalated ? createdAt : undefined,
          createdAt,
          updatedAt: createdAt,
        },
      });
    }
  }

  console.log('Seed complete (password demo1234):', {
    student: studentUser.email,
    finance: 'finance.demo@brightpath.test',
    support: 'support.demo@brightpath.test',
    admin: 'admin.demo@brightpath.test',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
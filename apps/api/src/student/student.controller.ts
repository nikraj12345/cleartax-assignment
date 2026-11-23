import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

type Authed = {
  user: { studentId?: string; role: Role };
};

@Controller('v1/student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.student)
export class StudentController {
  constructor(private prisma: PrismaService) {}

  @Get('overview')
  async overview(@Req() req: Authed) {
    const studentId = req.user.studentId;
    if (!studentId) throw new BadRequestException('No student profile');

    const [enrollments, schedules, tickets, payments, conversations] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: { studentId },
          include: { course: true },
        }),
        this.prisma.scheduleEvent.findMany({
          where: {
            course: {
              enrollments: { some: { studentId } },
            },
            startsAt: { gte: new Date() },
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
          include: { course: true },
        }),
        this.prisma.ticket.findMany({
          where: { studentId },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
        this.prisma.paymentTransaction.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.conversation.count({ where: { studentId } }),
      ]);

    const openTickets = tickets.filter((t) =>
      ['open', 'in_progress', 'escalated'].includes(t.status),
    ).length;

    return {
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        name: e.course.name,
        slug: e.course.slug,
      })),
      upcomingSchedule: schedules.map((s) => ({
        id: s.id,
        title: s.title,
        course: s.course.name,
        startsAt: s.startsAt,
      })),
      tickets: tickets.map((t) => ({
        id: t.id,
        category: t.category,
        status: t.status,
        summary: t.summary,
        aiResolved: t.aiResolved,
        updatedAt: t.updatedAt,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        providerRef: p.providerRef,
        status: p.status,
        amountCents: p.amountCents,
        description: p.description,
        updatedAt: p.updatedAt,
      })),
      stats: {
        openTickets,
        conversationCount: conversations,
        pendingPayments: payments.filter((p) => p.status === 'pending').length,
      },
    };
  }

  @Get('schedule')
  async schedule(
    @Req() req: Authed,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const studentId = req.user.studentId;
    if (!studentId) throw new BadRequestException('No student profile');

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const events = await this.prisma.scheduleEvent.findMany({
      where: {
        course: { enrollments: { some: { studentId } } },
        startsAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { startsAt: 'asc' },
      include: { course: true },
    });

    return events.map((s) => ({
      id: s.id,
      title: s.title,
      course: s.course.name,
      startsAt: s.startsAt,
      description: s.description,
    }));
  }

  @Get('tickets')
  async tickets(@Req() req: Authed) {
    const studentId = req.user.studentId;
    if (!studentId) throw new BadRequestException('No student profile');
    return this.prisma.ticket.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get('tickets/:id')
  async ticketDetail(@Req() req: Authed, @Param('id') id: string) {
    const studentId = req.user.studentId;
    if (!studentId) throw new BadRequestException('No student profile');

    const ticket = await this.prisma.ticket.findFirst({
      where: { id, studentId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 8,
            },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return {
      ...ticket,
      conversation: ticket.conversation
        ? {
            id: ticket.conversation.id,
            messages: [...ticket.conversation.messages].reverse(),
          }
        : null,
    };
  }
}
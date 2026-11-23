import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PaymentStatus,
  RefundStatus,
  TicketCategory,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
@Injectable()
export class ToolsService {
  constructor(
    private prisma: PrismaService,
    private rag: RagService,
  ) {}

  private async audit(
    action: string,
    resourceType: string,
    resourceId: string | null,
    correlationId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditEvent.create({
      data: {
        action,
        resourceType,
        resourceId: resourceId ?? undefined,
        correlationId,
        metadata: metadata ?? {},
      },
    });
  }

  async getEnrollment(studentId: string, correlationId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: { course: true },
    });
    await this.audit('tool.get_enrollment', 'student', studentId, correlationId);
    return enrollments.map((e) => ({
      courseId: e.courseId,
      courseName: e.course.name,
      enrolledAt: e.enrolledAt,
    }));
  }

  async getUpcomingSchedule(studentId: string, correlationId: string) {
    const courseIds = (
      await this.prisma.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      })
    ).map((e) => e.courseId);
    const horizon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.scheduleEvent.findMany({
      where: {
        courseId: { in: courseIds },
        startsAt: { gte: new Date(), lte: horizon },
      },
      orderBy: { startsAt: 'asc' },
      take: 60,
      include: { course: true },
    });
    await this.audit('tool.get_schedule', 'student', studentId, correlationId);
    return events.map((ev) => ({
      title: ev.title,
      course: ev.course.name,
      startsAt: ev.startsAt,
      description: ev.description,
    }));
  }

  async searchKnowledge(
    studentId: string,
    query: string,
    correlationId: string,
  ) {
    const courseIds = (
      await this.prisma.enrollment.findMany({
        where: { studentId },
        select: { courseId: true },
      })
    ).map((e) => e.courseId);
    const hits = await this.rag.search(query, courseIds);
    await this.audit('tool.search_knowledge', 'student', studentId, correlationId, {
      query,
      hitCount: hits.length,
    });
    return hits;
  }

  async matchPlaybook(platform: string, correlationId: string) {
    const androidOnly = platform.toLowerCase().includes('android');
    const playbook = await this.prisma.troubleshootingPlaybook.findFirst({
      where: androidOnly ? { androidOnly: true, active: true } : { active: true },
      orderBy: { title: 'asc' },
    });
    if (!playbook) throw new NotFoundException('No playbook');
    await this.audit('tool.match_playbook', 'playbook', playbook.id, correlationId);
    return playbook;
  }

  async recordDeviceReport(
    studentId: string,
    body: {
      platform: string;
      appVersion?: string;
      errorCode?: string;
      rawSymptoms?: string;
    },
    correlationId: string,
  ) {
    const report = await this.prisma.deviceReport.create({
      data: { studentId, ...body },
    });
    await this.audit('tool.device_report', 'device_report', report.id, correlationId);
    return report;
  }

  async createTicket(
    studentId: string,
    category: TicketCategory,
    summary: string,
    correlationId: string,
    options?: { conversationId?: string; escalate?: boolean },
  ) {
    const escalate = options?.escalate ?? false;
    const ticket = await this.prisma.ticket.create({
      data: {
        studentId,
        category,
        channel: 'web_chat',
        status: escalate ? TicketStatus.escalated : TicketStatus.open,
        summary,
        conversationId: options?.conversationId,
        aiResolved: false,
        escalatedAt: escalate ? new Date() : undefined,
      },
    });
    await this.audit('tool.create_ticket', 'ticket', ticket.id, correlationId);
    return ticket;
  }

  async escalateTicket(ticketId: string, studentId: string, correlationId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.studentId !== studentId) {
      throw new ForbiddenException();
    }
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.escalated,
        escalatedAt: new Date(),
        aiResolved: false,
      },
    });
    await this.audit('tool.escalate', 'ticket', ticketId, correlationId);
    return updated;
  }

  async lookupPayment(studentId: string, providerRef: string, correlationId: string) {
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { providerRef },
    });
    if (!txn || txn.studentId !== studentId) throw new NotFoundException();
    await this.audit('tool.lookup_payment', 'payment', txn.id, correlationId);
    return txn;
  }

  async listRecentPayments(studentId: string, correlationId: string) {
    const txns = await this.prisma.paymentTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    await this.audit('tool.list_payments', 'student', studentId, correlationId);
    return txns;
  }

  explainReversalWindow() {
    return {
      message:
        'If your payment shows as failed but money was deducted, many banks reverse the hold within about 48 hours. We will notify you when we see a confirmed status from the bank—we cannot guarantee an exact reversal time.',
      typicalSelfResolveRate: 0.6,
    };
  }

  async createRefundRequest(
    studentId: string,
    paymentId: string,
    reason: string,
    correlationId: string,
  ) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.studentId !== studentId) {
      throw new ForbiddenException();
    }
    if (payment.status !== PaymentStatus.succeeded) {
      throw new BadRequestException('Refunds only for succeeded payments');
    }
    const existing = await this.prisma.refundRequest.findFirst({
      where: { paymentId, status: { not: RefundStatus.rejected } },
    });
    if (existing) return existing;

    const refund = await this.prisma.refundRequest.create({
      data: {
        studentId,
        paymentId,
        amountCents: payment.amountCents,
        reason,
        status: RefundStatus.pending_approval,
      },
    });
    await this.audit('tool.create_refund_request', 'refund', refund.id, correlationId);
    return refund;
  }

  async initiatePasswordReset(studentId: string, correlationId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) throw new NotFoundException();
    await this.prisma.notification.create({
      data: {
        userId: student.userId,
        channel: 'email',
        subject: 'Password reset initiated',
        body: 'Use the secure reset link sent to your registered email (demo: logged only).',
      },
    });
    await this.audit('tool.password_reset', 'student', studentId, correlationId);
    return { ok: true, message: 'Reset email queued' };
  }
}
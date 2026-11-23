import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketCategory, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrchestratorClient } from './orchestrator.client';

const intentToCategory: Record<string, TicketCategory> = {
  faq_course: 'course_content',
  video_troubleshoot: 'video_app',
  payment_issue: 'payment',
  refund_request: 'refund',
  account_recovery: 'login_account',
  unknown: 'other',
};

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private orchestrator: OrchestratorClient,
  ) {}

  async create(studentId: string, channel: string) {
    return this.prisma.conversation.create({
      data: { studentId, channel },
    });
  }

  async listForStudent(studentId: string) {
    return this.prisma.conversation.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  async get(conversationId: string, studentId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException();
    if (conv.studentId !== studentId) throw new ForbiddenException();
    return conv;
  }

  async sendMessage(
    conversationId: string,
    studentId: string,
    content: string,
  ) {
    const conv = await this.get(conversationId, studentId);
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
      },
    });

    const history = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await this.orchestrator.runTurn({
      conversationId,
      studentId,
      message: content,
      history,
    });

    const assistant = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: result.reply,
        metadata: {
          intent: result.intent,
          citations: result.citations,
          escalated: result.escalated,
        },
      },
    });

    let ticketId = result.ticketId;
    if (ticketId) {
      await this.prisma.ticket.updateMany({
        where: {
          id: ticketId,
          studentId,
          conversationId: null,
        },
        data: { conversationId },
      });
    } else {
      const category =
        intentToCategory[result.intent] ?? TicketCategory.other;
      const ticket = await this.prisma.ticket.create({
        data: {
          studentId,
          conversationId,
          category,
          channel: conv.channel,
          status: result.escalated
            ? TicketStatus.escalated
            : TicketStatus.in_progress,
          aiResolved: !result.escalated,
          escalatedAt: result.escalated ? new Date() : undefined,
          summary: content.slice(0, 200),
        },
      });
      ticketId = ticket.id;
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      message: assistant,
      intent: result.intent,
      ticketId,
      citations: result.citations,
    };
  }
}
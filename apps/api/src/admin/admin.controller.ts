import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('metrics')
  @Roles(Role.admin, Role.support_agent, Role.finance_reviewer)
  async metrics() {
    const byCategory = await this.prisma.ticket.groupBy({
      by: ['category'],
      _count: true,
    });
    const openTickets = await this.prisma.ticket.count({
      where: { status: { in: ['open', 'in_progress', 'escalated'] } },
    });
    const pendingRefunds = await this.prisma.refundRequest.count({
      where: { status: 'pending_approval' },
    });
    return { byCategory, openTickets, pendingRefunds };
  }

  @Get('tickets')
  @Roles(Role.admin, Role.support_agent)
  listTickets() {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { student: { include: { user: true } } },
    });
  }

  @Get('tickets/:id')
  @Roles(Role.admin, Role.support_agent)
  async ticketDetail(@Param('id') id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 12,
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
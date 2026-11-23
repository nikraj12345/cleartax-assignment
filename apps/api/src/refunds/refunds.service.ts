import { Injectable, NotFoundException } from '@nestjs/common';
import { RefundStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentGateway } from '../payments/mock-payment.gateway';
import { RefundStateMachine } from './refund.state-machine';

@Injectable()
export class RefundsService {
  constructor(
    private prisma: PrismaService,
    private gateway: MockPaymentGateway,
    private fsm: RefundStateMachine,
  ) {}

  listPending() {
    return this.prisma.refundRequest.findMany({
      where: { status: RefundStatus.pending_approval },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decide(
    refundId: string,
    reviewerId: string,
    role: Role,
    decision: 'approve' | 'reject',
    reason?: string,
  ) {
    this.fsm.assertRole(role);
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
    });
    if (!refund) throw new NotFoundException();
    const next = this.fsm.nextStatus(refund.status, decision);

    await this.prisma.$transaction(async (tx) => {
      await tx.refundApproval.create({
        data: {
          refundRequestId: refundId,
          reviewerId,
          decision,
          reason,
        },
      });
      await tx.refundRequest.update({
        where: { id: refundId },
        data: { status: next },
      });
    });

    if (next === RefundStatus.approved) {
      await this.executeApproved(refundId);
    }

    return this.prisma.refundRequest.findUnique({
      where: { id: refundId },
      include: { approval: true },
    });
  }

  async executeApproved(refundId: string) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id: refundId },
    });
    if (!refund || refund.status !== RefundStatus.approved) return;

    const result = await this.gateway.executeRefund({
      refundRequestId: refundId,
      amountCents: refund.amountCents,
      idempotencyKey: `refund-${refundId}`,
    });

    await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.processed,
        providerRefundRef: result.providerRefundRef,
      },
    });
  }
}
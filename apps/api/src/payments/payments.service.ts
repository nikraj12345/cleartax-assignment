import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  listForStudent(studentId: string) {
    return this.prisma.paymentTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll(limit = 100) {
    return this.prisma.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        student: { include: { user: { select: { email: true, displayName: true } } } },
      },
    });
  }

  async getForStudent(paymentId: string, studentId: string) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException();
    if (payment.studentId !== studentId) throw new ForbiddenException();
    return payment;
  }

  async applyWebhook(
    providerRef: string,
    status: PaymentStatus,
    idempotencyKey?: string,
  ) {
    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { providerRef },
    });
    if (!existing) {
      throw new NotFoundException('Unknown provider ref');
    }
    if (
      idempotencyKey &&
      existing.idempotencyKey === idempotencyKey &&
      existing.status === status
    ) {
      return existing;
    }
    return this.prisma.paymentTransaction.update({
      where: { providerRef },
      data: { status, idempotencyKey },
    });
  }

  async reconcilePending() {
    const pending = await this.prisma.paymentTransaction.findMany({
      where: { status: PaymentStatus.pending },
      take: 50,
    });
    const now = Date.now();
    const updates: string[] = [];
    for (const txn of pending) {
      const ageHours = (now - txn.createdAt.getTime()) / (1000 * 60 * 60);
      let next: PaymentStatus | null = null;
      if (ageHours > 48 && txn.providerRef.includes('DEMO-REV')) {
        next = PaymentStatus.reversed;
      } else if (ageHours > 1 && txn.providerRef.includes('DEMO-OK')) {
        next = PaymentStatus.succeeded;
      } else if (ageHours > 72) {
        next = PaymentStatus.failed;
      }
      if (next) {
        await this.prisma.paymentTransaction.update({
          where: { id: txn.id },
          data: { status: next },
        });
        updates.push(txn.id);
      }
    }
    return { reconciled: updates.length, ids: updates };
  }
}
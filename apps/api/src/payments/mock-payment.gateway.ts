import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class MockPaymentGateway {
  verifySignature(payload: string, signature: string | undefined) {
    const secret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET || 'mock-webhook-secret-demo';
    if (!signature) return false;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return expected === signature;
  }

  async executeRefund(input: {
    refundRequestId: string;
    amountCents: number;
    idempotencyKey: string;
  }) {
    return {
      providerRefundRef: `mock_refund_${input.refundRequestId.slice(0, 8)}`,
      status: 'processed' as const,
      idempotencyKey: input.idempotencyKey,
    };
  }
}
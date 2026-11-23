import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsService } from './payments.service';

class WebhookDto {
  @IsString()
  providerRef!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

@Controller('webhooks/payments')
export class WebhooksController {
  constructor(
    private gateway: MockPaymentGateway,
    private payments: PaymentsService,
  ) {}

  @Post('mock')
  async mock(
    @Headers('x-mock-signature') signature: string,
    @Body() body: WebhookDto,
  ) {
    const raw = JSON.stringify(body);
    if (!this.gateway.verifySignature(raw, signature)) {
      throw new BadRequestException('Invalid signature');
    }
    return this.payments.applyWebhook(
      body.providerRef,
      body.status,
      body.idempotencyKey,
    );
  }
}
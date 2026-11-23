import { Module } from '@nestjs/common';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [MockPaymentGateway, PaymentsService],
  exports: [MockPaymentGateway, PaymentsService],
})
export class PaymentsModule {}
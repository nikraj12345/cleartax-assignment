import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { RefundStateMachine } from './refund.state-machine';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PaymentsModule, AuthModule],
  controllers: [RefundsController],
  providers: [RefundsService, RefundStateMachine],
  exports: [RefundsService, RefundStateMachine],
})
export class RefundsModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ToolsModule } from './tools/tools.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { RefundsModule } from './refunds/refunds.module';
import { HealthModule } from './health/health.module';
import { RagModule } from './rag/rag.module';
import { WorkersModule } from './workers/workers.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    PrismaModule,
    AuthModule,
    ConversationsModule,
    ToolsModule,
    AdminModule,
    PaymentsModule,
    RefundsModule,
    HealthModule,
    RagModule,
    WorkersModule,
    StudentModule,
  ],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { RagModule } from '../rag/rag.module';
import { OrchestratorGuard } from '../auth/orchestrator.guard';

@Module({
  imports: [RagModule],
  controllers: [ToolsController],
  providers: [ToolsService, OrchestratorGuard],
  exports: [ToolsService],
})
export class ToolsModule {}
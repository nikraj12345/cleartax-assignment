import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketCategory } from '@prisma/client';
import { OrchestratorGuard } from '../auth/orchestrator.guard';
import { ToolsService } from './tools.service';

@Controller('internal/tools')
@UseGuards(OrchestratorGuard)
export class ToolsController {
  constructor(private tools: ToolsService) {}

  @Get('enrollment')
  enrollment(@Req() req: { studentId: string; correlationId: string }) {
    return this.tools.getEnrollment(req.studentId, req.correlationId);
  }

  @Get('schedule')
  schedule(@Req() req: { studentId: string; correlationId: string }) {
    return this.tools.getUpcomingSchedule(req.studentId, req.correlationId);
  }

  @Post('knowledge/search')
  search(
    @Req() req: { studentId: string; correlationId: string },
    @Body() body: { query: string },
  ) {
    return this.tools.searchKnowledge(req.studentId, body.query, req.correlationId);
  }

  @Post('playbook/match')
  playbook(
    @Req() req: { correlationId: string },
    @Body() body: { platform: string },
  ) {
    return this.tools.matchPlaybook(body.platform, req.correlationId);
  }

  @Post('device-report')
  deviceReport(
    @Req() req: { studentId: string; correlationId: string },
    @Body()
    body: {
      platform: string;
      appVersion?: string;
      errorCode?: string;
      rawSymptoms?: string;
    },
  ) {
    return this.tools.recordDeviceReport(req.studentId, body, req.correlationId);
  }

  @Post('tickets')
  createTicket(
    @Req() req: { studentId: string; correlationId: string },
    @Body()
    body: {
      category: TicketCategory;
      summary: string;
      conversationId?: string;
      escalate?: boolean;
    },
  ) {
    return this.tools.createTicket(
      req.studentId,
      body.category,
      body.summary,
      req.correlationId,
      {
        conversationId: body.conversationId,
        escalate: body.escalate,
      },
    );
  }

  @Post('tickets/:id/escalate')
  escalate(
    @Req() req: { studentId: string; correlationId: string },
    @Param('id') id: string,
  ) {
    return this.tools.escalateTicket(id, req.studentId, req.correlationId);
  }

  @Get('payments/by-ref/:providerRef')
  paymentByRef(
    @Req() req: { studentId: string; correlationId: string },
    @Param('providerRef') providerRef: string,
  ) {
    return this.tools.lookupPayment(req.studentId, providerRef, req.correlationId);
  }

  @Get('payments/recent')
  recentPayments(@Req() req: { studentId: string; correlationId: string }) {
    return this.tools.listRecentPayments(req.studentId, req.correlationId);
  }

  @Get('payments/reversal-guidance')
  reversalGuidance() {
    return this.tools.explainReversalWindow();
  }

  @Post('refunds')
  createRefund(
    @Req() req: { studentId: string; correlationId: string },
    @Body() body: { paymentId: string; reason: string },
  ) {
    return this.tools.createRefundRequest(
      req.studentId,
      body.paymentId,
      body.reason,
      req.correlationId,
    );
  }

  @Post('account/password-reset')
  passwordReset(@Req() req: { studentId: string; correlationId: string }) {
    return this.tools.initiatePasswordReset(req.studentId, req.correlationId);
  }
}
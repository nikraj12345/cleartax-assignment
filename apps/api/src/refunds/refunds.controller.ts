import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RefundsService } from './refunds.service';

class DecisionDto {
  @IsEnum(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('v1/admin/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.finance_reviewer, Role.admin)
export class RefundsController {
  constructor(private refunds: RefundsService) {}

  @Get()
  list() {
    return this.refunds.listPending();
  }

  @Patch(':id')
  decide(
    @Req() req: { user: { userId: string; role: Role } },
    @Param('id') id: string,
    @Body() body: DecisionDto,
  ) {
    return this.refunds.decide(
      id,
      req.user.userId,
      req.user.role,
      body.decision,
      body.reason,
    );
  }
}
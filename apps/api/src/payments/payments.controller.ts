import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('v1/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Get()
  list(@Req() req: { user: { studentId?: string; role: Role } }) {
    if (req.user.role === Role.student) {
      if (!req.user.studentId) throw new Error('Students only');
      return this.payments.listForStudent(req.user.studentId);
    }
    return [];
  }

  @Get('admin/transactions')
  @UseGuards(RolesGuard)
  @Roles(Role.finance_reviewer, Role.admin, Role.support_agent)
  adminList() {
    return this.payments.listAll();
  }

  @Get(':id/status')
  status(@Req() req: { user: { studentId?: string } }, @Param('id') id: string) {
    const studentId = req.user.studentId;
    if (!studentId) throw new Error('Students only');
    return this.payments.getForStudent(id, studentId);
  }
}
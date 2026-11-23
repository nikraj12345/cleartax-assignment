import { BadRequestException, Injectable } from '@nestjs/common';
import { RefundStatus, Role } from '@prisma/client';

const transitions: Record<
  RefundStatus,
  Partial<Record<'approve' | 'reject' | 'process', RefundStatus>>
> = {
  submitted: {},
  pending_approval: {
    approve: RefundStatus.approved,
    reject: RefundStatus.rejected,
  },
  approved: { process: RefundStatus.processed },
  rejected: {},
  processed: {},
};

@Injectable()
export class RefundStateMachine {
  assertRole(role: Role) {
    if (role !== Role.finance_reviewer && role !== Role.admin) {
      throw new BadRequestException('Finance role required');
    }
  }

  nextStatus(
    current: RefundStatus,
    action: 'approve' | 'reject' | 'process',
  ): RefundStatus {
    const next = transitions[current]?.[action];
    if (!next) {
      throw new BadRequestException(
        `Cannot ${action} refund in status ${current}`,
      );
    }
    return next;
  }
}
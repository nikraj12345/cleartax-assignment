import { RefundStatus, Role } from '@prisma/client';
import { RefundStateMachine } from './refund.state-machine';

describe('RefundStateMachine', () => {
  const fsm = new RefundStateMachine();

  it('allows approve from pending_approval', () => {
    expect(fsm.nextStatus(RefundStatus.pending_approval, 'approve')).toBe(
      RefundStatus.approved,
    );
  });

  it('rejects student role', () => {
    expect(() => fsm.assertRole(Role.student)).toThrow();
  });
});
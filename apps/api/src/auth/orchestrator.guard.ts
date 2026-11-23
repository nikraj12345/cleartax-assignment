import { randomUUID } from 'crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class OrchestratorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-orchestrator-token'] as string | undefined;
    const expected = process.env.ORCHESTRATOR_SERVICE_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid orchestrator token');
    }
    const studentId = req.headers['x-student-context'] as string | undefined;
    if (!studentId) {
      throw new UnauthorizedException('Missing student context');
    }
    req.studentId = studentId;
    req.correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();
    return true;
  }
}
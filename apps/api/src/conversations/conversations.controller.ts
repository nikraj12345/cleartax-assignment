import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';

class CreateConversationDto {
  @IsOptional()
  @IsString()
  channel?: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

type AuthedReq = { user: { studentId?: string } };

function requireStudentId(req: AuthedReq) {
  if (!req.user.studentId) throw new BadRequestException('Students only');
  return req.user.studentId;
}

@Controller('v1/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversations: ConversationsService) {}

  @Post()
  create(@Req() req: AuthedReq, @Body() body: CreateConversationDto) {
    return this.conversations.create(
      requireStudentId(req),
      body.channel || 'web_chat',
    );
  }

  @Get()
  list(@Req() req: AuthedReq) {
    return this.conversations.listForStudent(requireStudentId(req));
  }

  @Get(':id')
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.conversations.get(id, requireStudentId(req));
  }

  @Post(':id/messages')
  send(@Req() req: AuthedReq, @Param('id') id: string, @Body() body: SendMessageDto) {
    return this.conversations.sendMessage(id, requireStudentId(req), body.content);
  }
}
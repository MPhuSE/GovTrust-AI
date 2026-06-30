import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PriorityService } from './priority.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';

@ApiTags('Priority')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('priority')
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Danh sách hồ sơ xếp theo ưu tiên A/B/C/D + SLA (Bước 10)' })
  getQueue() {
    return this.priorityService.getQueue();
  }
}

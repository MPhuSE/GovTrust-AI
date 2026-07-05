import { Controller, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecheckService } from './recheck.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/schemas/user.schema';

@ApiTags('Recheck')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class RecheckController {
  constructor(private readonly recheckService: RecheckService) {}

  @Post(':id/recheck')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Gov Re-Check — cán bộ tái kiểm hồ sơ, phát hiện riskFlags (Bước 9)' })
  recheck(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() payload: { decision: string; note: string }
  ) {
    return this.recheckService.recheck(id, user.userId, payload.decision, payload.note);
  }
}

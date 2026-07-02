import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/schemas/user.schema';
import { CreateEmbeddingJobDto } from './jobs.dto';
import { JobsService } from './jobs.service';

@ApiTags('Async jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post('embeddings')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Embedding và ingest legal chunks vào Qdrant bất đồng bộ' })
  createEmbedding(@Body() dto: CreateEmbeddingJobDto) {
    return this.jobs.createEmbedding(dto);
  }

  @Get(':id')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Theo dõi trạng thái và kết quả job' })
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }
}


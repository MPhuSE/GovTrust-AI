import { Controller, HttpCode, HttpStatus, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';

@ApiTags('Scoring')
@Controller('sessions')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post(':id/crosscheck')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'CrossCheck đối chiếu chéo giấy tờ (Bước 4)' })
  crosscheck(@Param('id') id: string) {
    return this.scoringService.crosscheck(id);
  }

  @Post(':id/score')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Chấm điểm hồ sơ 0–100 (Bước 5)' })
  score(@Param('id') id: string) {
    return this.scoringService.score(id);
  }

  @Post(':id/lawguard')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'LawGuard — tra cứu căn cứ pháp lý RAG (Bước 6)' })
  lawguard(@Param('id') id: string) {
    return this.scoringService.lawguard(id);
  }
}

import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProceduresService } from './procedures.service';
import { IdentifyDto, ConsultDto } from './procedures.dto';

@ApiTags('Procedures')
@Controller('procedures')
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thủ tục hành chính' })
  findAll() {
    return this.proceduresService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết thủ tục + checklist giấy tờ' })
  findOne(@Param('code') code: string) {
    return this.proceduresService.findByCode(code);
  }

  @Post('identify')
  @ApiOperation({ summary: 'HoSoBot — nhận diện thủ tục từ câu hỏi tự nhiên (Bước 1)' })
  identify(@Body() body: IdentifyDto) {
    return this.proceduresService.identify(body.userQuery);
  }

  @Post('consult')
  @ApiOperation({ summary: 'SmartBot — tư vấn thủ tục từ Qdrant RAG khi người dân đã chọn thủ tục' })
  consult(@Body() body: ConsultDto) {
    return this.proceduresService.consult(body.question, body.procedureCode, body.topK);
  }
}

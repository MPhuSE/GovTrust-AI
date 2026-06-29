import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SmartFormService } from './smartform.service';

@ApiTags('SmartForm')
@Controller('sessions')
export class SmartFormController {
  constructor(private readonly smartFormService: SmartFormService) {}

  @Post(':id/smartform')
  @ApiOperation({ summary: 'SmartForm — tự điền form từ dữ liệu OCR (Bước 7)' })
  generate(@Param('id') id: string) {
    return this.smartFormService.generate(id);
  }
}

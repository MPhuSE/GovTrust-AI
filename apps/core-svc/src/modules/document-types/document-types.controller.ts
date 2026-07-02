import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentTypesService } from './document-types.service';

@ApiTags('DocumentTypes')
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly service: DocumentTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh mục loại giấy tờ (catalog dùng chung)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Chi tiết loại giấy tờ + field schema' })
  findOne(@Param('code') code: string) {
    return this.service.findByCode(code);
  }
}

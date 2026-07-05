import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SmartFormService } from './smartform.service';
import { RenderSmartFormDto } from './smartform.dto';

@ApiTags('SmartForm')
@Controller('sessions')
export class SmartFormController {
  constructor(private readonly smartFormService: SmartFormService) {}

  @Post(':id/smartform')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'SmartForm — tự điền form từ dữ liệu OCR (Bước 7)' })
  generate(@Param('id') id: string) {
    return this.smartFormService.generate(id);
  }

  @Get(':id/smartform')
  @ApiOperation({ summary: 'Lấy form view để hiển thị trên UI (chưa render DOCX)' })
  async getFormView(@Param('id') id: string) {
    return this.smartFormService.runGenerateNow(id);
  }

  @Post(':id/smartform/render')
  @ApiOperation({ summary: 'Lưu phần người dùng chỉnh sửa trước khi xuất tờ khai' })
  render(@Param('id') id: string, @Body() body: RenderSmartFormDto) {
    return this.smartFormService.render(id, body.values);
  }

  @Get(':id/smartform/:format')
  @ApiOperation({ summary: 'Tải tờ khai đã điền ở định dạng DOCX hoặc PDF' })
  async download(
    @Param('id') id: string,
    @Param('format') format: string,
    @Res() response: Response,
  ) {
    if (format !== 'docx' && format !== 'pdf') {
      return response.status(400).json({ message: 'Chỉ hỗ trợ định dạng docx hoặc pdf' });
    }
    const file = await this.smartFormService.getDocument(id, format);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    return response.send(file.buffer);
  }
}

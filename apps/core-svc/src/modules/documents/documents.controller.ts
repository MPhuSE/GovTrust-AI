import { Controller, Post, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadFileDto, TriggerOcrDto } from './dto/upload.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload giấy tờ (Bước 2)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Body() body: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(body, file);
  }

  @Post(':sessionId/ocr/:documentTypeCode')
  @ApiOperation({ summary: 'Trigger OCR cho giấy tờ (Bước 3) — gọi VNPT API qua ai-svc' })
  triggerOcr(
    @Param('sessionId') sessionId: string,
    @Param('documentTypeCode') documentTypeCode: string,
    @Body() body?: TriggerOcrDto,
  ) {
    return this.documentsService.triggerOcr(sessionId, documentTypeCode, body?.checklistId);
  }
}

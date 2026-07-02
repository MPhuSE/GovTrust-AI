import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ example: '665f1b2c9a1e4a0012345678', description: 'ID phiên kiểm tra' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'CCCD', description: 'Mã loại giấy tờ (CCCD, GIAY_KHAI_SINH, ...)' })
  @IsString()
  @IsNotEmpty()
  documentTypeCode: string;
}

export class UploadFileDto extends UploadDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File ảnh/PDF giấy tờ' })
  file: any;
}

export class TriggerOcrDto {
  @ApiPropertyOptional({
    example: 'cccd_cha_me',
    description: 'Slot checklist mà giấy này điền vào; mặc định = documentTypeCode',
  })
  @IsOptional()
  @IsString()
  checklistId?: string;
}

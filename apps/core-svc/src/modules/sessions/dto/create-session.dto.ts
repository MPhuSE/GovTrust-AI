import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: '665f1b2c9a1e4a0012345678',
    description: 'ObjectId của thủ tục (procedure) người dân đã chọn',
  })
  @IsMongoId()
  @IsNotEmpty()
  procedureId: string;
}

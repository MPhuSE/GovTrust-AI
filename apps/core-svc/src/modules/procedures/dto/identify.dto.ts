import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IdentifyDto {
  @ApiProperty({
    example: 'Tôi muốn đăng ký khai sinh cho con',
    description: 'Câu hỏi tự nhiên của người dân để HoSoBot nhận diện thủ tục',
  })
  @IsString()
  @IsNotEmpty()
  userQuery: string;
}

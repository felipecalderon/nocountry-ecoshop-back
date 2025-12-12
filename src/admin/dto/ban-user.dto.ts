import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class BanUserDto {
  @ApiProperty({
    description:
      'Estado de bloqueo del usuario. True para banear, False para activar.',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isBanned: boolean;
}

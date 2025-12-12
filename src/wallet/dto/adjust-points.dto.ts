import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty({
    description: 'ID del usuario a ajustar',
    example: 'uuid-user',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description:
      'Cantidad de puntos (Positivo para sumar, Negativo para restar)',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Razón del ajuste',
    example: 'Compensación por error en orden #123',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty({
    description: 'ID único de la recompensa o causa benéfica a canjear',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El rewardId debe ser un UUID válido' })
  @IsNotEmpty()
  rewardId: string;

  @ApiProperty({
    description: 'Cantidad de puntos a utilizar en el canje',
    minimum: 1,
    example: 100,
  })
  @IsInt({ message: 'El monto debe ser un número entero' })
  @Min(1, { message: 'El monto mínimo de canje es 1 punto' })
  amount: number;
}

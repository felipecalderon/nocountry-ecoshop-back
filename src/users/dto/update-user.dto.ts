import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre de pila', example: 'Facundo' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido', example: 'Ortiz' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'DNI o Identificación fiscal',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+5491122334455',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO 8601)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;
}

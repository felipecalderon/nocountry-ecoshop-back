import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar usuario desde Auth0',
    description:
      'Recibe un JWT válido de Auth0, verifica si el usuario existe en BD local. Si no, lo crea. Retorna el usuario de la BD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario validado/creado exitosamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de Auth0 inválido o expirado.',
  })
  login(@GetUser() user: User) {
    return {
      message: 'Inicio de sesión exitoso',
      user: user,
    };
  }
}

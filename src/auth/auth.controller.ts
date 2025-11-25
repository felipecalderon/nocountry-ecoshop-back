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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  login(@GetUser() user: User) {
    return {
      message: 'Inicio de sesión exitoso',
      user: user,
    };
  }
}

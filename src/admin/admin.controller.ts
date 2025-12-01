import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Métricas globales de la plataforma',
    description: 'Devuelve el resumen financiero y ecológico total de EcoShop.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas calculadas correctamente.',
    type: AdminStatsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden. Requiere rol ADMIN.' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('users/:id/ban')
  @ApiOperation({
    summary: 'Banear o Desbanear usuario',
    description:
      'Bloquea el acceso de un usuario a la plataforma. El usuario no podrá loguearse ni comprar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado (isBanned).',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto (ej: intentar banearse a uno mismo).',
  })
  @ApiBody({ type: BanUserDto })
  async toggleUserBan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() banUserDto: BanUserDto,
    @GetUser() admin: User,
  ) {
    return this.adminService.toggleUserBan(id, banUserDto, admin.id);
  }
}

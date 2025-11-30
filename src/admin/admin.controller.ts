import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminStatsDto } from './dto/admin-stats.dto';

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
}

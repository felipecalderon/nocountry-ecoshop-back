import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from '../services/wallet.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { RedeemPointsDto } from '../dto/redeem-points.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateRewardDto } from '../dto/create-reward.dto';

@ApiTags('Eco-Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Obtener saldo actual, nivel y estado de la billetera',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retorna el objeto wallet con el saldo y nivel actual.',
  })
  async getBlance(@GetUser() user: User) {
    return this.walletService.getBalance(user.id);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ver historial de transacciones (Ganancias y Canjes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de las últimas transacciones ordenadas por fecha.',
  })
  async getHistory(@GetUser() user: User) {
    return this.walletService.getHistory(user.id);
  }

  @Post('redeem')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Canjear puntos por una recompensa' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Canje exitoso. Retorna el nuevo saldo y ID de transacción.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Error de negocio: Saldo insuficiente o Stock agotado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error de validación o recompensa inactiva.',
  })
  async redeemPoints(
    @GetUser() user: User,
    @Body() redeemDto: RedeemPointsDto,
  ) {
    return this.walletService.redeemPoints(user.id, redeemDto);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Listar catálogo de recompensas activas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de recompensas disponibles para canje.',
  })
  async getRewards() {
    return this.walletService.findAllRewards();
  }

  @Post('rewards')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear nueva recompensa (Solo Admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recompensa creada correctamente en el catálogo.',
  })
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return this.walletService.createReward(createRewardDto);
  }

  @Get('coupons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis cupones generados' })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    type: Boolean,
    description:
      'Filtro de estado. Si es true (por defecto), devuelve SOLO cupones válidos (no usados y no vencidos), ideal para mostrar en el Checkout. Si es false, devuelve todo el historial histórico de cupones (usados y vencidos).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cupones pertenecientes al usuario.',
  })
  async getMyCoupons(@GetUser() user: User) {
    return this.walletService.getMyCoupons(user.id, true);
  }
}

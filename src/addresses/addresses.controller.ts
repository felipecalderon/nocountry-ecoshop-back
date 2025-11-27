import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('Direcciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva dirección' })
  @ApiResponse({ status: 201, description: 'Dirección creada exitosamente.' })
  create(@Body() createAddressDto: CreateAddressDto, @GetUser() user: User) {
    return this.addressesService.create(createAddressDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis direcciones' })
  findAll(@GetUser() user: User) {
    return this.addressesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una dirección por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.addressesService.findOne(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una dirección' })
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.addressesService.remove(id, user);
  }
}

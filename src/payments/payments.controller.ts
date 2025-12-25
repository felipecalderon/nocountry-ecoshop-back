import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-checkout-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear sesión de pago en Stripe' })
  @ApiBody({
    schema: {
      example: {
        orderId: 'uuid-de-la-orden',
        returnUrl: 'http://localhost:3000/abc123',
      },
    },
  })
  createCheckoutSession(
    @Body('orderId') orderId: string,
    @Body('returnUrl') returnUrl: string,
    @GetUser() user: User,
  ) {
    return this.paymentsService.createCheckoutSession(orderId, user, returnUrl);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de Stripe' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RequestWithRawBody,
  ) {
    if (!signature) {
      throw new BadRequestException('Falta la firma de Stripe');
    }

    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    const event = await this.paymentsService.constructEvent(
      request.rawBody,
      signature,
      webhookSecret,
    );

    await this.paymentsService.handleWebhook(event);

    return { received: true };
  }
}

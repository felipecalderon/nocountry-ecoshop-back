import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    const issuerUrl = configService.get<string>('AUTH0_ISSUER_URL');
    const audience = configService.get<string>('AUTH0_AUDIENCE');

    if (!issuerUrl || !audience) {
      throw new Error(
        'Faltan variables de entorno de Auth0 (ISSUER o AUDIENCE)',
      );
    }

    const cleanIssuerUrl = issuerUrl.endsWith('/')
      ? issuerUrl.slice(0, -1)
      : issuerUrl;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${cleanIssuerUrl}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: audience,
      issuer: issuerUrl,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.debug(`Validando usuario: ${payload.sub}`);

    const user = await this.userService.findOrCreateFromProvider(payload);

    if (!user) {
      throw new UnauthorizedException('Error al validar el usuario.');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Este usuario ha sido bloqueado.');
    }

    return user;
  }
}

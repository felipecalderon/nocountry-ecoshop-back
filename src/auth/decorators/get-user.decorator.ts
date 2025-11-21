import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException(
        'No se pudo obtener el usuario del request (AuthGuard missing?)',
      );
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);

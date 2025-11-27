import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateFromProvider(payload: JwtPayload): Promise<User> {
    const { sub, email, given_name, family_name } = payload;

    // 🔍 DEBUG: Mira qué está llegando realmente.
    // Es muy probable que 'email' sea undefined aquí.
    console.log('Payload de Auth0 recibido:', payload);

    // 1. Buscar por Provider ID (El método más seguro)
    // El 'sub' SIEMPRE debe venir.
    let user = await this.userRepository.findOne({
      where: { providerId: sub },
    });

    if (user) {
      return user;
    }

    if (email) {
      user = await this.userRepository.findOne({ where: { email } });

      if (user) {
        user.providerId = sub;
        return await this.userRepository.save(user);
      }
    }

    if (!email) {
      throw new BadRequestException(
        'El token de Auth0 no contiene un email. Revisa los scopes del frontend.',
      );
    }

    const newUser = this.userRepository.create({
      providerId: sub,
      email: email,
      firstName: given_name,
      lastName: family_name,
      emailVerified: true,
    });

    return await this.userRepository.save(newUser);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    this.userRepository.merge(user, updateUserDto);

    return this.userRepository.save(user);
  }
}

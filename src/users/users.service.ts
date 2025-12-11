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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const { email } = userData;

    if (!email) {
      throw new BadRequestException(
        'El email es obligatorio para crear un usuario.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      return existingUser;
    }

    const newUser = this.userRepository.create({
      ...userData,
      providerId:
        userData.providerId ||
        `local-seed-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      emailVerified: true,
    });

    const savedUser = await this.userRepository.save(newUser);

    return savedUser;
  }

  async findOrCreateFromProvider(payload: JwtPayload): Promise<User> {
    const namespace = 'https://api.ecoshop.com';
    const picture = payload[`${namespace}/picture`] || payload.picture;
    const email = payload[`${namespace}/email`] || payload.email;
    const firstName = payload[`${namespace}/firstName`] || payload.given_name;
    const lastName = payload[`${namespace}/lastName`] || payload.family_name;
    const sub = payload.sub;

    if (!email) {
      throw new BadRequestException(
        'El token de Auth0 no contiene un email. Revisa la Action de Auth0.',
      );
    }

    let user = await this.userRepository.findOne({
      where: { providerId: sub },
    });

    if (user) {
      return user;
    }

    user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      user.providerId = sub;
      if (!user.firstName && firstName) user.firstName = firstName;
      if (!user.lastName && lastName) user.lastName = lastName;
      return await this.userRepository.save(user);
    }

    const newUser = this.userRepository.create({
      providerId: sub,
      email: email,
      firstName: firstName,
      lastName: lastName,
      emailVerified: true,
      profileImage: picture,
    });

    const savedUser = await this.userRepository.save(newUser);

    const eventPayload: UserRegisteredEvent = {
      email: savedUser.email,
      name: savedUser.firstName || 'Eco-Amigo',
    };
    this.eventEmitter.emit('user.registered', eventPayload);

    return savedUser;
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

  async updateProfileImage(id: string, imageUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.profileImage = imageUrl;
    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email } });
    if (!user)
      throw new NotFoundException(`Usuario con email: ${email} no encontrado.`);
    return user;
  }
}

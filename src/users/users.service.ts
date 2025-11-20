import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateFromProvider(payload: JwtPayload): Promise<User> {
    const { sub, email, given_name, family_name } = payload;

    let user = await this.userRepository.findOne({
      where: { providerId: sub },
    });

    if (user) {
      return user;
    }

    user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.providerId = sub;
      return await this.userRepository.save(user);
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
}

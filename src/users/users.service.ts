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
    // 1. Definir el Namespace (DEBE ser idéntico al que pusiste en la Action de Auth0)
    const namespace = 'https://api.ecoshop.com';

    // 2. Extracción de Datos Prioritaria
    // Intentamos leer el Custom Claim primero. Si no existe, intentamos el estándar.
    const email = payload[`${namespace}/email`] || payload.email;
    const firstName = payload[`${namespace}/firstName`] || payload.given_name;
    const lastName = payload[`${namespace}/lastName`] || payload.family_name;
    const sub = payload.sub; // El sub siempre viene estándar

    console.log('Payload procesado:', { email, sub, firstName }); // Debug útil

    // 3. Validación de Seguridad (El email es obligatorio)
    if (!email) {
      throw new BadRequestException(
        'El token de Auth0 no contiene un email. Revisa la Action de Auth0.',
      );
    }

    // 4. Buscar por ID de Proveedor (Usuario ya registrado y logueado antes)
    let user = await this.userRepository.findOne({
      where: { providerId: sub },
    });

    if (user) {
      return user;
    }

    // 5. Buscar por Email (Linkeo de cuentas: Usuario existía pero entra con otro método)
    // Al usar la variable 'email' extraída arriba, ya estamos seguros de que no es undefined
    user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Encontramos el email, actualizamos el providerId para la próxima vez
      user.providerId = sub;
      // Opcional: Actualizar nombres si estaban vacíos
      if (!user.firstName && firstName) user.firstName = firstName;
      if (!user.lastName && lastName) user.lastName = lastName;

      return await this.userRepository.save(user);
    }

    // 6. Crear Nuevo Usuario
    const newUser = this.userRepository.create({
      providerId: sub,
      email: email,
      firstName: firstName,
      lastName: lastName,
      emailVerified: true, // Asumimos true ya que viene de un token válido de Auth0
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

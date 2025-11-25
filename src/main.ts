import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerConfig } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  swaggerConfig(app);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`✅ Aplicacion corriendo: http://localhost:3000`);
  console.log(`📚 Documentacion Swagger: http://localhost:3000/api/docs`);
}
bootstrap();

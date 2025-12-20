import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerConfig } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  swaggerConfig(app);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://ecoshop-dev.vercel.app',
      'https://facundo-ortiz.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3010);

  console.log(`✅ Aplicacion corriendo: http://localhost:3010`);
  console.log(`📚 Documentacion Swagger: http://localhost:3010/api/docs`);
}
bootstrap();

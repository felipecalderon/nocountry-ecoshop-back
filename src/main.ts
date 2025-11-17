import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('EcoShop E-commerce')
    .setDescription(
      'API de EcoShop para la gestion de productos sostenibles y ecologicos',
    )
    .setVersion('1.0')
    .addTag('products', 'operaciones relacionadas con productos')
    .addTag('certifications', 'operaciones de certificaciones')
    .addTag('orders', 'gestion de ordenes')
    .addTag('users', 'gestion de usuarios')
    .addTag('brands', 'gestion de marcas')
    // .addBearerAuth() //por si usamos auth de JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`✅ Aplicacion corriendo: http://localhost:3000`);
  console.log(`📚 Documentacion Swagger: http://localhost:3000/api/docs`);
}
bootstrap();

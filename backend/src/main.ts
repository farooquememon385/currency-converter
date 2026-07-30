import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Browser origins never carry a trailing slash, so normalize configured values.
function allowedOrigins(): string[] {
  return (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: allowedOrigins() });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

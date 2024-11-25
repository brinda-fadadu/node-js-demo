import { Module } from '@nestjs/common';
import { PageController } from './page.controller';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [PageController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class PageModule {}

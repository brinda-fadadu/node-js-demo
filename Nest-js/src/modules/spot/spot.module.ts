import { Module } from '@nestjs/common';
import { SpotController } from './spot.controller';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [SpotController],
  imports: [
    SharedModule,
    AuthModule,
  ]
})
export class SpotModule {}

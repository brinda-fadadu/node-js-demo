import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nest-modules/mailer';
import { HandlebarsAdapter } from '@nest-modules/mailer';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import ormconfig from './ormconfig';
import { ConfigService as config } from './common/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { EmailService } from './shared/services/email/email.service';

import { UserModule } from './modules/user/user.module';
import { SpotModule } from './modules/spot/spot.module';
import { TagModule } from './modules/tag/tag.module';

import { HttpExceptionFilter } from './shared/http-exception.filter';
import { AngularModule } from './modules/angular/angular.module';

import { PostModule } from './modules/post/post.module';
import { CategoryModule } from './modules/category/category.module';
import { PageModule } from './modules/pages/page.module';
import { EmailTemplateModule } from './modules/emailtemplate/emailtemplate.module';
import { CategoryController } from './modules/category/category.controller';
import { reportCategoryController } from './modules/reportCategory/reportCategory.controller';
import { ReactModule } from './modules/react/react.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { ReportCategoryModule } from './modules/reportCategory/reportCategory.module';

@Module({
  imports: [
    ReactModule.forRoot({
      rootPath: join(process.cwd(), 'admin/build'),
      renderPath: '*',
    }),
    TypeOrmModule.forRoot(ormconfig),
    AuthModule,
    SharedModule.forRoot(),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [config],
      useFactory: async (configService: config) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: config.get('MAIL_SECURE'),
          auth: {
            user: config.get('MAIL_USERNAME'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          forceEmbeddedImages: config.get('MAIL_EMBEDDED_IMAGES'),
          from: config.get('MAIL_FROM_EMAIL'),
        },
        template: {
          dir: process.cwd() + '/views/email-templates',
          adapter: new HandlebarsAdapter(), // or new PugAdapter()
          options: {
            strict: true,
          },
        },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UserModule,
    SpotModule,
    PostModule,
    CategoryModule,
    PageModule,
    EmailTemplateModule,
    TagModule,
    ReportCategoryModule,
  ],
  controllers: [AppController, CategoryController],
  providers: [
    AppService,
    EmailService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    //CronService
    // {
    //   provide: ConfigService,
    //   useValue: ConfigService.init(`.env`),
    // },
  ],
})
export class AppModule {}

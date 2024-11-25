import { Module, Logger } from "@nestjs/common";
import { Seeder } from "./seeder";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from 'path';
import { ConfigService as config } from '../common/config.service';


import { Role } from "src/modules/entity/role.entity";

import { User } from "src/modules/entity/user.entity";
import { UserHasRole } from "src/modules/entity/userHasRole.entity";


//import { UserRecentHistory } from "src/modules/entity/user_recent_history.entity";



import { UsersSeederService } from "./user/user.service";
import { RoleSeederService } from "./role/role.service";
import { HeaderSeederService } from "./header/header.service";
import { CountrySeederService } from "./country/country.service"
import { Header } from "src/modules/entity/header.entity";
import { Country } from "src/modules/entity/country.entity";


/**
 * Import and provide seeder classes.
 *
 * @module
 */
const Entity = [

  Role,

  User,
  Role,
  UserHasRole,


  Header,

  Country,

];

const Services = [

  UsersSeederService,
  RoleSeederService,
  HeaderSeederService,
  CountrySeederService

];
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql' as 'mysql',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/../**/**.entity{.ts,.js}'],
        synchronize: false,
        migrationsRun: false,
        logging: false,
        logger: 'file' as 'file',
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        subscribers: [__dirname + '/subscribers/**/*{.ts,.js}'],
        cli: {
          // Location of migration should be inside src folder
          // to be compiled into dist/ folder.
          migrationsDir: 'src/migrations',
          subscribersDir: 'src/subscribers',
        },
        charset: 'utf8',
      }),
    }),
    TypeOrmModule.forFeature(Entity),
  ],
  providers: [Logger, Seeder, ...Services],
  exports: [],
})
export class SeederModule { }

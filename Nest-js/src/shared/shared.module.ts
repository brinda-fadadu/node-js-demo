import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/entity/user.entity';
import { Spot } from 'src/modules/entity/spot.entity';
import { Services } from './services';
import { UserHasRole } from 'src/modules/entity/userHasRole.entity';
import { Role } from 'src/modules/entity/role.entity';
import { DeviceTokens } from 'src/modules/entity/deviceTokens.entity';

import { Header } from 'src/modules/entity/header.entity';
import { Country } from 'src/modules/entity/country.entity';
import { Category } from '../modules/entity/category.entity';
import { Post } from '../modules/entity/post.entity';
import { PostImage } from '../modules/entity/postImage.entity';
import { PostLike } from '../modules/entity/postLike.entity';
import { PostCommentLike } from '../modules/entity/postCommentLike.entity';
import { Page } from 'src/modules/entity/pages.entity';
import { EmailTemplate } from 'src/modules/entity/emailtemplate.entity';
import { UserCategory } from 'src/modules/entity/userCategory.entity';
import { UserSpot } from 'src/modules/entity/userSpot.entity';
import { PostComment } from 'src/modules/entity/postComment.entity';
import { PostTag } from 'src/modules/entity/postTag.entity';
import { UserFollowers } from 'src/modules/entity/userFollowers.entity';
import { UserFavouriteItinerary } from 'src/modules/entity/userfavouriteitinerary.entity';
import { Report } from 'src/modules/entity/report.entity';
import { UserBlock } from 'src/modules/entity/userBlock.entity';
import { Album } from 'src/modules/entity/album.entity';
import { PostCategory } from 'src/modules/entity/postCategory.entity';
import { PostSpot } from 'src/modules/entity/postSpot.entity';
import { Tag } from 'src/modules/entity/tag.entity';
import { ItineraryInvites } from 'src/modules/entity/itineraryInvites.entity';
import { History } from 'src/modules/entity/history.entity';
import { Notification } from 'src/modules/entity/notification.entity';
import { UserNotification } from 'src/modules/entity/user_notification.entity';
import { RoleHasPermissions } from 'src/modules/entity/roleHasPermission.entity';
import { Permission } from 'src/modules/entity/permission.entity';
import { FavouriteSpot } from 'src/modules/entity/favouriteSpot.entity';
import { UserCountry } from 'src/modules/entity/user_country.entity';
import { ReportCategory } from 'src/modules/entity/reportCategory.entity';
import { LocationLogs } from 'src/modules/entity/locationLogs.entity';

const Entity = [
  DeviceTokens,
  Role,
  User,
  UserHasRole,
  Header,
  Country,
  Spot,
  Category,
  Post,
  PostImage,
  PostLike,
  PostCommentLike,
  Page,
  EmailTemplate,
  UserCategory,
  UserSpot,
  PostComment,
  PostTag,
  UserFollowers,
  Report,
  UserBlock,
  UserFavouriteItinerary,
  Report,
  Album,
  PostCategory,
  PostSpot,
  Tag,
  ItineraryInvites,
  History,
  Notification,
  UserNotification,
  RoleHasPermissions,
  Permission,
  FavouriteSpot,
  UserCountry,
  ReportCategory,
  LocationLogs,
];

@Module({
  imports: [TypeOrmModule.forFeature(Entity)],
  exports: [...Services, TypeOrmModule.forFeature(Entity)],
  providers: [...Services],
})
export class SharedModule {
  static forRoot(): DynamicModule {
    return {
      module: SharedModule,
      providers: [...Services],
    };
  }
}

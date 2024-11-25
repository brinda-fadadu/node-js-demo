import { UserService } from './user/user.service';
import { EmailService } from './email/email.service';
import { RoleService } from './role/role.service';

import { CategoryService } from '../services/category/category.service';
import { SpotService } from '../services/spot/spot.service';
import { PostService } from '../services/post/post.service';
import { PageService } from '../services/pages/page.service';
import { TagService } from '../services/tag/tag.service';
import { EmailTemplateService } from '../services/emailtemplate/emailtemplate.service';
import { UserFavouriteItinerary } from 'src/modules/entity/userfavouriteitinerary.entity';
import { Report } from 'src/modules/entity/report.entity';
import { NotificationService } from './notification/notification.service';
import { ReportCategoryService } from '../services/reportCategory/reportCategory.service';
import { CheckReportedService } from '../../common/checkReported.service';
import { ImageS3UploadService } from '../../common/s3ImageUpload.service';

export { UserService } from './user/user.service';
export { EmailService } from './email/email.service';
export { RoleService } from './role/role.service';
export { SpotService } from './spot/spot.service';
export { PostService } from './post/post.service';
export { CategoryService } from '../services/category/category.service';
export { TagService } from '../services/tag/tag.service';
export { PageService } from './pages/page.service';
export { EmailTemplateService } from './emailtemplate/emailtemplate.service';
export { UserFavouriteItinerary } from 'src/modules/entity/userfavouriteitinerary.entity';
export { NotificationService } from './notification/notification.service';
export { ReportCategoryService } from './reportCategory/reportCategory.service';
export { CheckReportedService } from '../../common/checkReported.service';
export { ImageS3UploadService } from '../../common/s3ImageUpload.service';

const Services: any = [
  UserService,
  EmailService,
  RoleService,
  SpotService,
  CategoryService,
  PostService,
  PageService,
  TagService,
  EmailTemplateService,
  UserFavouriteItinerary,
  NotificationService,
  ReportCategoryService,
  CheckReportedService,
  ImageS3UploadService,
];

export { Services };

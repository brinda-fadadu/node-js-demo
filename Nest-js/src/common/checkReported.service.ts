import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Report } from '../modules/entity/report.entity';
import { PostComment } from '../modules/entity/postComment.entity';
import { InjectRepository } from '@nestjs/typeorm';

// console.log('buildOutDatesCounter!', buildOutDatesCounter);
@Injectable()
export class CheckReportedService {
  constructor(
    @InjectRepository(Report)
    private readonly ReportRepository: Repository<Report>,
    @InjectRepository(PostComment)
    private readonly PostCommentRepository: Repository<PostComment>,
  ) {}

  async getReportedComments() {
    try {
      let data = await this.ReportRepository.createQueryBuilder('report')
        .where('userStatusByAdmin = :userStatusByAdmin and type=:type', {
          userStatusByAdmin: 'Inactive',
          type: 'comment',
        })
        .getMany();
      // console.log('response', data);
      if (data && data.length > 0) {
        let finalData = [];
        data.map(async item => {
          if (finalData.indexOf(item.comment_id) === -1) {
            finalData.push(item.comment_id);
          }
        });
        for (let i in finalData) {
          let childComments = await this.PostCommentRepository.createQueryBuilder(
            'post_comment',
          )
            .select('post_comment.id')
            .where('parent_id = :parent_id ', {
              parent_id: finalData[i],
            })
            .getMany();
          if (childComments && childComments.length > 0) {
            childComments.map(childItem => {
              // console.log('childItem.id', childItem.id);
              finalData.push(childItem.id);
            });
          }
        }
        // console.log('finalData', finalData);
        return finalData;
      } else {
        return [0];
      }
    } catch (err) {
      throw err;
    }
  }
  async getReportedUsers() {
    try {
      let data = await this.ReportRepository.createQueryBuilder('report')
        .where('userStatusByAdmin = :userStatusByAdmin and type=:type', {
          userStatusByAdmin: 'Inactive',
          type: 'user',
        })
        .getMany();
      if (data && data.length > 0) {
        // console.log('response', data);
        let finalData = [];
        data.map(item => {
          if (finalData.indexOf(item.other_user_id) === -1) {
            finalData.push(item.other_user_id);
          }
        });
        return finalData;
      }
      return [];
    } catch (err) {
      throw err;
    }
  }
}

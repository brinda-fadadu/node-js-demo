import { Injectable, BadRequestException, Inject, forwardRef, NotAcceptableException } from '@nestjs/common';
import { EmailTemplate } from 'src/modules/entity/emailtemplate.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';

import { Pagination } from 'src/shared/class';
import { bindDataTableQuery, saveBase64Image } from 'src/shared/helpers/utill';
import { pick } from "lodash"

@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectRepository(EmailTemplate) private readonly emailTemplateRepository: Repository<EmailTemplate>,
  ) { }


  async get(request) {
    try {
      const query = await this.emailTemplateRepository.createQueryBuilder('email_template')

      if (request.order != undefined && request.order && request.order != '') {
        let order = JSON.parse(request.order);
        query.orderBy(`email_template.${order.name}`, order.direction.toUpperCase());
      } else {
        query.orderBy('email_template.id', 'ASC');
      }

      if (request.filter && request.filter != '') {
        query.andWhere(`email_template.slug LIKE :f`, { f: `${request.filter}%` })
        query.orWhere(`email_template.description LIKE :e`, { e: `${request.filter}%` })
        query.orWhere(`email_template.title LIKE :e`, { e: `${request.filter}%` })
      }

      let limit = 10;
      if (request && request.limit) {
        limit = request.limit;
      }
      let page = 0;
      if (request && request.page) {
        page = request.page
      }
      request = pick(request, ['limit', 'page', 'user_type'])
      bindDataTableQuery(request, query);

      let response = await (new Pagination(query, EmailTemplate).paginate(limit, page));


      return response;
    } catch (error) {
      throw error;
    }
  }



  async findOne(where: Object, relations: Array<any> = []): Promise<EmailTemplate> {
    return this.emailTemplateRepository.findOne({ where: where, relations: relations });
  }

  async createOrupdate(payload, type = null): Promise<any> {
    try {

      let page = new EmailTemplate();
      console.log(payload)
      if (payload.title) {
        page.title = payload.title;
      }

      if (payload.slug) {
        page.slug = payload.slug;
      }

      if (payload.description) {
        page.description = payload.description;
      }

      // if (payload.subject) {
      //   page.subject = payload.subject;
      // }


      if (payload.status) {
        page.status = payload.status;
      }
      if (payload.id) {
        await this.emailTemplateRepository.update(payload.id, page);
      } else {
        let data = await this.emailTemplateRepository.save(page);
        payload.id = data.id;
      }

      page = await this.findOne({ id: payload.id });
      return page;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    await this.emailTemplateRepository.softDelete({ id: id })
  }

  async getPageBySlug(request) {
    try {
      if (request && request.query.slug != undefined) {
        return await this.emailTemplateRepository.findOne(
          {
            where: { slug: request.query.slug }
          }
        );
      } else {
        return await this.emailTemplateRepository.find();
      }
    } catch (error) {
      throw error;
    }
  }
}



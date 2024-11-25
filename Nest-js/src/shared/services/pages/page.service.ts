import { Injectable, BadRequestException, Inject, forwardRef, NotAcceptableException } from '@nestjs/common';
import { Page } from 'src/modules/entity/pages.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';

import { Pagination } from 'src/shared/class';
import { bindDataTableQuery, saveBase64Image } from 'src/shared/helpers/utill';
import { pick } from "lodash"

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page) private readonly pageRepository: Repository<Page>,
  ) { }


  async get(request) {
    try {
      const query = await this.pageRepository.createQueryBuilder('page')

      if (request.order != undefined && request.order && request.order != '') {
        let order = JSON.parse(request.order);
        query.orderBy(`page.${order.name}`, order.direction.toUpperCase());
      } else {
        query.orderBy('page.id', 'ASC');
      }

      if (request.filter && request.filter != '') {
        query.andWhere(`page.title LIKE :f`, { f: `${request.filter}%` })
        query.orWhere(`page.status LIKE :e`, { e: `${request.filter}%` })
        query.orWhere(`page.slug LIKE :e`, { e: `${request.filter}%` })
        query.orWhere(`page.description LIKE :e`, { e: `${request.filter}%` })
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

      let response = await (new Pagination(query, Page).paginate(limit, page));


      return response;
    } catch (error) {
      throw error;
    }
  }




  async findOne(where: Object, relations: Array<any> = []): Promise<Page> {
    return this.pageRepository.findOne({ where: where, relations: relations });
  }

  async createOrUpdate(payload, type = null): Promise<any> {
    try {

      let page = new Page();

      if (payload.title) {
        page.title = payload.title;
      }

      if (payload.slug) {
        page.slug = payload.slug;
      }

      if (payload.description) {
        page.description = payload.description;
      }


      if (payload.status) {
        page.status = payload.status;
      }
      if (payload.id) {
        await this.pageRepository.update(payload.id, page);
      } else {
        let data = await this.pageRepository.save(page);
        payload.id = data.id;
      }

      page = await this.findOne({ id: payload.id });
      return page;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    await this.pageRepository.delete({ id: id })
  }

  async getPageBySlug(request) {
    try {
      if (request && request.query.slug != undefined) {
        return await this.pageRepository.findOne(
          {
            where: { slug: request.query.slug }
          }
        );
      } else {
        return await this.pageRepository.find();
      }
    } catch (error) {
      throw error;
    }
  }
}



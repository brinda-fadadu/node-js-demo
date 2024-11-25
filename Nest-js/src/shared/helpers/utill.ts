import { ConfigService } from '@nestjs/config';
import { Brackets } from 'typeorm';
import * as fs from 'fs';
import * as crypto from 'crypto';
const mime = require('mime');

const configService = new ConfigService();
// const convert = require('heic-convert');
const sharp = require('sharp');

export function baseUrl(path?: string, type?: string) {
  let app_url =
    type == 'front-end'
      ? configService.get('FRONTEND_URL')
      : configService.get('APP_URL');
  if (path) {
    app_url += `/${path}`;
  }
  return app_url;
}

export function becrypt(password: string) {
  return crypto.createHmac('sha256', password).digest('hex');
}

export function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

export async function bindDataTableQuery(input: any, query: any = {}) {
  query.where = query.where || [];
  let tablePath = query.expressionMap.aliases[0].name;

  if (input.filter) {
    if (input.filter_in) {
      query.andWhere(
        new Brackets((qb: any) => {
          for (let index = 0; index < input.filter_in.length; index++) {
            const filter = input.filter_in[index];

            switch (filter.type) {
              case 'int':
                let inputFilter = parseFloat(
                  input.filter.replace(/[^0-9.-]+/g, ''),
                );
                if (Number.isInteger(inputFilter)) {
                  qb.orWhere(`${filter.name} like '%${inputFilter}%'`);
                }
                break;
              default:
                qb.orWhere(`${filter.name} like '%${input.filter}%'`);
                break;
            }
          }
        }),
      );
    }
  }

  if (input.order) {
    input.order = JSON.parse(input.order);
    switch (input.order.name) {
      case 'spot.user_id':
        query.orderBy(
          `spot.user_id`,
          input.order.direction == 'asc' ? 'ASC' : 'DESC',
        );
        break;
      case 'statements.topic_id':
        query.orderBy(
          `statements.topic_id`,
          input.order.direction == 'asc' ? 'ASC' : 'DESC',
        );
        break;
      case 'statements.statement':
        query.orderBy(
          `statements.statement`,
          input.order.direction == 'asc' ? 'ASC' : 'DESC',
        );
        break;
      case 'similar_statements.statementhistory':
        query.orderBy(
          `similar_statements.statement`,
          input.order.direction == 'asc' ? 'ASC' : 'DESC',
        );
        break;
      default:
        query.orderBy(
          `${tablePath}.${input.order.name}`,
          input.order.direction == 'asc' ? 'ASC' : 'DESC',
        );
        break;
    }
  }

  // if (input.order) {
  //   query.orderBy(input.order.name, input.order.direction == 'asc' ? 'ASC' : 'DESC')
  // }
  return query;
}

export function saveBase64Image(dataString, path: string = 'uploads'): string {
  let matches = dataString.match(/^data:(.+);base64,(.+)$/);

  let response: any = {};
  if (!matches || matches.length !== 3) {
    return null;
  }

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  response.type = matches[1];
  response.data = Buffer.from(matches[2], 'base64');

  let extArray = response.type.split('/');
  let extension = extArray[extArray.length - 1];
  // const ext = mime.getExtension(response.type);
  const file_name = Math.random() + '_' + new Date().getTime();
  const file_path: string = `public/${path}/${file_name}.${extension}`;
  fs.writeFile(file_path, response.data, 'base64', function(err) {
    if (err) throw err;
  });

  return file_path;
}

export async function saveAllFiles(
  fileInfo,
  path: string = 'uploads',
): Promise<string> {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  let extenstion = mime.getExtension(fileInfo.mimetype);
  let outputBuffer;
  
  const file_name = Math.random() + '_' + new Date().getTime();
  const file_path: string = `public/${path}/${file_name}.${extenstion}`;


  return file_path;
}

export async function saveThumbnail(
  fileInfo,
  imgPath: string = '',
  path: string = 'uploads',
): Promise<string> {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    let extenstion = mime.getExtension(fileInfo.mimetype);
    let outputBuffer;
    let file_path;
    const file_name = Math.random() + '_' + new Date().getTime();
    
    return file_path;
  } catch (err) {
    console.log(err);

    throw err;
  }
}

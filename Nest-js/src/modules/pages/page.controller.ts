import { Controller, UnprocessableEntityException, UseGuards, Get, Delete, Param, Request, Body, Res, HttpStatus, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PageService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';

@Controller('api/page')
export class PageController {
  constructor(
    private pageService: PageService,
    private authService: AuthService,

  ) { }


  @UseGuards(AuthGuard('jwt'))
  @Get('page-slug')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getPageBySlug(
    @Request() request: any,
    @Res() res: Response
  ): Promise<any> {
    return await this.pageService
      .getPageBySlug(request)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getPages(
    @Param('id') id,
    @Res() res: Response,
  ): Promise<any> {

    return await this.pageService
      .findOne({ id: id })
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async updatePage(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {

    return await this.pageService
      .createOrUpdate(body)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }



  @UseGuards(AuthGuard('jwt'))
  @Get('')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getPage(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {

    return await this.pageService
      .get(request.query)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: reasons,
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }


  @UseGuards(AuthGuard('jwt'))
  @Delete('/delete/:id')
  async delete(
    @Param('id') id,
    @Res() res: Response
  ): Promise<any> {

    return await this.pageService
      .delete(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Pages deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }
}

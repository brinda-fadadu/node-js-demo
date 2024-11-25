import { Controller, UnprocessableEntityException, UseGuards, Get, Delete, Param, Request, Body, Res, HttpStatus, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SpotService } from 'src/shared/services';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from '../auth/auth.service';
import { SpotDTO } from 'src/shared/dto/spot.dto';

@Controller('api/spot')
export class SpotController {
  constructor(
    private spotService: SpotService,
    private authService: AuthService,

  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  @ApiOkResponse({ description: 'Successfully authenticated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getSpot(
    @Param('id') id,
    @Res() res: Response,
  ): Promise<any> {
    return await this.spotService
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
  async updateSpot(
    @Request() request: any,
    @Body() SpotPayload: SpotDTO,
    @Res() res: Response,
  ): Promise<any> {
    let userId = request.user.id;
    return await this.spotService
      .createOrUpdate(SpotPayload, userId)
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
  async getSpots(
    @Request() request: any,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {

    return await this.spotService
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

    return await this.spotService
      .delete(id)
      .then(async reasons => {
        return res.status(HttpStatus.OK).json({
          status: HttpStatus.OK,
          data: 'Spot deleted successfully',
        });
      })
      .catch((error: any) => {
        throw new UnprocessableEntityException(error);
      });
  }

}

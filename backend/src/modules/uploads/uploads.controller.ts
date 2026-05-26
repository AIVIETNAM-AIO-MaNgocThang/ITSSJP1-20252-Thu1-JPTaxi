import {
  Controller,
  Param,
  ParseEnumPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DriverDocumentType } from './driver-document-type.enum';
import { imageFileFilter } from './multer-image.options';
import { UploadsService } from './uploads.service';

const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
};

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** Avatar khách hàng / tài xế — field: `file` */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.saveAvatar(file);
  }

  /** Upload từng ảnh hồ sơ tài xế — field: `file` */
  @Post('drivers/:documentType')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadDriverDocument(
    @Param('documentType', new ParseEnumPipe(DriverDocumentType))
    documentType: DriverDocumentType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploads.saveDriverDocument(file, documentType);
  }
}

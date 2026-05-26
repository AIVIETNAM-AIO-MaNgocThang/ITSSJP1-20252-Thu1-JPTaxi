import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { DriversService } from './drivers.service';
import { DriversAuthService } from './drivers-auth.service';
import {
  DriversRegistrationService,
  DriverRegistrationFiles,
} from './drivers-registration.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { SearchDriversQueryDto } from './dto/search-drivers.query.dto';
import { ApplyDriverDto } from './dto/apply-driver.dto';
import { RegisterDriverApplicationDto } from './dto/register-driver-application.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { imageFileFilter } from '../uploads/multer-image.options';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { JwtAuthGuard } from 'src/common/jwt-auth.guard';

type AuthedRequest = Request & { user: JwtValidatedUser };

@Controller('drivers')
export class DriversController {
  constructor(
    private readonly drivers: DriversService,
    private readonly driversAuth: DriversAuthService,
    private readonly driversRegistration: DriversRegistrationService,
  ) {}

  /**
   * Tiếp nhận hồ sơ đăng ký tài xế (multipart): thông tin + 5 ảnh bắt buộc.
   * Trạng thái ban đầu: approved — có thể đăng nhập ngay (không qua admin).
   */
  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'portrait', maxCount: 1 },
        { name: 'licenseFront', maxCount: 1 },
        { name: 'licenseBack', maxCount: 1 },
        { name: 'vehiclePhoto', maxCount: 1 },
        { name: 'registrationPaper', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: imageFileFilter,
      },
    ),
  )
  registerApplication(
    @Body() dto: RegisterDriverApplicationDto,
    @UploadedFiles() files: DriverRegistrationFiles,
  ) {
    return this.driversRegistration.submitApplication(dto, files ?? ({} as DriverRegistrationFiles));
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.driversAuth.login(dto, req.ip);
  }

  @Get('me/profile')
  @UseGuards(AuthGuard('jwt'))
  getMyProfile(@Req() req: AuthedRequest) {
    if (req.user.role !== 'driver') {
      throw new ForbiddenException('ドライバートークンが必要です');
    }
    return this.drivers.getProfile(req.user.id);
  }

  /** Tìm tài xế theo vị trí (lat/lng) và bộ lọc. Phải khai báo trước route `:driverId`. */
  @Get('search')
  searchDrivers(@Query() query: SearchDriversQueryDto) {
    return this.drivers.searchDrivers(query);
  }

  @Get(':driverId/profile')
  getProfile(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.drivers.getProfile(driverId);
  }

  @Put(':driverId/profile')
  updateProfile(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.drivers.updateProfile(driverId, dto);
  }

  @Put(':driverId/bank-account')
  updateBank(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.drivers.updateBankAccount(driverId, dto);
  }

// Logic kiểm tra điều kiện bắt buộc và gửi đơn xét duyệt
  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  async applyToBeDriver(
    @Req() req: { user: { id: number } },
    @Body() applyDto: ApplyDriverDto,
  ) {
    return this.drivers.applyToBeDriver(req.user.id, applyDto);
  }

  @Post('admin/approve/:driverId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async approveDriver(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body('status') status: 'approved' | 'rejected',
    @Body('reason') reason?: string,
  ) {
    return this.drivers.approveDriver(driverId, status, reason);
  }
}



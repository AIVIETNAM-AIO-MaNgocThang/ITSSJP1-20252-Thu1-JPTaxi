import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Customer, GenderType } from '../../entities/customer.entity';
import { LoginHistory, LoginUserType } from '../../entities/login-history.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(LoginHistory)
    private readonly logins: Repository<LoginHistory>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const birthDate = dto.birth_date?.slice(0, 10) ?? '1990-01-01';
      const entity = this.customers.create({
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        gender: dto.gender ?? GenderType.Other,
        birthDate,
        isEmailVerified: false,
        isPhoneVerified: false,
      });
      const saved = await this.customers.save(entity);
      const { passwordHash: _p, ...user } = saved as Customer & {
        passwordHash?: string;
      };
      return { message: 'Đăng ký thành công', user };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
      throw new BadRequestException(msg);
    }
  }

  async login(dto: LoginDto, clientIp?: string | null) {
    const user = await this.customers
      .createQueryBuilder('c')
      .addSelect('c.passwordHash')
      .where('c.email = :email', { email: dto.email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu sai');
    }

    try {
      await this.logins.save(
        this.logins.create({
          userType: LoginUserType.customer,
          userId: user.customerId,
          ipAddress: clientIp || null,
          loginTime: new Date(),
        }),
      );
    } catch {
      /* bỏ qua nếu bảng login_history chưa có hoặc lỗi ghi log */
    }

    const token = this.jwt.sign(
      { id: user.customerId, role: 'customer' },
      { expiresIn: '7d' },
    );
    return {
      token,
      user: {
        email: user.email,
        name: user.firstName,
        customerId: user.customerId,
      },
    };
  }

  async getProfile(customerId: number) {
    const user = await this.customers.findOne({
      where: { customerId },
    });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }
}

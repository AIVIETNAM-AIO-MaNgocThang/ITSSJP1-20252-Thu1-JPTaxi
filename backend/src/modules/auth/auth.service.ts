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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  // Bộ nhớ đệm tạm thời cho mã xác minh reset mật khẩu (in-memory cache)
  private forgotPasswordCodes = new Map<string, { code: string; expiresAt: Date }>();

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

  /**
   * Yêu cầu đặt lại mật khẩu (Gửi email chứa mã xác nhận)
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const emailLower = dto.email.trim().toLowerCase();
    const customer = await this.customers.findOne({
      where: { email: emailLower },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    // 1. Tạo ngẫu nhiên mã xác minh 6 số
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Lưu vào in-memory cache có thời hạn 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    this.forgotPasswordCodes.set(emailLower, { code, expiresAt });

    // 3. Giả lập gửi email (In trực tiếp ra Terminal vô cùng trực quan để tiện copy test)
    console.log('\n==================================================');
    console.log('📬 [MOCK MAIL SENDER] EMAIL RESET PASSWORD SENT');
    console.log(`To: ${customer.lastName} ${customer.firstName} <${emailLower}>`);
    console.log(`Subject: JP Taxi - Xác nhận đặt lại mật khẩu`);
    console.log(`Body: Mã xác nhận đặt lại mật khẩu của bạn là: ${code}`);
    console.log(`Hạn sử dụng: 15 phút (Đến ${expiresAt.toLocaleTimeString()})`);
    console.log('==================================================\n');

    return {
      message: 'Mã xác nhận đặt lại mật khẩu đã được gửi thành công.',
      email: emailLower,
      mockSentCode: code, // Trả thêm trường này để client có thể test trực tiếp nếu muốn
    };
  }

  /**
   * Xác minh mã xác nhận và tiến hành cập nhật mật khẩu mới
   */
  async resetPassword(dto: ResetPasswordDto) {
    const emailLower = dto.email.trim().toLowerCase();

    // 1. Tìm thông tin khách hàng
    const customer = await this.customers.findOne({
      where: { email: emailLower },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy tài khoản.');
    }

    // 2. Xác thực mã trong cache
    const entry = this.forgotPasswordCodes.get(emailLower);
    if (!entry) {
      throw new BadRequestException('Mã xác nhận không tồn tại hoặc đã hết hạn.');
    }

    if (entry.expiresAt < new Date()) {
      this.forgotPasswordCodes.delete(emailLower);
      throw new BadRequestException('Mã xác nhận đã hết hạn.');
    }

    if (entry.code !== dto.code.trim()) {
      throw new BadRequestException('Mã xác nhận không chính xác.');
    }

    // 3. Hash mật khẩu mới và lưu vào DB
    customer.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.customers.save(customer);

    // 4. Giải phóng mã trong cache
    this.forgotPasswordCodes.delete(emailLower);

    return {
      message: 'Đặt lại mật khẩu thành công.',
    };
  }
}

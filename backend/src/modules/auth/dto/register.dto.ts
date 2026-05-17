import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { GenderType } from '../../../entities/customer.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;

  /** ISO date (YYYY-MM-DD). Nếu bỏ trống, backend gán mặc định để tương thích schema DB. */
  @IsOptional()
  @IsString()
  birth_date?: string;
}

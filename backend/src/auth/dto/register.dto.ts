import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty({ message: 'email must be a non-empty string' })
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(3)
    @IsNotEmpty({ message: 'name must be a non-empty string' })
    name!: string;

    @IsString()
    @MinLength(8)
    @IsNotEmpty({ message: 'password must be a non-empty string' })
    password!: string;
}
import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator";

export class SignInDto {
    @IsEmail()
    @IsNotEmpty({ message: 'email must be a non-empty string' })
    email!: string;

    @IsStrongPassword()
    @IsNotEmpty({ message: 'password must be a non-empty string' })
    password!: string;
}
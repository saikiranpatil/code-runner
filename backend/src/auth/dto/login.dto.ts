import { IsEmail, IsNotEmpty } from "class-validator";

export class LoginDto {
    @IsEmail()
    @IsNotEmpty({ message: 'email must be a non-empty string' })
    email!: string;

    @IsNotEmpty({ message: 'password must be a non-empty string' })
    password!: string;
}
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { IsSupportedLanguage } from "../../validators/is-supported-language.validator";

export class ExecutionDto {
    @IsString()
    @IsNotEmpty({ message: 'code must be a non-empty string' })
    @MaxLength(10000, { message: 'code exceeds 10,000 character limit' })
    code!: string;

    @IsOptional()
    @IsString()
    @IsSupportedLanguage()
    language: string = 'javascript';
}
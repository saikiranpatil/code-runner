import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { SupportedLanguage } from '../execution.types';

export class SubmitCodeDto {
  @IsString()
  @IsNotEmpty()
  problemId!: string;

  @IsEnum(SupportedLanguage)
  language!: SupportedLanguage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(65535, { message: 'Source code must not exceed 64KB' })
  sourceCode!: string;
}

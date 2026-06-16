import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SupportedLanguage } from '../execution.types';

export class RunCodeDto {
  @IsString()
  @IsNotEmpty()
  problemId!: string;

  @IsEnum(SupportedLanguage)
  language!: SupportedLanguage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(65536)
  sourceCode!: string;
}
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty, Visibility } from '../../execution/execution.types';

export class ProblemExampleDto {
  @IsString()
  @IsNotEmpty()
  input!: string;

  @IsString()
  @IsNotEmpty()
  output!: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateTestCaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(65535)
  input!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(65535)
  expectedOutput!: string;

  @IsBoolean()
  isHidden!: boolean;
}

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsString()
  inputFormat?: string;

  @IsOptional()
  @IsString()
  outputFormat?: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  timeLimitMs?: number;

  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(1024)
  memoryLimitMb?: number;

  @IsEnum(Visibility)
  visibility!: Visibility;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemExampleDto)
  @ArrayMaxSize(10)
  examples?: ProblemExampleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTestCaseDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  testCases!: CreateTestCaseDto[];
}

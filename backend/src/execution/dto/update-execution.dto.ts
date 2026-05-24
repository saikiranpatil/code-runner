import { PartialType } from '@nestjs/mapped-types';
import { ExecutionDto } from './execution.dto';

export class UpdateExecutionDto extends PartialType(ExecutionDto) {}

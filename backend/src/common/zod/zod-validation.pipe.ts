import {
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

import { treeifyError, ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodType,
  ) { }

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(
        treeifyError(result.error)
      );
    }

    return result.data;
  }
}
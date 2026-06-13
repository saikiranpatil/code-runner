import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      // class-validator wraps errors as { message: string[], error: string }
      const body =
        typeof raw === 'string'
          ? { message: raw, errors: [] }
          : {
            message: (raw as any).message ?? exception.message,
            errors: Array.isArray((raw as any).error)
              ? (raw as any).error
              : [],
          };

      return response.status(status).json({
        success: false,
        ...body,
        data: null,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Prisma known errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002, unique constraint violation
      if (exception.code === 'P2002') {
        const fields = (exception.meta?.target as string[]) ?? [];
        return response.status(HttpStatus.CONFLICT).json({
          success: false,
          message: `A record with this ${fields.join(', ')} already exists.`,
          errors: [],
          data: null,
          path: request.url,
          timestamp: new Date().toISOString(),
        });
      }

      // P2025, record not found
      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'The requested record was not found.',
          errors: [],
          data: null,
          path: request.url,
          timestamp: new Date().toISOString(),
        });
      }

      // Other Prisma errors, 400
      this.logger.error(`Prisma error ${exception.code}`, exception.stack);
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Database operation failed.',
        errors: [],
        data: null,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Prisma validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error('Prisma validation error', exception.stack);
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid data sent to the database.',
        errors: [],
        data: null,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown / unexpected error
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      errors: [],
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
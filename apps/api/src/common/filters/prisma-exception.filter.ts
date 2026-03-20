import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@ironcoach/db";
import { FastifyReply } from "fastify";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status: number;
    let message: string;

    switch (exception.code) {
      case "P2002": {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[]) ?? [];
        message = `Unique constraint violation on: ${fields.join(", ")}`;
        break;
      }
      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Record not found";
        break;
      case "P2003":
        status = HttpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed";
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "Internal database error";
        this.logger.error(
          `Unhandled Prisma error ${exception.code}: ${exception.message}`,
        );
    }

    response.status(status).send({
      success: false,
      error: {
        code: exception.code,
        message,
      },
    });
  }
}

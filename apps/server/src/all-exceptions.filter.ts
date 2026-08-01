import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.error('[EXCEPTION FILTER]', exception?.message || exception, exception?.stack || '')
    if (exception instanceof HttpException) {
      console.error('[EXCEPTION FILTER] HttpException status:', exception.getStatus())
      console.error('[EXCEPTION FILTER] HttpException response:', JSON.stringify(exception.getResponse()))
    }
    throw exception
  }
}

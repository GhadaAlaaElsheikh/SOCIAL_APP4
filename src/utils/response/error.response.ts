 import type { Request, Response, NextFunction } from "express";
interface IError extends Error{
statusCode : number;
}

export   class AppError extends Error{
  constructor(
    public override message: string,
    public statusCode: number,
    public override cause?:unknown
  ){
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}
export class BadRequest extends AppError{
  constructor(message : string, cause?: unknown){
    super(message, 400, cause)
  }
}
export class conflictException extends AppError{
  constructor(message : string, cause?: unknown){
    super(message, 409, cause)
  }
}
export class NotFoundException extends AppError{
  constructor(message : string, cause?: unknown){
    super(message, 404, cause)
  }
}
export class UnauthorizedException extends AppError{
  constructor(message : string, cause?: unknown){
    super(message, 401, cause)
  }
}
export class ForbiddenException extends AppError{
  constructor(message : string, cause?: unknown){
    super(message, 403, cause)
  }
}
  export const globalErrorHandling=((error:IError,req:Request, res:Response, next:NextFunction)=>{
return res.status(error.statusCode|| 500).json({
  error_message: error.message || "something went wrong !",
  stack: process.env.MOOD === "development" ? error.stack : undefined,
  cause :error.cause,
})
  })
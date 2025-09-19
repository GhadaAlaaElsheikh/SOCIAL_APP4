import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
 
 import {z} from 'zod'
import {ZodError, ZodType} from 'zod'

 
type keyReqType = keyof Request;
type schemaType =Partial<Record<keyReqType, ZodType>>
 type validationErrorsType = Array<{
    key:keyReqType , 
      issues:Array<{
        path:(string| number|symbol|undefined)[];
        message:string;
 }>
}>
export const validation =(schema:schemaType)=>{
  return(
    req:Request,
     res:Response,
      next:NextFunction):Response| NextFunction =>{
  //  console.log(Object.keys(schema));
  //  const errors :{
     
    //  }[];
  //  }[]=[]
  /*  const errors :Array<{
      key:keyReqType,
      issues:Array<{
          path:string| number|symbol|undefined;
        message:string;
      }>;
    }>=[];*/
    const validationErrors: validationErrorsType =[];
    for (const key of Object.keys(schema)as keyReqType[]) {
     if (!schema[key]) continue;
      
     if (req.file) {
      req.body.attachment = req.file
     }
      if (req.files) {
        //console.log(req.files);
        
      req.body.attachments = req.files
     }
      const validationResult = schema[key].safeParse(req[key])
      
      if (!validationResult.success) {
        const error = validationResult.error as ZodError
          validationErrors.push({key, 
            issues:error.issues.map(err =>{
              return {path: err.path, message: err.message}
            })
            
          })
        }
        
      }
      if (validationErrors.length) {
        return res.status(400).json({message:"validation error",validationErrors})
      }
    
    return next()as unknown as NextFunction;
  }
}

export const generalFields ={
  username:z.string({error:"username is required"})
      .min(2,{error:"min is :2"}).
      max(20),
        email: z.email(),
    password: z.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: z.string(),
    otp:z.string().regex(/^\d{6}$/),
     file: function(mimetype:string[]){
      return z.strictObject({
      fieldname: z.string(),
      originalname: z.string(),
      encoding:z.string(),
      mimetype:z.enum(mimetype),
      buffer: z.any().optional(),
      path:z.string().optional(),
      size:z.number(),
     }).refine(data =>{
      return data.buffer || data.path
     },{
      error:"neither path nor buffer is availability",
      path:["file"]
     }
    )
     },
     id: z.string().refine(
      (data)=>{
      return Types.ObjectId.isValid(data)
        },
        {
          error:"invalid objectId format"
        }
     )
     }

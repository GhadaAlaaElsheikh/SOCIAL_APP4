import type { NextFunction, Request, Response } from "express"
import { decodedToken, TokenEnum } from "../utils/security/token.security"
import { BadRequest, ForbiddenException } from "../utils/response/error.response"
import { RoleEnum } from "../database/model/User.model"
 
 
export const authentication =(tokenType:TokenEnum= TokenEnum.access)=>{
  return async (req:Request, res:Response, next:NextFunction)=>{
   
    if (!req.headers.authorization) {
      throw new BadRequest("validation error",{
        key:"headers",
        issues:[{path:"authorization",
          message:"missing authorization"
        }]
      })
    }
    const {decoded,user} = await decodedToken({
      authorization:req.headers.authorization
    })
    req.user = user,
    req.decoded = decoded
    next()
  }
}

 
export const authorization =(
  accessRoles:RoleEnum[]=[],
  tokenType:TokenEnum = TokenEnum.access
)=>{
  return async (req:Request, res:Response, next:NextFunction)=>{
   
    if (!req.headers.authorization) {
      throw new BadRequest("validation error",{
        key:"headers",
        issues:[{path:"authorization",
          message:"missing authorization"
        }]
      })
    }
    const {decoded,user} = await decodedToken({
      authorization:req.headers.authorization,
      tokenType,
    })
    if (!accessRoles.includes(user.role)) {
      throw new ForbiddenException("not authorized account")
    }
    req.user = user,
    req.decoded = decoded
    next()
  }
}
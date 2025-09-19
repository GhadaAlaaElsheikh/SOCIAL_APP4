import {z} from 'zod'
import { logoutEnum } from '../../utils/security/token.security'
import { Types } from 'mongoose'
import { generalFields } from '../../middleware/validation.middleware'
import { RoleEnum } from '../../database/model'

export const logout={
  body:z.strictObject({
    flag:z.enum(logoutEnum).default(logoutEnum.only)
  })
}
export const sendFriendRequest={
  params:z.strictObject({
    userId:generalFields.id,
  })
}
export const acceptFriendRequestFriendRequest={
  params:z.strictObject({
    requestId:generalFields.id,
  })
}
export const changeRole={
  params: sendFriendRequest.params,
  
  body: z.strictObject({
    role:z.enum(RoleEnum)
  })
}
export const freezeAccount={
  params:z.object({
    userId:z.string().optional()
  }).refine(data =>{
    return data?.userId ? Types.ObjectId.isValid(data.userId): true
  },
  {
    error:"invalid object is format", path:["userId"]
  }
)
}
export const hardDelete={
  params:z.strictObject({
    userId:z.string()
  }).refine(data =>{
    return data.userId ? Types.ObjectId.isValid(data.userId): true
  },
  {
    error:"invalid object is format", path:["userId"]
  }
)
}
export const updatePassword ={
  
  body: z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
}
export const updateBasicInfo ={
  body: z.object({
    firstName: z.string().min(2).max(25).optional(),
    lastName: z.string().min(2).max(25).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
}

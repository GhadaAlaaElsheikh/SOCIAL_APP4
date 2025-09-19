import {strictObject, z} from 'zod';
import { generalFields } from '../../middleware/validation.middleware';
import { da } from 'zod/v4/locales/index.cjs';


export const login ={

   
  body:z.strictObject({
     username : generalFields.username,
    email: generalFields.email,
    password: generalFields.password
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: generalFields.confirmPassword,
  })
      
    }
    
export const signup ={

   
  body:login.body.extend({
     username : generalFields.username,
    email: generalFields.email,
    password: generalFields.password
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: generalFields.confirmPassword,
  })
  .superRefine((data, ctx)=>{
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code:"custom",
        message:"password mismatch confirmPassword",
        path:["confirmPassword"]
      })
      
    }
    if (data.username.split(" ").length !=2) {
      ctx.addIssue({
        code:"custom",
        message:"in-valid username musst consist of 2 part like JON DOE",
        path:['username']
      })
      
    }
  })
  //refine(data=>{
  //  return data.password === data.confirmPassword
  //},{
  //  error:"password mismatch confirm password"
//  }
//)
}

export const confirmEmail ={

  body:strictObject({
     
    email: generalFields.email,
   otp: generalFields.otp
  })
 
 
 
}

export const signupGmail={
  body: z.strictObject({
    idToken: z.string()
  })
}
export const loginGmail={
  body: z.strictObject({
    idToken: z.string()
  })
}
export const sendForgetPassword={
  body: z.strictObject({
    email: generalFields.email,
  })
}
export const verifyForgetPassword={
  body: sendForgetPassword.body.extend({
    otp: generalFields.otp,
  })
}
export const resetForgetPassword={
  body: verifyForgetPassword.body.extend({
    otp: generalFields.otp,
    password:generalFields.password,
    confirmPassord: generalFields.confirmPassword
  })
  .refine((data)=>{
    return data.password === data.confirmPassord;

  },{message:"password mismatch confirmPassword", path:['confirmPassword']}
)
}
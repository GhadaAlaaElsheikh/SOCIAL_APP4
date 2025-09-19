/*export interface ISignupBodyInputs{
  username:string, email: string, password:string, phone:string  
 
}
  */
import * as validators from '../auth/auth.validation'
import {z} from 'zod'
export type ISignupBodyInputsDTto = z.infer<typeof validators.signup.body>
export type IConfirmEmailBodyInputsDTto = z.infer<typeof validators.confirmEmail.body>
export type ILoginBodyInputDTto = z.infer<typeof validators.login.body>
export type IGmail = z.infer<typeof validators.signupGmail.body>
export type IForgerPassword = z.infer<typeof validators.sendForgetPassword.body>
export type IVerifyPassword = z.infer<typeof validators.verifyForgetPassword.body>
export type IResetPassword = z.infer<typeof validators.resetForgetPassword.body>
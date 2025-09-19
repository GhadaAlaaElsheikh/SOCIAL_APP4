import type {  Request, Response } from "express"
import { IConfirmEmailBodyInputsDTto, IForgerPassword, IGmail, ILoginBodyInputDTto, IResetPassword, ISignupBodyInputsDTto, IVerifyPassword } from "./dto.auth"; 
import { providerEnum, UserModel } from "../../database/model/User.model";
import { UserRepository } from "../../database/repository/user.repository";
import { BadRequest, conflictException, NotFoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/event/email.event";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";
 import {OAuth2Client,type TokenPayload} from "google-auth-library"
import { successResponse } from "../../utils/response/success.response";
import { ILoginResponse } from "./auth.entities";

 
 
class AuthenticationService {
   private userModel = new UserRepository(UserModel);
   constructor(){}
  /** 
   * 
   * @param req - Express.Request
   * @param res - Express.Response
   * @returns Promise<Response>
   * @example({username, email, password}: ISignupBodyInputsDTto)
   * return {message:"done", statusCode:201}
  */
private async verifyGmailAccount (idToken:string):Promise<TokenPayload>{
const client = new OAuth2Client()
  const ticket= await client.verifyIdToken({
    idToken,
    audience:process.env.WEB_CLIENT_ID?.split(",") ||  []
  })
  const payload = ticket.getPayload()
  if (!payload?.email_verified) {
    throw new BadRequest("fail to verify google account")
  }
  return payload
 }

signupGmail = async(req:Request, res:Response): Promise<Response> =>{
 const {idToken}:IGmail = req.body;
 const {email, family_name, given_name, picture} = await this.verifyGmailAccount(idToken)

 const user = await this.userModel.findOne({
  filter:{
    email
  },
 })
 if (user) {
  if (user.provider === providerEnum.google) {
    return await this.loginGmail(req,res)
  }
  throw new conflictException(`email exist with another provider:: ${user.provider}`)
 }
const [newuser] = await this.userModel.create({
  data:[{
    firstName:given_name as string,
    lastName:family_name as string,
    email:email as string,
    provider:providerEnum.google,
  profileImage:picture as string,
  confirmedAt: new Date()
  }]
}) || []
if (!newuser) {
  throw new BadRequest("fail to signup with gmail please try again")
}
const credentials = await createLoginCredentials(newuser);
return res.json({message:"done",data:{credentials}})
}

loginGmail = async(req:Request, res:Response): Promise<Response> =>{
 const {idToken}:IGmail = req.body;
 const {email} = await this.verifyGmailAccount(idToken)

 const user = await this.userModel.findOne({
  filter:{
    email,
    provider:providerEnum.google
  },
 })
 if (!user) {
  
  throw new NotFoundException("not register account or registered with another provider")
 }
 
const credentials = await createLoginCredentials(user);
return res.json({message:"done",data:{credentials}})
}
  signup = async(req:Request , res: Response):Promise <Response> =>{
    let {username, email, password} : ISignupBodyInputsDTto= req.body;
    console.log({username, email, password});
       const checkUser = await this.userModel.findOne({
        filter: {email},
        select: "email",
        options:{
          lean:true,
          //populate: [{path :"username"}]
        }
       });
     
       if (checkUser) {
        throw new conflictException("email exists")
       }
       const otp = generateNumberOtp()
     const user = await this.userModel.createUser({
      data : [{
        username,
         email , 
password: await generateHash(password),
confirmEmailOtp:await generateHash(String(otp)),
}],
       
     });

   emailEvent.emit("confirmEmail",{
    to:email,
    otp 
   })
    return res.status(201).json({message:"done", data:{user}})
  };

confirmEmail= async(req:Request , res: Response):Promise<Response>=> {
     const {email, otp} :IConfirmEmailBodyInputsDTto=req.body;

     const user = await this.userModel.findOne({
      filter:{
        email,
         confirmEmailOtp:{$exists:true},
         confirmedAt:{$exists:false}
        }
     })
     if (!user) {
      throw new NotFoundException ("invalid account")
     }

     if (!await compareHash(otp,user.confirmEmailOtp as string)) {
      throw new conflictException("invalid confirmation code")
     }
     await this.userModel.updateOne({
      filter:{email},
      update:{
        confirmedAt: new Date(),
        $unset: {confirmEmailOtp: 1}
      }
     })
    return  successResponse({res})
  }

login=async(req:Request , res: Response):Promise<Response>=> {
 const {email,password} : ILoginBodyInputDTto = req.body;
 const user = await this.userModel.findOne({
  filter :{
    email,
    provider:providerEnum.system,
  }
 })
 if (!user) {
  throw new NotFoundException("invalid login data")
 }
 if (!user.confirmedAt) {
  throw new BadRequest("verify your account first")
 }
 if (!(await compareHash(password, user.password))) {
  throw new NotFoundException("invalid login")
 }
  const credentials = await createLoginCredentials(user)
  return  successResponse<ILoginResponse>({res, data:{credentials}})
  
};

sendForgetCode=async(req:Request , res: Response):Promise<Response>=> {
 const {email} : IForgerPassword = req.body;
 const user = await this.userModel.findOne({
  filter :{
    email,
    provider:providerEnum.system,
    confirmedAt:{$exists:true},
  }
 })
 if (!user) {
  throw new NotFoundException("invalid account")
 }
  
 const otp = generateNumberOtp()
const result= await this.userModel.updateOne({
  filter:{
  email,
  },
  update:{
    resetPasswordOtp: await generateHash(String(otp))
  }
 })
 if (!result.matchedCount) {
  throw new BadRequest("fail to send the reset code")
 }
emailEvent.emit("resetPassword", {to:email, otp})
  return successResponse({res})
 
};

verifyForgetCode=async(req:Request , res: Response):Promise<Response>=> {
 const {email,otp} : IVerifyPassword = req.body;
 const user = await this.userModel.findOne({
  filter :{
    email,
    provider:providerEnum.system,
    confirmedAt:{$exists:true},
    resetPasswordOtp:{$exists:true}
  }
 })
 if (!user) {
  throw new NotFoundException("invalid account")
 }
  if (!await compareHash(otp, user.resetPasswordOtp as string)) {
    throw new conflictException("invalid otp")
  }
 
  return successResponse({res})
 
};
resetForgetCode=async(req:Request , res: Response):Promise<Response>=> {
 const {email,otp,password} : IResetPassword = req.body;
 const user = await this.userModel.findOne({
  filter :{
    email,
    provider:providerEnum.system,
    confirmedAt:{$exists:true},
    resetPasswordOtp:{$exists:true}
  }
 })
 if (!user) {
  throw new NotFoundException("invalid account")
 }
  if (!await compareHash(otp, user.resetPasswordOtp as string)) {
    throw new conflictException("invalid otp")
  }
 const result = await this.userModel.updateOne({
  filter:{email},
  update:{
    password:await generateHash(password),
    changeCredentialsTime: new Date(),
    $unset:{resetPasswordOtp:1}
  }
 })
 if (!result.matchedCount ) {
  throw new BadRequest("fail to account password")
 }
  return successResponse({res})
 
};
 
}
export default new AuthenticationService()
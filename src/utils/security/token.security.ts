import {v4 as uuid} from 'uuid'
import {JwtPayload, Secret, sign, SignOptions, verify} from 'jsonwebtoken'
import { HUserDocument, RoleEnum, UserModel } from '../../database/model/User.model';
import { BadRequest, UnauthorizedException } from '../response/error.response';
import { UserRepository } from '../../database/repository/user.repository';
import { TokenRepository } from '../../database/repository/token.repository';
import { HTokenDocument, TokenModel } from '../../database/model/Token.model';
 
 
export enum signatureLevelEnum {
  Bearer = "Bearer",
  System="System"
}
export enum TokenEnum{
  access="access",
  refresh="refresh"
}
export enum logoutEnum{
  only="only",
  all="all"
}
export const generateToken = async({
  payload,
  secret= process.env.ACCESS_USER_TOKEN_SIGNTURE as string,
  options= {expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)}
}:{
  payload: object;
  secret?: Secret;
  options?: SignOptions;

}): Promise<string>=>{
  return sign (payload, secret, options)
}

export const verifyToken = async({
  token,
  secret= process.env.ACCESS_USER_TOKEN_SIGNTURE as string,
   
}:{
  token: string;
  secret?: Secret;
   

}): Promise<JwtPayload>=>{
  return verify (token, secret) as JwtPayload
}

export const detectSignatureLevel = async(role:RoleEnum= RoleEnum.user):Promise<signatureLevelEnum>=>{
  let signatureLevel: signatureLevelEnum = signatureLevelEnum.Bearer

  switch (role) {
    case RoleEnum.admin:
      case RoleEnum.superAdmin:
      signatureLevel= signatureLevelEnum.System
      break;
  
    default:
      signatureLevel = signatureLevelEnum.Bearer
      break;
  }
  return signatureLevel
}

export const getSignatures= async(
  signatureLevel:signatureLevelEnum= signatureLevelEnum.Bearer
):Promise<{access_signature:string; refresh_signature:string}>=>{
  let signatures: {access_signature:string, refresh_signature:string} = {
    access_signature:"", 
    refresh_signature :""
  }

  switch (signatureLevel) {
    case signatureLevelEnum.System:
      signatures.access_signature=
       process.env.ACCESS_SYSTEM_TOKEN_SIGNTURE as string;
      signatures.refresh_signature =
       process.env.REFRESH_SYSTEM_TOKEN_SIGNTURE as string;
      break;
  
    default:
   signatures.access_signature=
    process.env.ACCESS_USER_TOKEN_SIGNTURE as string;
      signatures.refresh_signature =
       process.env.REFRESH_USER_TOKEN_SIGNTURE as string;
      break;
  }
  return signatures;
}
export const createLoginCredentials = async(user:HUserDocument)=>{
  const signatureLevel = await detectSignatureLevel(user.role)
    const signatures =await getSignatures(signatureLevel)
  console.log({signatures});
  const jwtid = uuid()
    const access_token = await generateToken({
    payload:{_id: user._id},
   secret: signatures.access_signature,
    options:{expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN), 
      jwtid}
   })
  
  
   const refresh_token = await generateToken({
    payload:{_id: user._id},
    secret : signatures.refresh_signature,
    options :{expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      jwtid},
   })
      return {access_token, refresh_token};
}

export const decodedToken = async({
  authorization,
  tokenType= TokenEnum.access
}:{
  authorization:string;
  tokenType?:TokenEnum

})=>{
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel)
  const [bearerKey, token] = authorization.split(" ")
if (!bearerKey || !token) {
  throw new UnauthorizedException("missing token parts")
}
const signatures = await getSignatures(bearerKey as signatureLevelEnum)
const decoded = await verifyToken({
  token,
  secret:
  tokenType=== TokenEnum.refresh ?
  signatures.refresh_signature:
  signatures.access_signature
});
if (!decoded?._id || !decoded?.iat) {
  throw new BadRequest("invalid token payload")
}
if (await tokenModel.findOne({filter:{jti:decoded.jti}})) {
  throw new UnauthorizedException("invalid or old login credentials")
}
const user = await userModel.findOne({
  filter:{_id:decoded._id}
})
if (!user) {
  throw new BadRequest("not register account")
}
if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000) {
  throw new UnauthorizedException("invalid or old login credentials")
}
return {user,decoded}
}
export const createRevokeToken = async(decoded: JwtPayload):Promise<HTokenDocument>=>{
  const tokenModel = new TokenRepository(TokenModel);

  const [result]=await tokenModel.create({
    data:[
      {
        jti: decoded.jti as string ,
        expiresIn:
        (decoded.iat as number)+
        Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        userId: decoded._id
      }
    ]
  }) || []
  if (!result) {
    throw new BadRequest("fail to revoke this token")
  }
  return result
}

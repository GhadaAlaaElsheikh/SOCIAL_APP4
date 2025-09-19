import { Request, Response } from "express"
import { ILogoutDTto } from "./user.dto"
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token.security"
import { Types, UpdateQuery } from "mongoose"
import { HUserDocument, IUser, RoleEnum, UserModel } from "../../database/model/User.model"
import { UserRepository } from "../../database/repository/user.repository"
import { JwtPayload } from "jsonwebtoken"
import { createPresignedUploadLink, deleteFiles, deleteFolderByPrefix, uploadFiles } from "../../utils/multer/s3.config"
import { storageEnum } from "../../utils/multer/cloud.multer"
import { BadRequest, conflictException, ForbiddenException, NotFoundException } from "../../utils/response/error.response"
import { s3Event } from "../../utils/multer/s3.event"
import { compareHash, generateHash } from "../../utils/security/hash.security"
import { successResponse } from "../../utils/response/success.response"
import { FriendRequestRepository, PostRepository } from "../../database/repository"
import { FriendRequestModel, PostModel } from "../../database/model"
 
class UserService{
  private userModel = new UserRepository(UserModel)
  //private tokenModel = new TokenRepository(TokenModel)
private postModel = new PostRepository(PostModel)
private friendRequestModel = new FriendRequestRepository(FriendRequestModel)
  constructor(){}

  profile = async (req:Request, res:Response):Promise<Response>=>{
  const profile = await this.userModel.findByIdAndUpdate({id:req.user?._id as Types.ObjectId,
    options:{
      populate:[{
        path:"friends",
        select:"firstName lastName email gender profilePicture",
      }]
    }
  })
  if (!profile) {
    throw new NotFoundException("fail to find user profile")
  }
    return res.json({message:"done",
      data:{
       user:profile
      },

  })
  }
    dashboard = async (req:Request, res:Response):Promise<Response>=>{
    const result = await Promise.allSettled([
   this.userModel.find({filter:{}}),
       this.postModel.find({filter:{}})
       ])
      return res.json({message:"done",
      data:{
          result
      },

  })
  }
    changeRole = async (req:Request, res:Response):Promise<Response>=>{
 const {userId} = req.params as unknown as {userId:Types.ObjectId};
const {role}:{role:RoleEnum} = req.body
const denyRoles :RoleEnum[]=[role,RoleEnum.superAdmin]
if (req.user?.role === RoleEnum.admin) {
  denyRoles.push(RoleEnum.admin)
}
 const user = await this.userModel.findOneAndUpdate({
  filter:{
    _id:userId as Types.ObjectId,
    role:{$nin:denyRoles}
  },
  update:{
    role
  }
 })
 if (!user) {
  throw new NotFoundException("fail to find matching result")
 }
 return successResponse({
  res,
 
 })
  }
     sendFriendRequest = async (req:Request, res:Response):Promise<Response>=>{
 const {userId} = req.params as unknown as {userId:Types.ObjectId};
 const check = await this.friendRequestModel.findOne({
  filter:{
    createdBy:{$in:[req.user?._id,userId]},
    sendTo:{$in:[req.user?._id, userId]}
  }
 })
 if (check) {
  throw new conflictException("friend request already exist")
 }
 const user = await this.userModel.findOne({
  filter:{_id:userId}
 })
 if (!user) {
  throw new NotFoundException("invalid recipient")
 }
 const [friendRequest] = await this.friendRequestModel.create({
data:[
  {
    createdBy: req.user?._id as Types.ObjectId,
    sendTo: userId,
  }
]
 })|| []
 if (!friendRequest) {
  throw new BadRequest("something went wrong!!!")
 }
 return successResponse({
  res,
  statusCode:201
 
 })
  }
     acceptFriendRequest = async (req:Request, res:Response):Promise<Response>=>{
 const {requestId} = req.params as unknown as {requestId:Types.ObjectId};
 const friendRequest = await this.friendRequestModel.findOneAndUpdate({
  filter:{
 _id:requestId,
    sendTo:req.user?._id,
    acceptedAt:{$exists:false}
  },
  update:{
    acceptedAt:new Date()
  }
 })
 if (!friendRequest) {
  throw new conflictException("friend request already exist")
 }
 await Promise.all([
   await this.userModel.updateOne({
    filter:{_id:friendRequest.createdBy},
    update:{
      $addToSet:{friends:friendRequest.sendAt},
    }
   }),
   await this.userModel.updateOne({
    filter:{_id:friendRequest.sendTo},
    update:{
      $addToSet:{friends:friendRequest.createdBy},
    }
   })
 ])
 return successResponse({
  res,
   
 
 })
  }
  profileImage = async (req:Request, res:Response):Promise<Response>=>{
  /*  const Key= await uploadLargeFile({
      storageApproach:storageEnum.disk,
      file:req.file as Express.Multer.File,
       path: `users/${req.decoded?._id}`
    })
       return res.json({
      message:"done",
      data:{
        Key
      }
    })*/
   const {contentType, originalname}:
   {contentType:string, originalname: string}
   = req.body;
   const {url , key} = await createPresignedUploadLink({
    contentType,
    originalname,
    path:`users/${req.decoded?._id}`,
   })
   const user = await this.userModel.findOneAndUpdate({
    filter: req.decoded?._id,
    update:{
      profileImage: key,
      tempProfileImage: req.user?.profileImage,
    }
   })
   if (!user) {
    throw new BadRequest("fail to update user profile image")
   }
   s3Event.emit("trackFileUpload",{
    Key:key,
    userId: req.decoded?._id,
     expiresIn:30000,
      oldKey:req.user?.profileImage
    })
   return res.json({
    message:"done",
    data:{
     user
    }
   })
  }

   profileCoverImage = async (req:Request, res:Response):Promise<Response>=>{


    const urls= await uploadFiles({
      storageApproach:storageEnum.disk,
      files:req.files as Express.Multer.File[],
       path: `users/${req.decoded?._id}/cover`,
       useLarge:true,
    })
    const user = await this.userModel.findOneAndUpdate({
      filter:req.user?._id as Types.ObjectId,
      update:{
        coverImage: urls,
      },
      options:{
        new: false,
      }
    })
    if (user?.coverImage?.length) {
      await deleteFiles({urls:user.coverImage})
    }
    return res.json({
      message:"done",
      data:{
        urls
      }
    })
  }

updatePassword = async (req: Request, res: Response): Promise<Response> => {
  const { oldPassword, newPassword } = req.body;
  const user = await this.userModel.findOne({ filter: { _id: req.decoded?._id }});
  if (!user) throw new NotFoundException("User not found");

  if (!(await compareHash(oldPassword, user.password))) {
    throw new BadRequest("Old password is incorrect");
  }

  const hashed = await generateHash(newPassword);
  await this.userModel.updateOne({
    filter: { _id: req.decoded?._id },
    update: { password: hashed, changeCredentialsTime: new Date() }
  });

  return successResponse({ res, message: "Password updated" });
};
 

  logout = async (req:Request, res:Response):Promise<Response>=>{
    const{flag}:ILogoutDTto = req.body
    let statusCode :number=200
    const update:UpdateQuery<IUser>={}
    switch (flag) {
      case logoutEnum.all:
        update.changeCredentialsTime= new Date()
        break;
    
      default:
         await createRevokeToken(req.decoded as JwtPayload)

        statusCode=201;
        break;
    }
    await this.userModel.updateOne({
      filter:{_id:req.decoded?._id},
      update,
    })
    return res.status(statusCode).json({message:"done" })
  }

  refreshToken = async (req:Request, res:Response):Promise<Response>=>{
    const  credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload)
  return res.status(201).json({message:"done", data:{credentials}})
  };
  freezeAccount = async(req:Request, res:Response):Promise<Response>=>{
    const {userId} = req.params;

    if (userId && req.user?.role != RoleEnum.admin) {
      throw new ForbiddenException("not authorized account")
    }
    const user = await this.userModel.updateOne({
      filter:{
        _id: userId || req.decoded?._id,
        freezedAt: {$exists: false},
      },
      update:{
        freezedAt: new Date(),
        freezedBy: req.user?._id,
        changeCredentialsTime: new Date(),
        $unset: {restoredAt:1, restoredBy: 1}
      }
    })
    if (!user.matchedCount) {
      throw new NotFoundException("fail to freeze this account")
    }
    return res.json({message:"done"})
  }
   hardDelete = async(req:Request, res:Response):Promise<Response>=>{
    const {userId} = req.params;
 
    const user = await this.userModel.deleteOne({
      filter:{
        _id: userId  ,
        freezedAt: {$exists: true},
      },
     
    })
    if (!user.deletedCount) {
      throw new NotFoundException("fail to delete this account")
    }
    await deleteFolderByPrefix({path:`users/${userId}`})
    return res.json({message:"done"})
  }
}
export default new UserService();   
   
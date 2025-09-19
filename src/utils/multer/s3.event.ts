import { EventEmitter } from "node:events";
import { getFile } from "./s3.config";
import { UserRepository } from "../../database/repository/user.repository";
import { HUserDocument, UserModel } from "../../database/model/User.model";
import { UpdateQuery } from "mongoose";

export const s3Event = new EventEmitter({});

s3Event.on("trackFileUpload", (data)=>{
  const userModel = new UserRepository(UserModel)
  setTimeout(async ()=>{
    try {
       await getFile({Key:`users/${data.Key}`})
      await userModel.updateOne({
        filter:{_id: data.userId},
        update:{
          $unset:{tempProfileImage:1},
        }
      })
      console.log("done");
      
    } catch (error:any) {
      if (error.code === "NotSuchKey") {
         
        let unsetData:UpdateQuery<HUserDocument> = {tempProfileImage:1}
        if (!data.oldKey) {
          unsetData ={
            tempProfileImage:1,
            profileImage:1,
          }
        }
        await userModel.updateOne({
        filter:{_id: data.userId},
        update:{
          profileImage:data.oldKey,
          $unset:{tempProfileImage:1},
        }
      })
        
      }
      data.expiresIn || 3000
    }
  })
})
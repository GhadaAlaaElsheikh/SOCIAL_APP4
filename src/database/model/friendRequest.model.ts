 
import { HydratedDocument, model,models, Schema, Types } from "mongoose";
 
 

 
export interface IFriendRequest{
  createdBy: Types.ObjectId;
 sendTo:Types.ObjectId;
acceeptedAt?: Date;

  content?: string;
  attachments?: string[];
 

  
   createdAt?: Date;
   updatedAt?: Date;
}

export type HFriendRequestDocument = HydratedDocument<IFriendRequest>;

const friendRequestSchema = new Schema<IFriendRequest>(
  {
     createdBy:{type:Schema.Types.ObjectId, ref:"User",required:true},
      sendTo:{type:Schema.Types.ObjectId, ref:"User",required:true},
      acceeptedAt:Date,
     
   

  },
  {
    timestamps:true,
    strictQuery:true,
   
  }
)
friendRequestSchema.pre(["findOne", "find","countDocuments"],async function (next) {
 const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({...query})
  }else{
    this.setQuery({...query, freezedAt:{$exists: false}})
  }
  console.log(this.getQuery);
  
  next()
 })
 
 
 friendRequestSchema.pre(["updateOne", "findOneAndUpdate"],async function(next){
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({...query})
  }else{
    this.setQuery({...query, freezedAt:{$exists: false}})
  }
  next()
 })
 friendRequestSchema.virtual("reply",{
  localField:"_id",
  foreignField:"commentId",
  ref:"Comment",
  justOne:true,
 })
 
 export const FriendRequestModel = models.Comment || model<IFriendRequest>("FriendRequest", friendRequestSchema)
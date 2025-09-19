 
import {Types ,Schema, model, models, HydratedDocument} from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/event/email.event";
 
 


export enum GenderEnum{
  male="male",
  female="female"
}
export enum RoleEnum{
  user="user",
  admin="admin",
  superAdmin ="super-admin"

}
export enum providerEnum{
  google="google",
  system="system"
}
export interface IUser{
 _id:Types.ObjectId;

 firstName:string;
 lastName:string;
 username?:string;

 slug?: string;
 extra: string;

 email:string;
 confirmEmailOtp?:string;
 confirmedAt?:Date;

 password:string;
 resetPasswordOtp?:string;
 changeCredentialsTime?:Date;

 phone?:string;
 address?:string;

 gender:GenderEnum;
 role: RoleEnum;
  provider: providerEnum;

  profileImage?: string;
  tempProfileImage?: string;
  coverImage?:string[];

 

  freezedAt?: Date,
freezedBy?: Types.ObjectId,
restoredAt?: Date,
restoredBy?: Types.ObjectId,
friends?:Types.ObjectId[],

 createdAt:Date;
 updatedAt?:Date

}

const userSchema = new Schema<IUser>(
  {

 firstName:{type:String, required:true, minLength:2, maxLength:25},
 lastName: {type:String, required:true, minLength:2, maxLength:25},
  
 slug:{type:String, required:true, minLength:2, maxLength:52},
extra:{
  type:String
},

 email: {type:String, required:true, unique:true},
 confirmEmailOtp: {type:String},
 confirmedAt: {type:Date},
 
 password:{
  type:String,
  required: function(){
    return this.provider === providerEnum.google ? false : true;
  }
 },
 resetPasswordOtp: {type:String},
 changeCredentialsTime :{type:Date},

 phone: {type:String},
 address: {type:String},

 profileImage:{type:String},
 coverImage:{type:String},

 

 gender:{type:String, enum:GenderEnum, default:GenderEnum.male},
 role:{type:String, enum:RoleEnum, default: RoleEnum.user},
provider:{
  type:String,
  enum: providerEnum,
  default: providerEnum.system
},
freezedAt:  Date,
freezedBy:  {type:Schema.Types.ObjectId, ref:"User"},
restoredAt:  Date,
restoredBy:{type: Schema.Types.ObjectId, ref:"User"},
friends:[{type:Schema.Types.ObjectId, ref:"User"}],

  },
  {
    timestamps: true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  }
);

userSchema.virtual("username").set(function(value:String){
  const [firstName, lastName] = value.split(" ") || []
  this.set({firstName, lastName, slug:value.replaceAll(/\s+/g,"-")})
}).get(function(){
  return this.firstName + " " + this.lastName;
})


 userSchema.pre("save",
   async function(this:HUserDocument & {wasNew: boolean},next){
    this.wasNew = this.isNew ||  this.isModified("email")
  console.log({pre_save:this, password:this.isModified("password"),
    modifiedPaths: this.modifiedPaths(),
    new: this.isNew,
    directPaths: this.directModifiedPaths(),
    isdirectPaths: this.isDirectModified("extra"),
  selected:this.isSelected("extra.name"),
  directSelect :this.isDirectSelected("extra.name"),
  islastNameInit :this.isInit("lastName"),
  isGenderInit: this.isInit("gender")
   })
  if (this.isModified("password")) {
    this.password = await generateHash(this.password)
  }
 this.password = await generateHash(this.password)
  next()
 })
 
 userSchema.post("save", async function (doc,next) {
  const that = this as HUserDocument & {wasNew: boolean}
  console.log({post_save: this, doc, new:that.isNew});
  if (that.wasNew) {
    emailEvent.emit("confirmEmail",{
    to:this.email,
    otp:123654,
  })
  
  }
   next()
 })

 userSchema.pre(["find", "findOne"], function(next){
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({...query})
  }else{
    this.setQuery({...query, freezedAt:{$exists: false}})
  }
  next()
 })
 
 
 
export const UserModel = models.User || model<IUser>("User", userSchema)
 export type HUserDocument = HydratedDocument<IUser>
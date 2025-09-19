import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as TDocument } from "../model";
import { DatabaseRepository } from "./database.repository";
import { BadRequest } from "../../utils/response/error.response";


export class UserRepository extends DatabaseRepository<TDocument>{
  constructor (protected override readonly model:Model<TDocument>){
    super(model);
  }
   async createUser({
      data,
      options,
    }:{
      data:Partial<TDocument>[];
      options?: CreateOptions ;
    }): Promise<HydratedDocument<TDocument>>{
     const [user] = await this.create({data,options}) || [];
     if (!user) {
      throw new BadRequest("fail to create thi suser")
      
     }
     return user
    }
    async findByEmail(email: string): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne({ email }).exec();
  }
   async updateUser(id: string, update: Partial<TDocument>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
   async updatePassword(id: string, hashedPassword: string) {
    return this.model
      .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
      .exec();
  }
  }

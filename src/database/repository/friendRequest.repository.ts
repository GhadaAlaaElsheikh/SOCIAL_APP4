import { DatabaseRepository } from "./database.repository";
import { IPost as TDocument} from "../model"
import { Model } from "mongoose";
 


export class FriendRequestRepository extends DatabaseRepository<TDocument>{
   constructor(protected override readonly model:Model<TDocument>){
    super(model)
  }
}
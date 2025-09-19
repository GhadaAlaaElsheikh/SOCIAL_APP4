import { RoleEnum } from "../../database/model/User.model";


export const endPoint ={
  profile:[RoleEnum.user],
  hardDelete:[RoleEnum.admin],
  restoreAccount :[RoleEnum.admin],
  dashboard:[RoleEnum.admin,RoleEnum.superAdmin]
}
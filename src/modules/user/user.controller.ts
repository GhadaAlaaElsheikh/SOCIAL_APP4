import { Router } from "express";
 
import {  authentication, authorization } from "../../middleware/authentication.middleware";
 import * as validators from './user.validation'
import userService from "./user.service";
import { validation } from "../../middleware/validation.middleware";
import { TokenEnum } from "../../utils/security/token.security";
import { cloudFileUpload, fileValidation, storageEnum } from "../../utils/multer/cloud.multer";
import { endPoint } from "./user.authorization";
const router = Router();
router.get("/",authentication(),userService.profile)
router.get("/dashboard",authorization(endPoint.dashboard),userService.dashboard)
router.patch("/accept-send-friend-request/:requestId",
  authentication(),
  validation(validators.acceptFriendRequest),
  userService.acceptFriendRequest)

  router.post("/:userId/send-friend-request",
  authentication(),
  validation(validators.sendFriendRequest),
  userService.sendFriendRequest)
  
router.get("/:userId/change-role",
  authorization(endPoint.dashboard),
validation(validators.changeRole),
userService.dashboard)

router.patch(
  "/profile-image",
  authentication(),
  userService.profileImage
)
router.patch("/update-password",
   authentication(),
   validation(validators.updatePassword),
   userService.updatePassword)
router.patch(
  "/profile-cover-image",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach:storageEnum.disk,
  }).array("images",2),
  userService.profileCoverImage
)
 

router.delete(
  "/{/:userId}/freeze-image",
  authentication(),
  validation(validators.freezeAccount),
  userService.freezeAccount
)
router.delete(
  "/:userId",
  authorization(endPoint.hardDelete),
  validation(validators.hardDelete),
  userService.hardDelete
)
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken)
router.post("/logout",authentication(),validation(validators.logout),userService.logout)
export default router
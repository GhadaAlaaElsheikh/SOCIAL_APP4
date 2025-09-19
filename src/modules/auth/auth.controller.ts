import authService from "./auth.service";
import { Router } from "express";
import * as validators from './auth.validation'
import { validation } from "../../middleware/validation.middleware";
const router:Router = Router();

router.post("/signup",validation(validators.signup),authService.signup);
router.post("/signup-gmail", validation(validators.signupGmail), authService.signupGmail)

router.post("/login",validation(validators.login),authService.login)
router.post("/login-gmail", validation(validators.loginGmail), authService.loginGmail)

router.patch("/confirm-email",validation(validators.confirmEmail),authService.confirmEmail)

router.patch("send-password",validation(validators.sendForgetPassword), authService.sendForgetCode)
router.patch("verify-password",validation(validators.verifyForgetPassword), authService.verifyForgetCode)
router.patch("reset-password",validation(validators.resetForgetPassword), authService.resetForgetCode)

export default router;
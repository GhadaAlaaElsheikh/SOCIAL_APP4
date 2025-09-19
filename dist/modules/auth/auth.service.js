"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../database/model/User.model");
const user_repository_1 = require("../../database/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
const success_response_1 = require("../../utils/response/success.response");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || []
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequest("fail to verify google account");
        }
        return payload;
    }
    signupGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email
            },
        });
        if (user) {
            if (user.provider === User_model_1.providerEnum.google) {
                return await this.loginGmail(req, res);
            }
            throw new error_response_1.conflictException(`email exist with another provider:: ${user.provider}`);
        }
        const [newuser] = await this.userModel.create({
            data: [{
                    firstName: given_name,
                    lastName: family_name,
                    email: email,
                    provider: User_model_1.providerEnum.google,
                    profileImage: picture,
                    confirmedAt: new Date()
                }]
        }) || [];
        if (!newuser) {
            throw new error_response_1.BadRequest("fail to signup with gmail please try again");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newuser);
        return res.json({ message: "done", data: { credentials } });
    };
    loginGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.providerEnum.google
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("not register account or registered with another provider");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({ message: "done", data: { credentials } });
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        console.log({ username, email, password });
        const checkUser = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: true,
            }
        });
        if (checkUser) {
            throw new error_response_1.conflictException("email exists");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.createUser({
            data: [{
                    username,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)),
                }],
        });
        email_event_1.emailEvent.emit("confirmEmail", {
            to: email,
            otp
        });
        return res.status(201).json({ message: "done", data: { user } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp)) {
            throw new error_response_1.conflictException("invalid confirmation code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 }
            }
        });
        return (0, success_response_1.successResponse)({ res });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.providerEnum.system,
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid login data");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequest("verify your account first");
        }
        if (!(await (0, hash_security_1.compareHash)(password, user.password))) {
            throw new error_response_1.NotFoundException("invalid login");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return (0, success_response_1.successResponse)({ res, data: { credentials } });
    };
    sendForgetCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.providerEnum.system,
                confirmedAt: { $exists: true },
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const result = await this.userModel.updateOne({
            filter: {
                email,
            },
            update: {
                resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp))
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("fail to send the reset code");
        }
        email_event_1.emailEvent.emit("resetPassword", { to: email, otp });
        return (0, success_response_1.successResponse)({ res });
    };
    verifyForgetCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.providerEnum.system,
                confirmedAt: { $exists: true },
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.conflictException("invalid otp");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    resetForgetCode = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.providerEnum.system,
                confirmedAt: { $exists: true },
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.conflictException("invalid otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 }
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("fail to account password");
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new AuthenticationService();

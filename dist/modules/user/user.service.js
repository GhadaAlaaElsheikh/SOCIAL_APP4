"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../database/model/User.model");
const user_repository_1 = require("../../database/repository/user.repository");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const error_response_1 = require("../../utils/response/error.response");
const s3_event_1 = require("../../utils/multer/s3.event");
const hash_security_1 = require("../../utils/security/hash.security");
const success_response_1 = require("../../utils/response/success.response");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        return res.json({ message: "done",
            data: {
                user: req.user?._id,
                decoded: req.decoded?.iat,
            },
        });
    };
    profileImage = async (req, res) => {
        const { contentType, originalname } = req.body;
        const { url, key } = await (0, s3_config_1.createPresignedUploadLink)({
            contentType,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this.userModel.findOneAndUpdate({
            filter: req.decoded?._id,
            update: {
                profileImage: key,
                tempProfileImage: req.user?.profileImage,
            }
        });
        if (!user) {
            throw new error_response_1.BadRequest("fail to update user profile image");
        }
        s3_event_1.s3Event.emit("trackFileUpload", {
            Key: key,
            userId: req.decoded?._id,
            expiresIn: 30000,
            oldKey: req.user?.profileImage
        });
        return res.json({
            message: "done",
            data: {
                user
            }
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.storageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
            useLarge: true,
        });
        const user = await this.userModel.findOneAndUpdate({
            filter: req.user?._id,
            update: {
                coverImage: urls,
            },
            options: {
                new: false,
            }
        });
        if (user?.coverImage?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: user.coverImage });
        }
        return res.json({
            message: "done",
            data: {
                urls
            }
        });
    };
    updatePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const user = await this.userModel.findOne({ filter: { _id: req.decoded?._id } });
        if (!user)
            throw new error_response_1.NotFoundException("User not found");
        if (!(await (0, hash_security_1.compareHash)(oldPassword, user.password))) {
            throw new error_response_1.BadRequest("Old password is incorrect");
        }
        const hashed = await (0, hash_security_1.generateHash)(newPassword);
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update: { password: hashed, changeCredentialsTime: new Date() }
        });
        return (0, success_response_1.successResponse)({ res, message: "Password updated" });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return res.status(statusCode).json({ message: "done" });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({ message: "done", data: { credentials } });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params;
        if (userId && req.user?.role != User_model_1.RoleEnum.admin) {
            throw new error_response_1.ForbiddenException("not authorized account");
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.decoded?._id,
                freezedAt: { $exists: false },
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: { restoredAt: 1, restoredBy: 1 }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException("fail to freeze this account");
        }
        return res.json({ message: "done" });
    };
    hardDelete = async (req, res) => {
        const { userId } = req.params;
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            },
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundException("fail to delete this account");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return res.json({ message: "done" });
    };
}
exports.default = new UserService();

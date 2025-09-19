"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Event = void 0;
const node_events_1 = require("node:events");
const s3_config_1 = require("./s3.config");
const user_repository_1 = require("../../database/repository/user.repository");
const User_model_1 = require("../../database/model/User.model");
exports.s3Event = new node_events_1.EventEmitter({});
exports.s3Event.on("trackFileUpload", (data) => {
    const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    setTimeout(async () => {
        try {
            await (0, s3_config_1.getFile)({ Key: `users/${data.Key}` });
            await userModel.updateOne({
                filter: { _id: data.userId },
                update: {
                    $unset: { tempProfileImage: 1 },
                }
            });
            console.log("done");
        }
        catch (error) {
            if (error.code === "NotSuchKey") {
                console.log(error);
                await userModel.updateOne({
                    filter: { _id: data.userId },
                    update: {
                        profileImage: data.oldKey,
                        $unset: { tempProfileImage: 1 },
                    }
                });
            }
            data.expiresIn || 3000;
        }
    });
});

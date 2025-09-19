"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const modules_1 = require("./modules");
const error_response_1 = require("./utils/response/error.response");
const database_connection_1 = require("./database/database.connection");
const s3_config_1 = require("./utils/multer/s3.config");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const User_model_1 = require("./database/model/User.model");
const user_repository_1 = require("./database/repository/user.repository");
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const bootstrap = async () => {
    const port = process.env.PORT || 5000;
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 60 * 60000,
        limit: 2000,
        message: { error: "too many request please try again" },
        statusCode: 429,
    });
    app.use(limiter);
    app.get("/", (req, res) => {
        res.json({ message: `welcome ${process.env.APPLICATION_NAME}` });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.use("/post", modules_1.postRouter);
    app.get("/upload/*path", async (req, res) => {
        const { downloadName, download = "false" } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        console.log(s3Response.Body);
        if (!s3Response?.Body) {
            throw new error_response_1.BadRequest("fail tp fetch this asset");
        }
        res.setHeader("Content-type", `${s3Response.ContentType || "application/octet-stream"}`);
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName || Key.split("/").pop()}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.get("/upload/pre-signed/path", async (req, res) => {
        const { downloadName, download = "false", expiresIn = 120 } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPresignedUploadLink)({
            Key,
            download,
            downloadName: downloadName,
            expiresIn,
        });
        return res.json({ message: "done", data: { url } });
    });
    app.use(error_response_1.globalErrorHandling);
    await (0, database_connection_1.connectDB)();
    async function test() {
        try {
            const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
            const user = await userModel.findOne({
                filter: {}
            });
            await user.updateOne({
                lastName: "lol"
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    test();
    app.listen(port, () => {
        console.log(`server is running on port :: ${port}`);
    });
};
exports.default = bootstrap;

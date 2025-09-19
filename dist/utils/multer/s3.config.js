"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.getFile = exports.createGetPresignedUploadLink = exports.createPresignedUploadLink = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const cloud_multer_1 = require("./cloud.multer");
const node_fs_1 = require("node:fs");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.storageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
        Body: storageApproach === cloud_multer_1.storageEnum.memory ?
            file.buffer : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input.Key) {
        throw new error_response_1.BadRequest("fail to generate ");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.storageEnum.disk, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
            Body: storageApproach === cloud_multer_1.storageEnum.memory
                ? file.buffer
                : (0, node_fs_1.createReadStream)(file.path),
            contentType: file.mimetype
        }
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log(`upload file progress is ::`, progress);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.BadRequest("fail to generate upload key");
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageApproach = cloud_multer_1.storageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", files, useLarge = false, }) => {
    let urls = [];
    if (useLarge) {
        urls = await Promise.all(files.map(file => {
            return (0, exports.uploadLargeFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach,
            });
        }));
    }
    else {
        urls = await Promise.all(files.map(file => {
            return (0, exports.uploadFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach,
            });
        }));
    }
    urls = await Promise.all(files.map(file => {
        return (0, exports.uploadFile)({
            file,
            path,
            ACL,
            Bucket,
            storageApproach,
        });
    }));
    return urls;
};
exports.uploadFiles = uploadFiles;
const createPresignedUploadLink = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general", expiresIn = 120, contentType, originalname, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_pre_${originalname}`,
        ContentType,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn: 60 });
    if (!url || !command?.input?.Key) {
        throw new error_response_1.BadRequest("fail to create pre signed url ");
    }
    return { url, key: command.input.Key };
};
exports.createPresignedUploadLink = createPresignedUploadLink;
const createGetPresignedUploadLink = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, downloadName = "dummy", expiresIn = 120, download = "false", }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download === "true" ?
            `attachment; filename="${downloadName || Key.split("/").pop()}"`
            : undefined
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn: 60 });
    if (!url) {
        throw new error_response_1.BadRequest("fail to create pre signed url ");
    }
    return url;
};
exports.createGetPresignedUploadLink = createGetPresignedUploadLink;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${Key}`,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_Name, Key, }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key,
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, urls, Quiet = false, }) => {
    const Objects = urls.map((url) => {
        return { Key: url };
    });
    console.log(Objects);
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet,
        }
    });
    return (0, exports.s3Config)().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`
    });
    return (0, exports.s3Config)().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, Quiet = false, }) => {
    const fileList = await (0, exports.listDirectoryFiles)({ Bucket, path });
    if (!fileList?.Contents?.length) {
        throw new error_response_1.BadRequest("empty directory");
    }
    const urls = fileList.Contents.map((file) => {
        return file.Key;
    });
    return await (0, exports.deleteFiles)({ urls });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;

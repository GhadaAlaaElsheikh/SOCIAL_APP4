"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodedToken = exports.createLoginCredentials = exports.getSignatures = exports.detectSignatureLevel = exports.verifyToken = exports.generateToken = exports.logoutEnum = exports.TokenEnum = exports.signatureLevelEnum = void 0;
const uuid_1 = require("uuid");
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("../../database/model/User.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../database/repository/user.repository");
const token_repository_1 = require("../../database/repository/token.repository");
const Token_model_1 = require("../../database/model/Token.model");
var signatureLevelEnum;
(function (signatureLevelEnum) {
    signatureLevelEnum["Bearer"] = "Bearer";
    signatureLevelEnum["System"] = "System";
})(signatureLevelEnum || (exports.signatureLevelEnum = signatureLevelEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["access"] = "access";
    TokenEnum["refresh"] = "refresh";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
var logoutEnum;
(function (logoutEnum) {
    logoutEnum["only"] = "only";
    logoutEnum["all"] = "all";
})(logoutEnum || (exports.logoutEnum = logoutEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_TOKEN_SIGNTURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) } }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_TOKEN_SIGNTURE, }) => {
    return (0, jsonwebtoken_1.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const detectSignatureLevel = async (role = User_model_1.RoleEnum.user) => {
    let signatureLevel = signatureLevelEnum.Bearer;
    switch (role) {
        case User_model_1.RoleEnum.admin:
            signatureLevel = signatureLevelEnum.System;
            break;
        default:
            signatureLevel = signatureLevelEnum.Bearer;
            break;
    }
    return signatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const getSignatures = async (signatureLevel = signatureLevelEnum.Bearer) => {
    let signatures = {
        access_signature: "",
        refresh_signature: ""
    };
    switch (signatureLevel) {
        case signatureLevelEnum.System:
            signatures.access_signature =
                process.env.ACCESS_SYSTEM_TOKEN_SIGNTURE;
            signatures.refresh_signature =
                process.env.REFRESH_SYSTEM_TOKEN_SIGNTURE;
            break;
        default:
            signatures.access_signature =
                process.env.ACCESS_USER_TOKEN_SIGNTURE;
            signatures.refresh_signature =
                process.env.REFRESH_USER_TOKEN_SIGNTURE;
            break;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    console.log({ signatures });
    const jwtid = (0, uuid_1.v4)();
    const access_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
            jwtid }
    });
    const refresh_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            jwtid },
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodedToken = async ({ authorization, tokenType = TokenEnum.access }) => {
    const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    const [bearerKey, token] = authorization.split(" ");
    if (!bearerKey || !token) {
        throw new error_response_1.UnauthorizedException("missing token parts");
    }
    const signatures = await (0, exports.getSignatures)(bearerKey);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenEnum.refresh ?
            signatures.refresh_signature :
            signatures.access_signature
    });
    if (!decoded?._id || !decoded?.iat) {
        throw new error_response_1.BadRequest("invalid token payload");
    }
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
        throw new error_response_1.UnauthorizedException("invalid or old login credentials");
    }
    const user = await userModel.findOne({
        filter: { _id: decoded._id }
    });
    if (!user) {
        throw new error_response_1.BadRequest("not register account");
    }
    if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000) {
        throw new error_response_1.UnauthorizedException("invalid or old login credentials");
    }
    return { user, decoded };
};
exports.decodedToken = decodedToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    const [result] = await tokenModel.create({
        data: [
            {
                jti: decoded.jti,
                expiresIn: decoded.iat +
                    Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId: decoded._id
            }
        ]
    }) || [];
    if (!result) {
        throw new error_response_1.BadRequest("fail to revoke this token");
    }
    return result;
};
exports.createRevokeToken = createRevokeToken;

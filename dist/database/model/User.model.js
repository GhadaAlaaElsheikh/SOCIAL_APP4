"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.providerEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["google"] = "google";
    providerEnum["system"] = "system";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 25 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 25 },
    slug: { type: String, required: true, minLength: 2, maxLength: 52 },
    extra: {
        type: String
    },
    email: { type: String, required: true, unique: true },
    confirmEmailOtp: { type: String },
    confirmedAt: { type: Date },
    password: {
        type: String,
        required: function () {
            return this.provider === providerEnum.google ? false : true;
        }
    },
    resetPasswordOtp: { type: String },
    changeCredentialsTime: { type: Date },
    phone: { type: String },
    address: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    provider: {
        type: String,
        enum: providerEnum,
        default: providerEnum.system
    },
    freezedAt: Date,
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    friends: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew || this.isModified("email");
    console.log({ pre_save: this, password: this.isModified("password"),
        modifiedPaths: this.modifiedPaths(),
        new: this.isNew,
        directPaths: this.directModifiedPaths(),
        isdirectPaths: this.isDirectModified("extra"),
        selected: this.isSelected("extra.name"),
        directSelect: this.isDirectSelected("extra.name"),
        islastNameInit: this.isInit("lastName"),
        isGenderInit: this.isInit("gender")
    });
    if (this.isModified("password")) {
        this.password = await (0, hash_security_1.generateHash)(this.password);
    }
    this.password = await (0, hash_security_1.generateHash)(this.password);
    next();
});
userSchema.post("save", async function (doc, next) {
    const that = this;
    console.log({ post_save: this, doc, new: that.isNew });
    if (that.wasNew) {
        email_event_1.emailEvent.emit("confirmEmail", {
            to: this.email,
            otp: 123654,
        });
    }
    next();
});
userSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);

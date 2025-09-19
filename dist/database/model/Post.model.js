"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.LikeActionEnum = exports.AvailabilityEnum = exports.AllowcommentsEnum = void 0;
const mongoose_1 = require("mongoose");
var AllowcommentsEnum;
(function (AllowcommentsEnum) {
    AllowcommentsEnum["allow"] = "allow";
    AllowcommentsEnum["deny"] = "deny";
})(AllowcommentsEnum || (exports.AllowcommentsEnum = AllowcommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "onlyMe";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var LikeActionEnum;
(function (LikeActionEnum) {
    LikeActionEnum["like"] = "like";
    LikeActionEnum["unlike"] = "unlike";
})(LikeActionEnum || (exports.LikeActionEnum = LikeActionEnum = {}));
const postSchema = new mongoose_1.Schema({
    content: {
        type: String,
        minlength: 2,
        maxlength: 500000,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: [String],
    assetsFolderId: { type: String, required: true },
    availability: {
        type: String,
        enum: AvailabilityEnum,
        default: AvailabilityEnum.public
    },
    allowComments: {
        type: String,
        enum: AllowcommentsEnum,
        default: AllowcommentsEnum.allow
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        }],
    tags: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        }],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    freezedAt: Date,
    freezedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    restoredAt: Date,
    restoredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true,
    strictQuery: true,
});
postSchema.pre(["findOne", "find", "countDocuments"], async function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    console.log(this.getQuery);
    next();
});
postSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);

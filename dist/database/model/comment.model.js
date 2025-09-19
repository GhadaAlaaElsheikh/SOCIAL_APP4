"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" },
    content: {
        type: String,
        minlength: 2,
        maxlength: 500000,
        required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: [String],
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        }],
    tags: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        }],
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
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Post", commentSchema);

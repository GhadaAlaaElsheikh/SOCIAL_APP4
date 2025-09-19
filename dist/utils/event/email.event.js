"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const send_email_1 = require("../email/send.email");
const verify_email_1 = require("../email/verify.email");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on("confirmEmail", async (data) => {
    try {
        data.subject = "confirm-email";
        data.html = (0, verify_email_1.verifyEmail)({ otp: data.otp, title: "confirm email" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail confirm email ${error} `);
    }
});
exports.emailEvent.on("resetPassword", async (data) => {
    try {
        data.subject = "reset-password";
        data.html = (0, verify_email_1.verifyEmail)({ otp: data.otp, title: "reset code" });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail confirm email ${error} `);
    }
});

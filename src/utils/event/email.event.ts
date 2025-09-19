import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { verifyEmail } from "../email/verify.email";
export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options{
  otp:number;
}
emailEvent.on("confirmEmail",
  async(data: IEmail)=>{

    try {
      data.subject ="confirm-email"
      data.html=verifyEmail({otp:data.otp, title:"confirm email"})
      await sendEmail(data)
    } catch (error) {
      console.log(`fail confirm email ${error} `);
      
    }
  }
)

emailEvent.on("resetPassword",
  async(data: IEmail)=>{

    try {
      data.subject ="reset-password"
      data.html=verifyEmail({otp:data.otp,title:"reset code"})
      await sendEmail(data)
    } catch (error) {
      console.log(`fail confirm email ${error} `);
      
    }
  }
)
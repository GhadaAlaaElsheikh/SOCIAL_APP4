 import {resolve} from 'node:path'
 import {config} from "dotenv"
 config({path: resolve("./config/.env.development")})
 import  type  { Request,  Express, Response} from 'express'
import express from "express"
import cors from 'cors'
import helmet from 'helmet'
import {rateLimit} from 'express-rate-limit'
import {authRouter , postRouter, userRouter} from './modules'
//import {router as authRouter} from './modules/auth/'
// import authController from './modules/auth/auth.controller'
//import userController from './modules/user/user.controller'
//import { router as userRouter } from './modules/user'
import { BadRequest, globalErrorHandling } from './utils/response/error.response';
import { connectDB } from './database/database.connection';
import { createGetPresignedUploadLink, getFile } from './utils/multer/s3.config'
 import {promisify} from "node:util"
import {pipeline} from "node:stream"
import {  HUserDocument, UserModel } from './database/model/User.model'
import { UserRepository } from './database/repository/user.repository'
const createS3WriteStreamPipe = promisify(pipeline)
 
 const bootstrap = async(): Promise<void> =>{
  const port: string | number = process.env.PORT || 5000
   
const app:Express = express();
app.use(express.json())
  app.use(cors())
  app.use(helmet())
  const limiter = rateLimit({
    windowMs: 60 * 60000,
    limit :2000,
    message:{error:"too many request please try again"},
    statusCode:429,
  });
  app.use(limiter)

  app.get("/",(req:Request,res:Response)=>{
    res.json({message:`welcome ${process.env.APPLICATION_NAME}`})
  })
  app.use("/auth",authRouter)
  app.use("/user", userRouter)
   app.use ("/post", postRouter)
  //app.get("/test", async(req:Request, res:Response)=>{
    //const {Key}= req.query as {Key:string};
  //  const result = await deleteFile({Key})
  //const result = await deleteFiles({
  //  urls:[

    //],
    //Quiet:true
//  })
/*
const result = await listDirectoryFiles({
  path: `users/`
})
if (!result?.Contents?.length) {
  throw new BadRequest("empty directory")
}
const urls: string[] = result.Contents.map((file)=>{
return  file.Key as string;
})*/
//await deleteFolderByPrefix({path:`users/`})
//    return res.json({message:"done", data: {}})
//  })
   

app.get("/upload/*path", async (req:Request, res:Response):Promise<void>=>{ 
  const {downloadName, download="false"}  = req.query as {downloadName?:string, download?:string}
  const {path} = req.params as unknown as {path:string[]}
  const Key = path.join("/")
  const s3Response = await getFile({Key})
  console.log(s3Response.Body);
  if (!s3Response?.Body) {
    throw new BadRequest("fail tp fetch this asset")
  }
  res.setHeader("Content-type",`${s3Response.ContentType ||"application/octet-stream" }`)
  if(download === "true"){
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${downloadName ||Key.split("/").pop()}"`
  )
}
  return  await createS3WriteStreamPipe(s3Response.Body as NodeJS.ReadableStream, res)
})
app.get("/upload/pre-signed/path", 
  async (req:Request, res:Response):Promise<Response>=>{ 
  const {
    downloadName,
     download="false", 
     expiresIn=120
    }  =
      req.query as {
        downloadName?:string,
         download?:string; 
         expiresIn?:number
        }
  const {path} = req.params as unknown as {path:string[]}
  const Key = path.join("/")
  const url = await createGetPresignedUploadLink({
    Key,
     download,
      downloadName: downloadName as string,
      expiresIn,
    })
 return res.json({message:"done", data:{url}})
 
})

  app.use(globalErrorHandling)
  await connectDB()
  

  async function test() {
    try{
    /*  const user = new UserModel({
    username :"ghada alaa",
    email:`${Date.now()}@gmail.com`,
    password: "47856475",
  })
 user.extra ={name:"chfggj"}
 //user.extra.name ="jbhkhjk"
  await user.save()
}*/
//const userModel = new UserRepository(UserModel);

//const user = await userModel.findOne({
//  filter:{},
//  select:"extra.name"
//}) as HUserDocument
//user.gender=GenderEnum.female
//await user.save()
 
const userModel = new UserRepository(UserModel)
const user = await userModel.findOne({
  filter:{}
}) as HUserDocument
await user.updateOne({
  lastName:"lol"
})
} catch(error){
  console.log(error);
}
}
test()

  app.listen(port,()=>{
    console.log(`server is running on port :: ${port}`);
    
  })
}

  export default bootstrap;
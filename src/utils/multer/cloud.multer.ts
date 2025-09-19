import multer, { FileFilterCallback } from "multer"
 
import { BadRequest } from "../response/error.response"
 
 
export enum storageEnum{
  memory="memory",
  disk="disk"
}
export const fileValidation ={
  image:["image/jpeg", "image/png", "image/gif"]
}
export const cloudFileUpload = ({
  validation=[],
  storageApproach =storageEnum.memory,
  maxSizeMB = 2,
}:
  {
    validation?:string[];
    storageApproach?:storageEnum,
    maxSizeMB?: number
  })
  : multer.Multer=>{

const storage =storageApproach=== storageEnum.memory?
 multer.memoryStorage():
  multer.diskStorage({})
//    destination:os.tmpdir(),
//    filename(req, file:Express.Multer.File, callback) {
//      callback(null, `${uuid()}_${file.originalname}`)
//    },
//  })
  function fileFilter(req:Request, file: Express.Multer.File,callback:FileFilterCallback ) {
    
  if (!validation.includes(file.mimetype)) {
  return  callback(new BadRequest("validation error",
    {validationErrors:[{
      key:"file",
      issues:[{
        path:"file",
         message:"invalid file format"
        }]}]
      })
    )
  }
  return callback(null,true)
  }
  return multer({fileFilter,limits:{fileSize:maxSizeMB * 1024 * 1024},storage})
}


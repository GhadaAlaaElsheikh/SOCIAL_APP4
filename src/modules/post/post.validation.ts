import {z} from 'zod'
import { AllowcommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../database/model/Post.model'
import { generalFields } from '../../middleware/validation.middleware'
import { fileValidation } from '../../utils/multer/cloud.multer'
 

export const createPost={
  body:z.strictObject({
  content:z.string().min(2).max(500000).optional(),
  attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
  availability:z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
  allowComments: z.enum(AllowcommentsEnum).default(AllowcommentsEnum.allow),
  
  tags:z.
  array(generalFields.id)
 .max(10).optional(),

}).
superRefine((data,ctx)=>{

  if (!data.attachments?.length && !data.content) {
    ctx.addIssue({
      code:"custom",
      path:["content"],
      message:
      "sorry we cannot make a post without content and attachment"
    })
  }

  if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
    ctx.addIssue({
      code:"custom",
      path:["tags"],
      message:"dublicated tagged user"
    })
  }
})
}
export const updatePost={
  params:z.strictObject({
    postId:generalFields.id
  }),
  body:z.strictObject({
  content:z.string().min(2).max(500000).optional(),
  
  attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),

    removedAttachments: z.array
    ( z.string())
    .max(2).optional(),

  availability:z.enum(AvailabilityEnum).optional(),
  allowComments: z.enum(AllowcommentsEnum) .optional(),
    
  removedTags:z.
  array(generalFields.id)
 .max(10).optional(),

  tags:z.
  array(generalFields.id)
 .max(10).optional(),

}).
superRefine((data,ctx)=>{

  if (Object.values(data) ?.length) {
    ctx.addIssue({
      code:"custom",
      path:["content"],
      message:
      " all fields are empty"
    })
  }

  if (
    data.tags?.length &&
     data.tags.length !== [...new Set(data.tags)].length
    ) {
    ctx.addIssue({
      code:"custom",
      path:["tags"],
      message:"dublicated tagged user"
    })
  }
 

  if (
    data.removedTags?.length &&
     removedTags.length !== [...new Set(data.removedTags)].length
    ) {
    ctx.addIssue({
      code:"custom",
      path:["removed tags"],
      message:"removed tagged user"
    })
  }
})
}


export const likePost={
  params:z.strictObject({
    postId: generalFields.id
  }),
  query:z.strictObject({
    action:z.enum(LikeActionEnum).default(LikeActionEnum.like)
  })
}
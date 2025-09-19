import {z} from 'zod'
import { AllowcommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../database/model/Post.model'
import { generalFields } from '../../middleware/validation.middleware'
import { fileValidation } from '../../utils/multer/cloud.multer'
 

export const createComment={
  params:z.strictObject({postId:generalFields.id}),
  body:z.strictObject({
  content:z.string().min(2).max(500000).optional(),
  attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
 
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
export const replyComment ={
  params: createComment.params.extend({
    commentId: generalFields.id,
  }),
  body: createComment.body,
}
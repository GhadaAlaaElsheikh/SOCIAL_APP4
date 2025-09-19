import { likePost } from "./post.validation";
import{z} from 'zod'
export type LikePost = z.infer<typeof likePost.query>
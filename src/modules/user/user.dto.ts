import {z} from "zod";
import { logout } from "./user.validation";

 
 export type ILogoutDTto = z.infer<typeof logout.body>
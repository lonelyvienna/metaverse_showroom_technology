// This is a demo code file
// Feel free to delete it

import { UserInfo } from "../game/state/UserInfo";

export interface MsgChat {
    userInfo: UserInfo,
    content: string,
    time: Date
}
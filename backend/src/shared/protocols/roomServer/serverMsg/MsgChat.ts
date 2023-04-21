import { UserInfo } from "../../../game/state/UserInfo";

export interface MsgChat {
    time: Date,
    user: UserInfo,
    content: string
}
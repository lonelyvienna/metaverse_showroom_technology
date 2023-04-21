import { uint } from "tsrpc-proto"
import { UserInfo } from "../../../game/state/UserInfo"

/** 系统消息 */
export interface MsgUserJoin {
    time: Date,
    user: UserInfo
}

// export const conf = {}
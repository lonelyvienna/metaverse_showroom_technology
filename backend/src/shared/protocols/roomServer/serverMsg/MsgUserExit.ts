import { UserInfo } from "../../../game/state/UserInfo";

export interface MsgUserExit {
    time: Date,
    user: UserInfo
}

// export const conf = {}
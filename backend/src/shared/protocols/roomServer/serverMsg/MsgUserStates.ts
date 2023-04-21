import { RoomUserState } from "../../../game/state/RoomUserState"


/** 同步玩家状态 */
export interface MsgUserStates {
    userStates: {
        [uid: string]: RoomUserState
    }
}
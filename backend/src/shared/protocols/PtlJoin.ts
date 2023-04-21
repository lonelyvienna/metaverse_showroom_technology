import { GameSystemState } from "../game/GameSystem";
import { UserInfo } from "../game/state/UserInfo";

/** 加入房间 */
export interface ReqJoin {
    nickName: string,
    headImg: string,
}

export interface ResJoin {
    /** 加入房间后，自己的 信息*/
    userInfo: UserInfo,
    /** 状态同步：一次性同步当前状态 */
    gameState: GameSystemState
}

// export const conf = {}
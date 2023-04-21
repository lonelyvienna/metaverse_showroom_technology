
import { GameSystemState } from "../../game/GameSystem";
import { RoomData } from "../../game/RoomData";
import { UserInfo } from "../../game/state/UserInfo";
import { BaseConf, BaseRequest, BaseResponse } from "./../base";

export interface ReqJoinRoom extends BaseRequest {
    nickname: string,
    roomId: string,
    headImg: string,
    openId: string,
    skin: string,
}

export interface ResJoinRoom extends BaseResponse {
    currentUser: UserInfo,
    roomData: RoomData,
    /** 状态同步：一次性同步当前状态 */
    gameState: GameSystemState
}

export const conf: BaseConf = {

}
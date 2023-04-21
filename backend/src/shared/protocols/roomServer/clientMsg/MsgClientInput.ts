import { PlayerDance, PlayerJoin, PlayerMove, PlayerPos, PlayerSelectSkin, PlayerSit } from "../../../game/GameSystem";


/** 发送自己的输入 */
export interface MsgClientInput {
    sn: number,
    inputs: ClientInput[]
};

export type ClientInput = Omit<PlayerMove, 'userInfo'>
    | Omit<PlayerSit, 'userInfo'>
    | Omit<PlayerJoin, 'userInfo'>
    | Omit<PlayerPos, 'userInfo'>
    | Omit<PlayerSelectSkin, 'userInfo'>
    | Omit<PlayerDance, 'userInfo'>;
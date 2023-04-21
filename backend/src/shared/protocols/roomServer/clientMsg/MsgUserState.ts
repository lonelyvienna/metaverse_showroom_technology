import { RoomUserState } from "../../../game/state/RoomUserState";

export type MsgUserState = Omit<RoomUserState, 'uid'>
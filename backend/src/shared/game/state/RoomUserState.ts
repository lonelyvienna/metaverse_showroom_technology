import { UserInfo } from "./UserInfo";

export interface RoomUserState {
    type: string,  //run,walk,sit
    userInfo: UserInfo,
    // 位置
    pos: { x: number, y: number },
    speedDirX?: number,  //移动方向x
    speedDirY?: number,  //移动方向y
    speedTime?: number, //移动时间
    angle?: number,  //移动角度
    cameraRotateY: number,  //摄像机与初始时改变的角度
    chairName?: string,  //椅子名字
    chairPosX?: number,
    chairPosZ?: number,
    danceType?: number,
}
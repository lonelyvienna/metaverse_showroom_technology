// import { WsConnection, WsServer } from "tsrpc";
// import { gameConfig } from "../shared/game/gameConfig";
// import { GameSystem, GameSystemInput, PlayerJoin } from "../shared/game/GameSystem";
// import { UserInfo } from "../shared/game/state/UserInfo";
// import { ReqJoin } from "../shared/protocols/PtlJoin";
// import { ServiceType } from "../shared/protocols/serviceProto";

// /**
//  * 服务端 - 房间 - 逻辑系统
//  */
// export class Room {

//     // 帧同步频率，次数/秒
//     syncRate = gameConfig.syncRate;
//     nextPlayerId: number = 1;

//     gameSystem = new GameSystem();

//     server: WsServer<ServiceType>;
//     conns: WsConnection<ServiceType>[] = [];
//     pendingInputs: GameSystemInput[] = [];
//     playerLastSn: { [playerId: number]: number | undefined } = {};
//     lastSyncTime?: number;

//     constructor(server: WsServer<ServiceType>) {
//         this.server = server;
//         setInterval(() => { this.sync() }, 1000 / this.syncRate);
//     }

//     /** 加入房间 */
//     join(req: ReqJoin, conn: WsConnection<ServiceType>) {
//         let userInfo: UserInfo = {
//             id: this.nextPlayerId++,
//             nickName: req.nickName,
//             headImg: req.headImg
//         };
//         let input: PlayerJoin = {
//             type: 'PlayerJoin',
//             userInfo: userInfo,
//             // 初始位置随机
//             pos: {
//                 x: Math.random() * 4 - 2,
//                 y: Math.random() * 9 + 5
//             }
//         }
//         this.applyInput(input);

//         this.conns.push(conn);
//         conn.userInfo = input.userInfo;
//         conn.listenMsg('client/ClientInput', call => {
//             this.playerLastSn[input.userInfo.id] = call.msg.sn;
//             call.msg.inputs.forEach(v => {
//                 this.applyInput({
//                     ...v,
//                     userInfo: input.userInfo
//                 });
//             })
//         });

//         return input.userInfo;
//     }

//     applyInput(input: GameSystemInput) {
//         this.pendingInputs.push(input);
//     }

//     sync() {
//         let inputs = this.pendingInputs;
//         this.pendingInputs = [];

//         // Apply inputs
//         inputs.forEach(v => {
//             this.gameSystem.applyInput(v)
//         });

//         // Apply TimePast
//         let now = process.uptime() * 1000;
//         this.applyInput({
//             type: 'TimePast',
//             dt: now - (this.lastSyncTime ?? now)
//         });
//         this.lastSyncTime = now;

//         // 发送同步帧
//         this.conns.forEach(v => {
//             v.sendMsg('server/Frame', {
//                 inputs: inputs,
//                 lastSn: this.playerLastSn[v.userInfo!.id]
//             })
//         });
//     }

//     /** 离开房间 */
//     leave(userInfo: UserInfo, conn: WsConnection<ServiceType>) {
//         this.conns.removeOne(v => v.userInfo === userInfo);
//         this.applyInput({
//             type: 'PlayerLeave',
//             userInfo: userInfo
//         });
//     }
// }

// declare module 'tsrpc' {
//     export interface WsConnection {
//         userInfo: UserInfo;
//     }
// }
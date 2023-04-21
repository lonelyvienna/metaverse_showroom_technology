import { ServiceProto } from 'tsrpc-proto';
import { MsgUpdateRoomState } from './roomServer/admin/MsgUpdateRoomState';
import { ReqAuth, ResAuth } from './roomServer/admin/PtlAuth';
import { ReqCreateRoom, ResCreateRoom } from './roomServer/admin/PtlCreateRoom';
import { MsgClientInput } from './roomServer/clientMsg/MsgClientInput';
import { MsgUserState } from './roomServer/clientMsg/MsgUserState';
import { ReqExitRoom, ResExitRoom } from './roomServer/PtlExitRoom';
import { ReqJoinRoom, ResJoinRoom } from './roomServer/PtlJoinRoom';
import { ReqSendChat, ResSendChat } from './roomServer/PtlSendChat';
import { MsgChat } from './roomServer/serverMsg/MsgChat';
import { MsgFrame } from './roomServer/serverMsg/MsgFrame';
import { MsgUserExit } from './roomServer/serverMsg/MsgUserExit';
import { MsgUserJoin } from './roomServer/serverMsg/MsgUserJoin';
import { MsgUserStates } from './roomServer/serverMsg/MsgUserStates';

export interface ServiceType {
    api: {
        "admin/Auth": {
            req: ReqAuth,
            res: ResAuth
        },
        "admin/CreateRoom": {
            req: ReqCreateRoom,
            res: ResCreateRoom
        },
        "ExitRoom": {
            req: ReqExitRoom,
            res: ResExitRoom
        },
        "JoinRoom": {
            req: ReqJoinRoom,
            res: ResJoinRoom
        },
        "SendChat": {
            req: ReqSendChat,
            res: ResSendChat
        }
    },
    msg: {
        "admin/UpdateRoomState": MsgUpdateRoomState,
        "clientMsg/ClientInput": MsgClientInput,
        "clientMsg/UserState": MsgUserState,
        "serverMsg/Chat": MsgChat,
        "serverMsg/Frame": MsgFrame,
        "serverMsg/UserExit": MsgUserExit,
        "serverMsg/UserJoin": MsgUserJoin,
        "serverMsg/UserStates": MsgUserStates
    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 9,
    "services": [
        {
            "id": 0,
            "name": "admin/UpdateRoomState",
            "type": "msg"
        },
        {
            "id": 1,
            "name": "admin/Auth",
            "type": "api",
            "conf": {
                "allowGuest": true
            }
        },
        {
            "id": 2,
            "name": "admin/CreateRoom",
            "type": "api",
            "conf": {
                "allowGuest": true
            }
        },
        {
            "id": 12,
            "name": "clientMsg/ClientInput",
            "type": "msg"
        },
        {
            "id": 3,
            "name": "clientMsg/UserState",
            "type": "msg"
        },
        {
            "id": 4,
            "name": "ExitRoom",
            "type": "api",
            "conf": {}
        },
        {
            "id": 5,
            "name": "JoinRoom",
            "type": "api",
            "conf": {}
        },
        {
            "id": 6,
            "name": "SendChat",
            "type": "api",
            "conf": {}
        },
        {
            "id": 7,
            "name": "serverMsg/Chat",
            "type": "msg"
        },
        {
            "id": 11,
            "name": "serverMsg/Frame",
            "type": "msg"
        },
        {
            "id": 8,
            "name": "serverMsg/UserExit",
            "type": "msg"
        },
        {
            "id": 9,
            "name": "serverMsg/UserJoin",
            "type": "msg"
        },
        {
            "id": 10,
            "name": "serverMsg/UserStates",
            "type": "msg"
        }
    ],
    "types": {
        "admin/MsgUpdateRoomState/MsgUpdateRoomState": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "connNum",
                    "type": {
                        "type": "Number",
                        "scalarType": "uint"
                    }
                },
                {
                    "id": 1,
                    "name": "rooms",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "id",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "name",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "userNum",
                                    "type": {
                                        "type": "Number",
                                        "scalarType": "uint"
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "maxUserNum",
                                    "type": {
                                        "type": "Number",
                                        "scalarType": "uint"
                                    }
                                },
                                {
                                    "id": 4,
                                    "name": "startMatchTime",
                                    "type": {
                                        "type": "Number",
                                        "scalarType": "uint"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 5,
                                    "name": "updateTime",
                                    "type": {
                                        "type": "Number",
                                        "scalarType": "uint"
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        },
        "admin/PtlAuth/ReqAuth": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "adminToken",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "MatchServer"
                    }
                }
            ]
        },
        "admin/PtlAuth/ResAuth": {
            "type": "Interface"
        },
        "admin/PtlCreateRoom/ReqCreateRoom": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "adminToken",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "roomName",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "admin/PtlCreateRoom/ResCreateRoom": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "roomId",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "clientMsg/MsgClientInput/MsgClientInput": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "sn",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 1,
                    "name": "inputs",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "clientMsg/MsgClientInput/ClientInput"
                        }
                    }
                }
            ]
        },
        "clientMsg/MsgClientInput/ClientInput": {
            "type": "Union",
            "members": [
                {
                    "id": 0,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerMove"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                },
                {
                    "id": 1,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerSit"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                },
                {
                    "id": 2,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerJoin"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                },
                {
                    "id": 3,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerPos"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                },
                {
                    "id": 4,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerSelectSkin"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                },
                {
                    "id": 5,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/PlayerDance"
                        },
                        "keys": [
                            "userInfo"
                        ],
                        "type": "Omit"
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerMove": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerMove"
                    }
                },
                {
                    "id": 1,
                    "name": "sport",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 2,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 3,
                    "name": "speed",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "x",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "y",
                                "type": {
                                    "type": "Number"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 4,
                    "name": "angle",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 5,
                    "name": "cameraRotateY",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 6,
                    "name": "dt",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        },
        "../../game/state/UserInfo/UserInfo": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "openId",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "nickName",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "headImg",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 4,
                    "name": "skin",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerSit": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerSit"
                    }
                },
                {
                    "id": 1,
                    "name": "sport",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 2,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 3,
                    "name": "chairName",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 4,
                    "name": "chairPos",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "x",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "z",
                                "type": {
                                    "type": "Number"
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerJoin": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerJoin"
                    }
                },
                {
                    "id": 1,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 2,
                    "name": "pos",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "x",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "y",
                                "type": {
                                    "type": "Number"
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerPos": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerPos"
                    }
                },
                {
                    "id": 1,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 2,
                    "name": "pos",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "x",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "y",
                                "type": {
                                    "type": "Number"
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerSelectSkin": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerSelectSkin"
                    }
                },
                {
                    "id": 1,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 2,
                    "name": "skin",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerDance": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerDance"
                    }
                },
                {
                    "id": 1,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 2,
                    "name": "danceType",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        },
        "clientMsg/MsgUserState/MsgUserState": {
            "target": {
                "type": "Reference",
                "target": "../../game/state/RoomUserState/RoomUserState"
            },
            "keys": [
                "uid"
            ],
            "type": "Omit"
        },
        "../../game/state/RoomUserState/RoomUserState": {
            "type": "Interface",
            "properties": [
                {
                    "id": 1,
                    "name": "type",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 3,
                    "name": "pos",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "x",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "y",
                                "type": {
                                    "type": "Number"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 4,
                    "name": "speedDirX",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 5,
                    "name": "speedDirY",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 6,
                    "name": "speedTime",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 7,
                    "name": "angle",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 8,
                    "name": "cameraRotateY",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 9,
                    "name": "chairName",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                },
                {
                    "id": 10,
                    "name": "chairPosX",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 11,
                    "name": "chairPosZ",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 12,
                    "name": "danceType",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                }
            ]
        },
        "PtlExitRoom/ReqExitRoom": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseRequest"
                    }
                }
            ]
        },
        "../base/BaseRequest": {
            "type": "Interface"
        },
        "PtlExitRoom/ResExitRoom": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseResponse"
                    }
                }
            ]
        },
        "../base/BaseResponse": {
            "type": "Interface"
        },
        "PtlJoinRoom/ReqJoinRoom": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseRequest"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "nickname",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "roomId",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "headImg",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "openId",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 4,
                    "name": "skin",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlJoinRoom/ResJoinRoom": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "currentUser",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 1,
                    "name": "roomData",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/RoomData/RoomData"
                    }
                },
                {
                    "id": 2,
                    "name": "gameState",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/GameSystemState"
                    }
                }
            ]
        },
        "../../game/RoomData/RoomData": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "name",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "maxUser",
                    "type": {
                        "type": "Number",
                        "scalarType": "uint"
                    }
                },
                {
                    "id": 3,
                    "name": "users",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../../game/state/UserInfo/UserInfo"
                        }
                    }
                },
                {
                    "id": 4,
                    "name": "messages",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "user",
                                    "type": {
                                        "type": "Reference",
                                        "target": "../../game/state/UserInfo/UserInfo"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "time",
                                    "type": {
                                        "type": "Date"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "content",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 5,
                    "name": "lastEmptyTime",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 6,
                    "name": "startMatchTime",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 7,
                    "name": "updateTime",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        },
        "../../game/GameSystem/GameSystemState": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "players",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../../game/state/RoomUserState/RoomUserState"
                        }
                    }
                }
            ]
        },
        "PtlSendChat/ReqSendChat": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseRequest"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "content",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "PtlSendChat/ResSendChat": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../base/BaseResponse"
                    }
                }
            ]
        },
        "serverMsg/MsgChat/MsgChat": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "time",
                    "type": {
                        "type": "Date"
                    }
                },
                {
                    "id": 1,
                    "name": "user",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 2,
                    "name": "content",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "serverMsg/MsgFrame/MsgFrame": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "inputs",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../../game/GameSystem/GameSystemInput"
                        }
                    }
                },
                {
                    "id": 1,
                    "name": "lastSn",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                }
            ]
        },
        "../../game/GameSystem/GameSystemInput": {
            "type": "Union",
            "members": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerMove"
                    }
                },
                {
                    "id": 1,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerPos"
                    }
                },
                {
                    "id": 2,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerSit"
                    }
                },
                {
                    "id": 3,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerJoin"
                    }
                },
                {
                    "id": 4,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerLeave"
                    }
                },
                {
                    "id": 5,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerChat"
                    }
                },
                {
                    "id": 7,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerSelectSkin"
                    }
                },
                {
                    "id": 8,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/PlayerDance"
                    }
                },
                {
                    "id": 6,
                    "type": {
                        "type": "Reference",
                        "target": "../../game/GameSystem/TimePast"
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerLeave": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerLeave"
                    }
                },
                {
                    "id": 1,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                }
            ]
        },
        "../../game/GameSystem/PlayerChat": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "PlayerChat"
                    }
                },
                {
                    "id": 1,
                    "name": "time",
                    "type": {
                        "type": "Date"
                    }
                },
                {
                    "id": 2,
                    "name": "userInfo",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                },
                {
                    "id": 3,
                    "name": "content",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "../../game/GameSystem/TimePast": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "type",
                    "type": {
                        "type": "Literal",
                        "literal": "TimePast"
                    }
                },
                {
                    "id": 1,
                    "name": "dt",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        },
        "serverMsg/MsgUserExit/MsgUserExit": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "time",
                    "type": {
                        "type": "Date"
                    }
                },
                {
                    "id": 1,
                    "name": "user",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                }
            ]
        },
        "serverMsg/MsgUserJoin/MsgUserJoin": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "time",
                    "type": {
                        "type": "Date"
                    }
                },
                {
                    "id": 1,
                    "name": "user",
                    "type": {
                        "type": "Reference",
                        "target": "../../game/state/UserInfo/UserInfo"
                    }
                }
            ]
        },
        "serverMsg/MsgUserStates/MsgUserStates": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "userStates",
                    "type": {
                        "type": "Interface",
                        "indexSignature": {
                            "keyType": "String",
                            "type": {
                                "type": "Reference",
                                "target": "../../game/state/RoomUserState/RoomUserState"
                            }
                        }
                    }
                }
            ]
        }
    }
};
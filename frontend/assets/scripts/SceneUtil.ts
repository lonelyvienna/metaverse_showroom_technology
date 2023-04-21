import { director } from "cc";
import { ResStartMatch } from "./shared/protocols/matchServer/PtlStartMatch";

export interface SceneParamsMap {
    MatchScene: {},
    RoomScene: ResStartMatch
}

export class SceneUtil {

    static sceneParams: unknown;
    static loadScene<T extends keyof SceneParamsMap>(scene: T, params: SceneParamsMap[T]) {
        this.sceneParams = params;
        director.loadScene(scene);
    }

}
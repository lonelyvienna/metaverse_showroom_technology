import { _decorator, Component, Node, tween, Vec3, Quat, UIOpacity, game } from 'cc';
import { Facade } from '../../default/mvc/core/Facade';
import HomeMediator from '../game/home/HomeMediator';
import HomeView from '../game/home/HomeView';
import { SceneUtil } from '../SceneUtil';
const { ccclass, property } = _decorator;

@ccclass('RoomScene')
export class RoomScene extends Component {

    @property(Node)
    public moveScreen!: Node;   //移动屏幕

    start() {

        game.frameRate = 59;

        Facade.getInstance().openView(HomeMediator, HomeView, SceneUtil.sceneParams);

        // this.movingScreenAni();
    }

    /**
     * 移动屏幕
     */
    movingScreenAni() {

        let pos = this.moveScreen.position;

        let moveTween = tween(this.moveScreen)
            .to(20, { position: new Vec3(12, pos.y, pos.z) })
            .to(20, { position: new Vec3(21.5, pos.y, pos.z) })

        tween(this.moveScreen)
            .repeatForever(moveTween)
            .start();
    }

    /**
     * 旋转投影
     */
    // rotateProjection() {

    //     let rotate = tween(this.moveScreen)
    //         .by(100, { eulerAngles: new Vec3(0, 180, 0) })

    //     tween(this.floorProjection)
    //         .repeatForever(rotate)
    //         .start();
    // }
}



import { _decorator, Component, Node, EventTouch, UITransformComponent, Vec2, Vec3, macro, CCInteger, EventHandler } from 'cc';
import EventMgr from '../../../default/standar/event/EventMgr';

const { ccclass, property } = _decorator;

@ccclass('Joystick')
export default class Joystick extends Component {
    /** 摇杆移动中心 */
    @property({ type: Node, tooltip: '移动中心节点' })
    midNode: Node | null = null;

    /** 摇杆背景做监听，体验好些 */
    @property({ type: Node, tooltip: '摇杆背景节点' })
    joyBk: Node | null = null;

    /** 摇杆最大移动半径 */
    @property({ type: CCInteger, tooltip: '摇杆活动半径' })
    maxR: number = 100;

    /** 摇杆移动回调 */
    @property({ type: [EventHandler], tooltip: '摇杆移动回调' })
    joyCallBack: EventHandler[] = [];

    uITransform: UITransformComponent | null = null;

    onLoad() {

        // 归位
        this.goBackMid();
    }

    start() {

        this.uITransform = this.getComponent(UITransformComponent);

        this.joyBk?.on(Node.EventType.TOUCH_START, this.onTouchStart, this);

        this.joyBk?.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

        this.joyBk?.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.joyBk?.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /** 回归中心 */
    goBackMid() {

        this.midNode?.setPosition(0, 0, 0);
    }

    onTouchStart(e: EventTouch) {

        this.onTouchMove(e);
    }

    onTouchMove(e: EventTouch) {

        const location = e.getUILocation();

        if (this.uITransform != null) {

            // 坐标转换
            let pos = this.uITransform.convertToNodeSpaceAR(new Vec3(location.x, location.y));

            let tempPos = this.uITransform.convertToNodeSpaceAR(new Vec3(location.x, location.y));

            // 根据半径限制位置
            this.clampPos(pos);

            // 设置中间点的位置
            this.midNode?.setPosition(pos.x, pos.y, 0);

            // 算出与(1,0)的夹角
            let angle = this.covertToAngle(pos);

            // 触发回调
            this.joyCallBack.forEach(c => c.emit([pos, angle]));

            EventMgr.getInstance().sendListener("joysitckPlayer", { "pos": tempPos.normalize(), "angle": angle });

            //事件派发
            //EventMgr.getInstance().sendListener("joysitck", { "pos": pos, "angle": angle });
        }
    }

    onTouchEnd(e: EventTouch) {

        this.goBackMid();

        this.joyCallBack.forEach(c => c.emit([new Vec3(0, 0, 0)]));

        //EventMgr.getInstance().sendListener("joysitck", { "pos": new Vec3(0, 0, 0) });

        EventMgr.getInstance().sendListener("joysitckPlayer", { "pos": new Vec3(0, 0, 0).normalize() });
    }

    /** 根据半径限制位置 */
    clampPos(pos: Vec3) {

        let len = pos.length();

        if (len > this.maxR) {
            let k = this.maxR / len;
            pos.x *= k;
            pos.y *= k;
        }
    }

    /** 根据位置转化角度 */
    covertToAngle(pos: Vec3) {

        let angle = Math.atan2(pos.y, pos.x);

        return angle * macro.DEG;
    }
}
import { Component, _decorator, geometry, Vec3, EventTouch, Touch, Quat, Vec2, Node, EventMouse, lerp, director, Canvas, macro, view, PhysicsSystem, systemEvent, SystemEventType, math, input, Input } from 'cc'
import { EDITOR } from 'cc/env';
const { ccclass, property, type } = _decorator;
const { ray } = geometry;

let tempVec3 = new Vec3
let tempVec3_2 = new Vec3
let tempQuat = new Quat
const DeltaFactor = 1 / 200

let PositiveForward = new Vec3(0, 0, 1);

@ccclass('OrbitCamera')
export default class OrbitCamera extends Component {

    @property
    pause: boolean = false;     //是否暂停

    @property
    enableTouch = true;
    @property
    enableScaleRadius = false;

    @property
    autoRotate = false;
    @property
    autoRotateSpeed = 90;

    @property
    rotateSpeed = 1;
    @property
    followSpeed = 1;
    @property
    xRotationRange = new Vec2(5, 70);
    @type(Node)
    _target: Node | null = null;

    @property
    get radius() {
        return this._targetRadius;
    }
    set radius(v) {
        this._targetRadius = v;
    }
    @property
    radiusScaleSpeed = 1;
    @property
    minRadius = 5;
    @property
    maxRadius = 10;

    @type(Node)
    get target() {
        return this._target;
    }
    set target(v) {
        this._target = v;
        this._targetRotation.set(this._startRotation);
        this._targetCenter.set(v!.worldPosition);
    }

    @type(Vec3)
    get targetRotation(): Vec3 {
        if (!EDITOR) {
            this._startRotation.set(this._targetRotation);
        }
        return this._startRotation;
    }
    set targetRotation(v: Vec3) {
        this._targetRotation.set(v);
        this._startRotation.set(v);
    }

    @property
    followTargetRotationY = true;

    @type(Vec3)
    private _startRotation = new Vec3;

    private _center = new Vec3;
    private _targetCenter = new Vec3;

    private _touched = false;
    private _targetRotation = new Vec3;
    private _rotation = new Quat

    @property
    private _targetRadius = 10;
    private _radius = 200;

    onLoad() {

        let canvas = director.getScene()!.getComponentInChildren(Canvas);

        if (canvas && canvas.node) {

            if (this.enableTouch) {

                input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
                input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
                input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            }

            if (this.enableScaleRadius) {
                canvas.node.on(Node.EventType.MOUSE_WHEEL, this.onMouseWhee, this)
            }
        }
        else {
            if (this.enableTouch) {
                // systemEvent.on(SystemEventType.TOUCH_START, this.onTouchStart, this)
                // systemEvent.on(SystemEventType.TOUCH_MOVE, this.onTouchMove, this)
                // systemEvent.on(SystemEventType.TOUCH_END, this.onTouchEnd, this)
            }

            if (this.enableScaleRadius) {
                // systemEvent.on(SystemEventType.MOUSE_WHEEL, this.onMouseWhee, this)
            }
        }


        this.resetTargetRotation();
        Quat.fromEuler(this._rotation, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z);

        if (this.target) {
            this._targetCenter.set(this.target.worldPosition);
            this._center.set(this._targetCenter);
        }

        this._radius = this.radius;

        this.limitRotation()
    }

    resetTargetRotation() {

        let targetRotation = this._targetRotation.set(this._startRotation);

        if (this.followTargetRotationY) {
            targetRotation = tempVec3_2.set(targetRotation);
            Quat.toEuler(tempVec3, this.target!.worldRotation);
            targetRotation.y += tempVec3.y;
        }
    }

    onTouchStart() {

        this._touched = true;
    }

    onTouchMove(event?: EventTouch) {

        const touch = event.touch!;

        if (!this._touched || this.pause) return;
        let delta = touch!.getDelta()

        Quat.fromEuler(tempQuat, this._targetRotation.x, this._targetRotation.y, this._targetRotation.z);

        Quat.rotateX(tempQuat, tempQuat, -delta.y * DeltaFactor);
        Quat.rotateAround(tempQuat, tempQuat, Vec3.UP, -delta.x * DeltaFactor);

        Quat.toEuler(this._targetRotation, tempQuat);

        this.limitRotation()
    }

    onTouchEnd() {

        this._touched = false;
    }

    onMouseWhee(event: EventMouse) {

        let scrollY = event.getScrollY();
        this._targetRadius += this.radiusScaleSpeed * -Math.sign(scrollY);
        this._targetRadius = Math.min(this.maxRadius, Math.max(this.minRadius, this._targetRadius));
    }

    limitRotation() {

        let rotation = this._targetRotation;

        if (rotation.x < this.xRotationRange.x) {
            rotation.x = this.xRotationRange.x
        }
        else if (rotation.x > this.xRotationRange.y) {
            rotation.x = this.xRotationRange.y
        }

        rotation.z = 0;
    }

    private _originalRadius: number = 5;

    /**
     * 平移前推视角，以躲开遮挡物
     */
    moveView() {

        if (!this.target || this.pause) return;

        const outRay = new geometry.Ray();

        geometry.Ray.fromPoints(outRay, this.target.worldPosition, this.node.worldPosition);        //从角色头部到相机构建一条射线

        if (PhysicsSystem.instance.raycastClosest(outRay)) {

            const rayResult = PhysicsSystem.instance.raycastClosestResult;

            //console.log(rayResult.collider.name);

            //碰撞到墙壁，镜头往前推
            if (rayResult.collider.name.indexOf("WallCollider") > -1) {

                let insDistance = Vec3.distance(this.target.worldPosition, this.node.worldPosition);

                //如果此时的射线打到的墙壁大于镜头与角色的距离，则不操作
                if (rayResult.distance < insDistance) {

                    this.radius = this.minRadius;       //镜头前移

                    //如果墙体的距离大于之前默认的距离，则恢复视角
                } else if (rayResult.distance > this._originalRadius) {

                    this.radius = this._originalRadius;
                }

            } else {

                this.radius = this._originalRadius;
            }

        } else {

            //没有碰到任何东西，角色相机归位
            this.radius = this._originalRadius;
        }
    }

    update(dt: number) {

        this.moveView();

        let targetRotation = this._targetRotation;

        if (this.autoRotate && !this._touched) {
            targetRotation.y += this.autoRotateSpeed * dt;
        }

        if (this.target) {
            this._targetCenter.set(this.target.worldPosition);

            if (this.followTargetRotationY) {
                targetRotation = tempVec3_2.set(targetRotation);
                Quat.toEuler(tempVec3, this.target.worldRotation);
                targetRotation.y += tempVec3.y;
            }
        }

        Quat.fromEuler(tempQuat, targetRotation.x, targetRotation.y, targetRotation.z);

        Quat.slerp(this._rotation, this._rotation, tempQuat, dt * 7 * this.rotateSpeed);
        Vec3.lerp(this._center, this._center, this._targetCenter, dt * 5 * this.followSpeed);

        this._radius = lerp(this._radius, this._targetRadius, dt * 5);

        Vec3.transformQuat(tempVec3, Vec3.FORWARD, this._rotation);
        Vec3.multiplyScalar(tempVec3, tempVec3, this._radius)
        tempVec3.add(this._center)

        this.node.position = tempVec3;
        this.node.lookAt(this._center);
    }

    changePosY(pos: Vec3): Vec3 {

        let newPos = new Vec3();
        newPos.x = pos.x;
        newPos.y = pos.y + 1;
        newPos.z = pos.z;
        return newPos;
    }
}

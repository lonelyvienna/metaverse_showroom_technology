import { _decorator, Component, Node, Camera, RenderTexture, view, UITransform, log, game, screen, NodeEventType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CaptureImage')
export class CaptureImage extends Component {
    @property(Camera)
    copyCamera: Camera = null!;

    @property(Node)
    targetNode: Node = null!;

    @property(Node)
    captureBtn: Node = null!;

    @property(Node)
    closeBtn: Node = null!;

    rt: RenderTexture

    private _image: HTMLImageElement
    _canvas: HTMLCanvasElement = null!;
    _buffer: ArrayBufferView = null!;

    start() {
        this.rt = new RenderTexture();
        this.rt.reset({
            width: view.getVisibleSize().width,
            height: view.getVisibleSize().height,
        })
        this.copyCamera.targetTexture = this.rt;
        // this.captureBtn.active = true;
        // this.closeBtn.active = false;
        this.captureBtn.on(NodeEventType.TOUCH_END, this.copyRenderTex, this)
        this.closeBtn.on(NodeEventType.TOUCH_END, this.clearCapture, this)
    }

    private copyRenderTex() {
        const width = this.targetNode.getComponent(UITransform).width;
        const height = this.targetNode.getComponent(UITransform).height;
        const anchorPoint = this.targetNode.getComponent(UITransform).anchorPoint;
        const worldPos = this.targetNode.getWorldPosition();
        this._buffer = this.rt.readPixels(Math.round(worldPos.x - width * anchorPoint.x), Math.round(worldPos.y - height * anchorPoint.y), width, height);

        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            this._canvas.width = width;
            this._canvas.height = height;
        } else {
            let ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        let ctx = this._canvas.getContext('2d')!;
        let rowBytes = width * 4;
        for (let row = 0; row < height; row++) {
            let sRow = height - 1 - row;
            let imageData = ctx.createImageData(width, 1);
            let start = sRow * width * 4;
            for (let i = 0; i < rowBytes; i++) {
                imageData.data[i] = this._buffer[start + i];
            }
            ctx.putImageData(imageData, 0, row);
        }

        const scale = (view.getVisibleSizeInPixel().height / screen.devicePixelRatio) / view.getDesignResolutionSize().height
        const imageWidth = width * scale
        const imageHeight = height * scale
        let img = new Image(imageWidth, imageHeight);
        img.style.position = "absolute"
        img.style.marginTop = -imageHeight / 2 + "px"
        img.style.marginLeft = -imageWidth / 2 + "px"
        img.style.top = "50%"
        img.style.left = "50%"
        img.src = this._canvas.toDataURL();
        game.container!.appendChild(img);
        if (this._image) {
            game.container!.removeChild(this._image)
        }
        this._image = img;

        // this.captureBtn.active = false;
        // this.closeBtn.active = true;
        this.closeBtn.parent.active = true;
    }

    private clearCapture() {
        if (this._image) {
            game.container!.removeChild(this._image)
        }
        this._image = null;
        // this.captureBtn.active = true;
        // this.closeBtn.active = false;
        this.closeBtn.parent.active = false;
    }
}
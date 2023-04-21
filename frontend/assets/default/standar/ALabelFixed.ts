import { Enum, Label, UITransform, _decorator } from "cc";

const { ccclass, property } = _decorator;

/**固定类型 */
enum LabelFixedType {
    NONE,       //默认值 不作处理
    WIDTH,      //固定宽度
    BYTE,       //固定字节长度  英文1个字节,中文（标点符号）2个字节
}
/**扩展 cc.Label 新增固定宽度属性 */
@ccclass
export default class ALabelFixed extends Label {
    @property({ type: Enum(LabelFixedType), serializable: true, displayName: "文本固定类型", tooltip: "WIDTH固定宽度\nBYTE固定字节长度  英文1个字节,中文（标点符号）2个字节  " })
    fixedType: LabelFixedType = LabelFixedType.NONE;        //固定类型
    @property({ serializable: true, displayName: "文本固定值" })
    fixedValue: number = 10;                                //固定值 width宽度   byte字节数
    @property({ serializable: true, displayName: "文本超出替换值 ...", tooltip: "超出长度的替换值 123456   123..." })
    fixedString: string = "...";                            //超出长度的替换值 123456   123...

    private aLabel: string = "";
    public oldLabel: string = "";
    private isRefresh: boolean;

    private set string(label: string) {
        this.aLabel = label;
        this.refreshView();
    }
    get string(): string {
        return this.aLabel
    }

    private refreshView(): void {
        if (this.isRefresh || !this.node) {
            return;
        }
        this.isRefresh = true;
        let str = this.oldLabel = this.aLabel;
        let len;
        switch (this.fixedType) {
            case LabelFixedType.WIDTH:
                if (this.fixedValue < this.fontSize) {      //最小值
                    this.fixedValue = this.fontSize;
                }
                this['_forceUpdateRenderData']();
                len = this.node.getComponent(UITransform).width;
                len > this.fixedValue && this.labelWidth(str);
                break;
            case LabelFixedType.BYTE:
                if (this.fixedValue < 2) {                  //最小值
                    this.fixedValue = 2;
                }
                len = this.getLabelByteLength(str);
                len > this.fixedValue && this.labelByte(str);
                break;
        }
        this.isRefresh = false;
    }

    /**文本宽度计算 */
    private labelWidth(label: string): void {
        let len = label.length - 1;
        let str: string;
        for (var i = len; i > 0; i--) {
            str = label.substr(0, i);
            this.string = str;
            this['_forceUpdateRenderData']();
            if (this.node.getComponent(UITransform).width < this.fixedValue) {
                this.string = str + this.fixedString;
                return;
            }
        }
    }


    /**文本字节计算 */
    private labelByte(label: string): void {
        let len = label.length - 1;
        let str: string;
        for (var i = len; i > 0; i--) {
            str = label.substr(0, i);
            if (this.getLabelByteLength(str) <= this.fixedValue) {
                this.string = str + this.fixedString;
                return;
            }
        }
    }

    /**获取字符串 字节长度 */
    private getLabelByteLength(label: string, replaceStr: string = "**"): number {
        return label.replace(/[^\x00-\xff]/g, replaceStr).length;
    }
}
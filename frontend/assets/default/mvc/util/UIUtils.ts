/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-16 00:57:45
 * @LastEditors: guofuyan
 * @Description:
 */
import { Node,Component, _decorator, __private } from "cc";

export default class UIUtils {

    /***
     * 生成子节点的唯一标识快捷访问
     * @param node
     * @param map
     */
    public static createSubNodeMap(node: Node, map: Map<string, Node>) {

        let children = node.children;

        if (!children) {

            return;
        }
        for (let t = 0, len = children.length; t < len; ++t) {
            let subChild = children[t];
            map.set(subChild.name, subChild);
            UIUtils.createSubNodeMap(subChild, map);
        }
    }

    /***
     * 返回当前节点所有节点,一唯一标识存在
     * @param node 父节点
     * @return {Object} 所有子节点的映射map
     */
    public static seekAllSubView(node: Node): UIContainer {
        let map = new Map<string, Node>();
        UIUtils.createSubNodeMap(node, map);
        return new UIContainer(map);
    }
}

export class UIContainer {
    /** 所有节点集合 */
    private _uiNodesMap: Map<string, Node>;

    public constructor(nodesMap: Map<string, Node>) {
        this._uiNodesMap = nodesMap;
    }

    /**
     * 根据节点名字获取节点
     * @param {string}name 节点名字
     * @return {cc.Node}
     */
    public getNode(name: string): Node {
        return this._uiNodesMap.get(name);
    }

    /**
     * 根据节点名字和组件类型获取组件对象
     * @param {string}name 节点名字
     * @param {{prototype: cc.Component}}com 组建类型
     * @return {cc.Component}
     */
    public getComponent<T extends Component>(name: string, com: __private._types_globals__Constructor<T>): T {

        let node = this._uiNodesMap.get(name);

        if (node) {

            return node.getComponent(com);
        }
        return null;
    }
}

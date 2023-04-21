/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-15 23:01:33
 * @LastEditors: guofuyan
 * @Description:
 */
import { size, Size } from "cc";

/**
 * 框架配置，通过init接口初始化这些配置。
 */
export default class FrameworkCfg {
    /** 是否是测试环境 */
    public static DEBUG = false;
    /** 默认的设计分辨率 */
    public static DESIGN_RESOLUTION: Size = size(640, 960);
    /** 是否高适配 */
    public static FIT_HEIGHT: boolean = true;
    /** 是否宽适配 */
    public static FIT_WIDTH: boolean = false;
}
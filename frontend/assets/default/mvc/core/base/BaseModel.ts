import NotificationManager from "../manager/NotificationManager";

/**
 * 数据模型基类
 * init和clear接口需要子类重写
 */
export default abstract class BaseModel {

   /**
    * 数据对象初始化接口，创建时会调用。
    */
   public abstract init(): void;

   /**
    * 发送消息接口
    * @param {string} noti 消息名称
    * @param {Object} data 消息数据
    */
   public sendNoti(noti: string, data?: any): void {
      NotificationManager.getInstance().__sendNotification__(noti, data);
   }

   /**
    * 清理接口，子类可以实现清理逻辑。
    */
   public abstract clear(): void;
}

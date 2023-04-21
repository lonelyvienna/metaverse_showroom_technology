
import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;


@ccclass('Main')
export class Main extends Component {

    loadScene(event: Event, customEventData: string): void {
        switch (customEventData) {
            case "0":
                director.loadScene("akplayer");
                break;
        }

    }


}


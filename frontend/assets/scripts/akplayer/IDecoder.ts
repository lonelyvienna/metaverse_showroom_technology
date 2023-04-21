export interface IDecoder {
    init();
    onRecv: ((success: boolean, data: any) => void) | undefined;
    terminate();
    postMessage (value: any): void;
    
}
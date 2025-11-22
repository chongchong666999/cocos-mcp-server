/**
 * Slider UI 模板
 */

export interface SliderOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
}

export class SliderTemplate {
    static async create(options: SliderOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 300,
            height = 20
        } = options;

        return new Promise((resolve) => {
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createSliderWithTemplate',
                name,
                parentUuid,
                width,
                height,
                (err: any, result: any) => {
                    if (err) {
                        resolve({ success: false, error: err.message || err });
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }
}

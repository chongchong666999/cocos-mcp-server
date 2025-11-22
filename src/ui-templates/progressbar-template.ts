/**
 * ProgressBar UI 模板
 */

export interface ProgressBarOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
}

export class ProgressBarTemplate {
    static async create(options: ProgressBarOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 300,
            height = 15
        } = options;

        return new Promise((resolve) => {
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createProgressBarWithTemplate',
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

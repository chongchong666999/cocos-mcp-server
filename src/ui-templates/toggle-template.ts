/**
 * Toggle UI 模板
 */

export interface ToggleOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
}

export class ToggleTemplate {
    static async create(options: ToggleOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 28,
            height = 28
        } = options;

        return new Promise((resolve) => {
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createToggleWithTemplate',
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

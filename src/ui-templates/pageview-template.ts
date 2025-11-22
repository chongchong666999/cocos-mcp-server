/**
 * PageView UI 模板
 */

export interface PageViewOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
}

export class PageViewTemplate {
    static async create(options: PageViewOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 400,
            height = 350
        } = options;

        return new Promise((resolve) => {
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createPageViewWithTemplate',
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

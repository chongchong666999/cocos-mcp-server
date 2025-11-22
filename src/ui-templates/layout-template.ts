/**
 * Layout UI 模板
 * 完整的 Layout 创建逻辑
 */

export interface LayoutOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
    spriteFrameUuid?: string;
}

// 默认的 Layout 背景 Sprite Frame UUID（从 helloworld.fire 中提取）
const DEFAULT_SPRITE_FRAME = '9bbda31e-ad49-43c9-aaf2-f7d9896bac69';

export class LayoutTemplate {
    /**
     * 创建完整的 Layout 组件
     */
    static async create(options: LayoutOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 200,
            height = 150,
            spriteFrameUuid = DEFAULT_SPRITE_FRAME
        } = options;

        return new Promise((resolve) => {
            // 调用场景脚本创建 Layout
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createLayoutWithTemplate',
                name,
                parentUuid,
                width,
                height,
                spriteFrameUuid,
                (err: any, result: any) => {
                    if (err) {
                        resolve({
                            success: false,
                            error: err.message || err
                        });
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    }
}

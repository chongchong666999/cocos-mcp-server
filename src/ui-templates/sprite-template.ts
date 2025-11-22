/**
 * Sprite UI 模板
 * 完整的 Sprite 创建逻辑
 */

export interface SpriteOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
    spriteFrameUuid?: string;
}

// 默认的 Sprite Frame UUID（从 helloworld.fire 中提取）
const DEFAULT_SPRITE_FRAME = '8cdb44ac-a3f6-449f-b354-7cd48cf84061';

export class SpriteTemplate {
    /**
     * 创建完整的 Sprite 组件
     */
    static async create(options: SpriteOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 40,
            height = 36,
            spriteFrameUuid = DEFAULT_SPRITE_FRAME
        } = options;

        return new Promise((resolve) => {
            // 调用场景脚本创建 Sprite
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createSpriteWithTemplate',
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

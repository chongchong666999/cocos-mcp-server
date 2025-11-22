/**
 * ScrollView UI 模板
 */

export interface ScrollViewOptions {
    name: string;
    parentUuid?: string | null;
    width?: number;
    height?: number;
    spriteFrameUuid?: string;
}

// 默认的背景 Sprite Frame UUID
const DEFAULT_SPRITE_FRAME = '9bbda31e-ad49-43c9-aaf2-f7d9896bac69';

export class ScrollViewTemplate {
    /**
     * 创建完整的 ScrollView 组件
     */
    static async create(options: ScrollViewOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            width = 240,
            height = 250,
            spriteFrameUuid = DEFAULT_SPRITE_FRAME
        } = options;

        return new Promise((resolve) => {
            // 调用场景脚本创建 ScrollView
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createScrollViewWithTemplate',
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

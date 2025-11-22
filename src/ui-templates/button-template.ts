/**
 * Button UI 模板
 * 完整的 Button 创建逻辑，包括所有 4 个状态的图集配置
 */

export interface ButtonOptions {
    name: string;
    parentUuid?: string | null;
    text?: string;
    width?: number;
    height?: number;
}

// 默认的 Button 图集 UUID（从 helloworld.fire 中提取）
const BUTTON_SPRITES = {
    normal: 'f0048c10-f03e-4c97-b9d3-3506e1d58952',
    pressed: 'e9ec654c-97a2-4787-9325-e6a10375219a',
    hover: 'f0048c10-f03e-4c97-b9d3-3506e1d58952',
    disabled: '29158224-f8dd-4661-a796-1ffab537140e'
};

export class ButtonTemplate {
    /**
     * 创建完整的 Button UI 组件
     * 所有逻辑都在这里完成，scene.ts 只提供基础方法
     */
    static async create(options: ButtonOptions): Promise<any> {
        const {
            name,
            parentUuid = null,
            text = 'button',
            width = 100,
            height = 40
        } = options;

        return new Promise((resolve) => {
            // 调用场景脚本创建完整的 Button
            (Editor as any).Scene.callSceneScript(
                'cocos-mcp-server',
                'createButtonWithTemplate',
                name,
                parentUuid,
                text,
                width,
                height,
                BUTTON_SPRITES,  // 传递所有图集 UUID
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

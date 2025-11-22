/**
 * Layout UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

/**
 * 创建 Layout 组件
 * @param name Layout 节点名称
 * @param parentUuid 父节点 UUID
 * @param width Layout 宽度
 * @param height Layout 高度
 * @param spriteFrameUuid 背景 Sprite Frame UUID
 * @param getCC 获取 Cocos 引擎实例的函数
 * @param markSceneDirty 标记场景为脏的函数
 */
export function createLayoutWithTemplate(
    name: string,
    parentUuid: string | null,
    width: number,
    height: number,
    spriteFrameUuid: string,
    getCC: () => any,
    markSceneDirty: () => void
) {
    try {
        const { director, Node } = getCC();
        const scene = director.getScene();
        if (!scene) {
            return { success: false, error: 'No active scene' };
        }

        // 1. 创建主节点
        const layoutNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        if (parent) {
            parent.addChild(layoutNode);
        } else {
            scene.addChild(layoutNode);
        }

        // 设置主节点大小和锚点
        layoutNode.setContentSize(width, height);
        layoutNode.setAnchorPoint(0.5, 0.5);

        // 2. 添加 Sprite 组件 (背景)
        const spriteComp = layoutNode.addComponent(cc.Sprite);
        spriteComp.type = cc.Sprite.Type.SLICED; // 1 - SLICED 模式
        spriteComp.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 0 - CUSTOM 模式
        
        // 设置 SpriteFrame 的 UUID
        const spriteFrame = new cc.SpriteFrame();
        (spriteFrame as any)._uuid = spriteFrameUuid;
        spriteComp.spriteFrame = spriteFrame;

        // 3. 添加 Layout 组件
        const layoutComp = layoutNode.addComponent(cc.Layout);
        // 默认 Layout 配置 (Type: NONE, ResizeMode: NONE)
        // 如果需要特定配置，可以在这里添加

        // 标记场景为已修改并保存
        markSceneDirty();
        
        // 通知编辑器刷新场景视图
        try {
            if (typeof Editor !== 'undefined' && Editor.Ipc && Editor.Ipc.sendToPanel) {
                Editor.Ipc.sendToPanel('scene', 'scene:soft-reload');
            }
        } catch (error) {
            console.warn('[scene-script] Failed to refresh scene view:', error);
        }

        return {
            success: true,
            message: `Layout '${name}' created successfully`,
            data: {
                uuid: layoutNode.uuid || layoutNode._id,
                name: layoutNode.name || layoutNode._name,
                width: width,
                height: height
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || error
        };
    }
}

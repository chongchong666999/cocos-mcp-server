/**
 * Sprite UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

/**
 * 创建 Sprite 组件
 * @param name Sprite 节点名称
 * @param parentUuid 父节点 UUID
 * @param width Sprite 宽度
 * @param height Sprite 高度
 * @param spriteFrameUuid Sprite Frame UUID
 * @param getCC 获取 Cocos 引擎实例的函数
 * @param markSceneDirty 标记场景为脏的函数
 */
export function createSpriteWithTemplate(
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
        const spriteNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        if (parent) {
            parent.addChild(spriteNode);
        } else {
            scene.addChild(spriteNode);
        }

        // 设置主节点大小和锚点
        spriteNode.setContentSize(width, height);
        spriteNode.setAnchorPoint(0.5, 0.5);

        // 2. 添加 Sprite 组件
        const spriteComp = spriteNode.addComponent(cc.Sprite);
        spriteComp.type = cc.Sprite.Type.SIMPLE; // 0 - SIMPLE 模式
        spriteComp.sizeMode = cc.Sprite.SizeMode.TRIMMED; // 1 - TRIMMED 模式
        
        // 设置 SpriteFrame 的 UUID
        const spriteFrame = new cc.SpriteFrame();
        (spriteFrame as any)._uuid = spriteFrameUuid;
        spriteComp.spriteFrame = spriteFrame;

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
            message: `Sprite '${name}' created successfully`,
            data: {
                uuid: spriteNode.uuid || spriteNode._id,
                name: spriteNode.name || spriteNode._name,
                width: width,
                height: height,
                spriteFrame: spriteFrameUuid
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || error
        };
    }
}

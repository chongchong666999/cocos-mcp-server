/**
 * Toggle UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

export function createToggleWithTemplate(
    name: string,
    parentUuid: string | null,
    width: number,
    height: number,
    getCC: () => any,
    markSceneDirty: () => void
) {
    try {
        const { director, Node, color } = getCC();
        const scene = director.getScene();
        if (!scene) {
            return { success: false, error: 'No active scene' };
        }

        const BG_SPRITE = '6827ca32-0107-4552-bab2-dfb31799bb44';
        const CHECKMARK_SPRITE = '90004ad6-2f6d-40e1-93ef-b714375c6f06';

        // 1. 主节点
        const toggleNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        (parent || scene).addChild(toggleNode);
        toggleNode.setContentSize(width, height);
        toggleNode.setAnchorPoint(0.5, 0.5);

        // 2. 背景
        const bgNode = new Node('Background');
        toggleNode.addChild(bgNode);
        bgNode.setContentSize(width, height);
        bgNode.setAnchorPoint(0.5, 0.5);

        const bgSprite = bgNode.addComponent(cc.Sprite);
        bgSprite.type = cc.Sprite.Type.SIMPLE;
        bgSprite.sizeMode = cc.Sprite.SizeMode.TRIMMED;
        const bgFrame = new cc.SpriteFrame();
        (bgFrame as any)._uuid = BG_SPRITE;
        bgSprite.spriteFrame = bgFrame;

        // 3. 勾选图
        const checkNode = new Node('checkmark');
        toggleNode.addChild(checkNode);
        checkNode.setContentSize(width, height);
        checkNode.setAnchorPoint(0.5, 0.5);

        const checkSprite = checkNode.addComponent(cc.Sprite);
        checkSprite.type = cc.Sprite.Type.SIMPLE;
        checkSprite.sizeMode = cc.Sprite.SizeMode.RAW;
        const checkFrame = new cc.SpriteFrame();
        (checkFrame as any)._uuid = CHECKMARK_SPRITE;
        checkSprite.spriteFrame = checkFrame;

        // 4. Toggle 组件
        const toggleComp = toggleNode.addComponent(cc.Toggle);
        toggleComp.transition = cc.Button.Transition.SPRITE;
        toggleComp.enableAutoGrayEffect = false;
        toggleComp.normalColor = color(214, 214, 214, 255);
        toggleComp.pressedColor = color(211, 211, 211, 255);
        toggleComp.hoverColor = color(255, 255, 255, 255);
        toggleComp.disabledColor = color(124, 124, 124, 255);
        toggleComp.target = bgNode;
        toggleComp.isChecked = true;
        toggleComp.checkMark = checkSprite;

        markSceneDirty();
        try {
            if (typeof Editor !== 'undefined' && Editor.Ipc?.sendToPanel) {
                Editor.Ipc.sendToPanel('scene', 'scene:soft-reload');
            }
        } catch (error) {
            console.warn('[scene-script] Failed to refresh scene view:', error);
        }

        return {
            success: true,
            message: `Toggle '${name}' created successfully`,
            data: {
                uuid: toggleNode.uuid || toggleNode._id,
                name: toggleNode.name || toggleNode._name,
                width,
                height
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || error };
    }
}

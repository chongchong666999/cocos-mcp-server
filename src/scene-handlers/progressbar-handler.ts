/**
 * ProgressBar UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

export function createProgressBarWithTemplate(
    name: string,
    parentUuid: string | null,
    width: number,
    height: number,
    getCC: () => any,
    markSceneDirty: () => void
) {
    try {
        const { director, Node } = getCC();
        const scene = director.getScene();
        if (!scene) {
            return { success: false, error: 'No active scene' };
        }

        const BG_SPRITE = '88e79fd5-96b4-4a77-a1f4-312467171014';
        const BAR_SPRITE = '67e68bc9-dad5-4ad9-a2d8-7e03d458e32f';

        // 1. 主节点
        const progressNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        (parent || scene).addChild(progressNode);
        progressNode.setContentSize(width, height);
        progressNode.setAnchorPoint(0.5, 0.5);

        // 背景
        const bgSprite = progressNode.addComponent(cc.Sprite);
        bgSprite.type = cc.Sprite.Type.SLICED;
        bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const bgFrame = new cc.SpriteFrame();
        (bgFrame as any)._uuid = BG_SPRITE;
        bgSprite.spriteFrame = bgFrame;

        // 2. bar
        const barNode = new Node('bar');
        progressNode.addChild(barNode);
        barNode.setContentSize(width / 2, height);
        barNode.setAnchorPoint(0, 0.5);
        barNode.setPosition(-width / 2, 0);

        const barSprite = barNode.addComponent(cc.Sprite);
        barSprite.type = cc.Sprite.Type.SLICED;
        barSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const barFrame = new cc.SpriteFrame();
        (barFrame as any)._uuid = BAR_SPRITE;
        barSprite.spriteFrame = barFrame;

        // 3. ProgressBar 组件
        const progressComp = progressNode.addComponent(cc.ProgressBar);
        progressComp.barSprite = barSprite;
        progressComp.totalLength = width;
        progressComp.mode = cc.ProgressBar.Mode.HORIZONTAL;
        progressComp.progress = 0.5;
        progressComp.reverse = false;

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
            message: `ProgressBar '${name}' created successfully`,
            data: {
                uuid: progressNode.uuid || progressNode._id,
                name: progressNode.name || progressNode._name,
                width,
                height
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || error };
    }
}

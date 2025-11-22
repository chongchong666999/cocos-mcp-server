/**
 * Slider UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

export function createSliderWithTemplate(
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

        // 资源 UUID（来自 helloworld）
        const BACKGROUND_SPRITE = '31d8962d-babb-4ec7-be19-8e9f54a4ea99';
        const HANDLE_SPRITE = 'e7aba14b-f956-4480-b254-8d57832e273f';
        const DISABLED_SPRITE = '29158224-f8dd-4661-a796-1ffab537140e';

        // 1. 主节点
        const sliderNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        (parent || scene).addChild(sliderNode);
        sliderNode.setContentSize(width, height);
        sliderNode.setAnchorPoint(0.5, 0.5);

        // 2. 背景
        const bgNode = new Node('Background');
        sliderNode.addChild(bgNode);
        bgNode.setContentSize(width, height);
        bgNode.setAnchorPoint(0.5, 0.5);

        const bgSprite = bgNode.addComponent(cc.Sprite);
        bgSprite.type = cc.Sprite.Type.SLICED;
        bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const bgFrame = new cc.SpriteFrame();
        (bgFrame as any)._uuid = BACKGROUND_SPRITE;
        bgSprite.spriteFrame = bgFrame;

        // 3. 拖拽手柄
        const handleNode = new Node('Handle');
        sliderNode.addChild(handleNode);
        handleNode.setContentSize(32, 32);
        handleNode.setAnchorPoint(0.5, 0.5);

        const handleSprite = handleNode.addComponent(cc.Sprite);
        handleSprite.type = cc.Sprite.Type.SLICED;
        handleSprite.sizeMode = cc.Sprite.SizeMode.RAW;
        const handleFrame = new cc.SpriteFrame();
        (handleFrame as any)._uuid = HANDLE_SPRITE;
        handleSprite.spriteFrame = handleFrame;

        const handleButton = handleNode.addComponent(cc.Button);
        handleButton.transition = cc.Button.Transition.SPRITE;
        handleButton.enableAutoGrayEffect = true;
        handleButton.normalSprite = handleFrame;
        handleButton.pressedSprite = handleFrame;
        handleButton.hoverSprite = handleFrame;
        const disabledFrame = new cc.SpriteFrame();
        (disabledFrame as any)._uuid = DISABLED_SPRITE;
        handleButton.disabledSprite = disabledFrame;
        handleButton.target = handleNode;

        // 4. Slider 组件
        const sliderComp = sliderNode.addComponent(cc.Slider);
        sliderComp.handle = handleButton;
        sliderComp.progress = 0.5;
        sliderComp.direction = cc.Slider.Direction.Horizontal;

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
            message: `Slider '${name}' created successfully`,
            data: {
                uuid: sliderNode.uuid || sliderNode._id,
                name: sliderNode.name || sliderNode._name,
                width,
                height
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || error };
    }
}

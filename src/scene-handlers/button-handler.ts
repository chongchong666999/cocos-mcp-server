/**
 * Button UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

/**
 * 创建完整的 Button UI 组件
 * 包括 Background 子节点（Sprite + Widget）和 Label 子节点
 * @param name Button 节点名称
 * @param parentUuid 父节点 UUID
 * @param text Label 文本
 * @param width Button 宽度
 * @param height Button 高度
 * @param sprites 包含 4 个状态的图集 UUID: {normal, pressed, hover, disabled}
 * @param getCC 获取 Cocos 引擎实例的函数
 * @param markSceneDirty 标记场景为脏的函数
 */
export function createButtonWithTemplate(
    name: string,
    parentUuid: string | null,
    text: string,
    width: number,
    height: number,
    sprites: { normal: string; pressed: string; hover: string; disabled: string },
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
        const buttonNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        if (parent) {
            parent.addChild(buttonNode);
        } else {
            scene.addChild(buttonNode);
        }

        // 设置主节点大小和锚点
        buttonNode.setContentSize(width, height);
        buttonNode.setAnchorPoint(0.5, 0.5);

        // 2. 添加 Button 组件
        const buttonComp = buttonNode.addComponent(cc.Button);

        // 3. 创建 Background 子节点
        const bgNode = new Node('Background');
        buttonNode.addChild(bgNode);
        bgNode.setContentSize(width, height);
        bgNode.setAnchorPoint(0.5, 0.5);

        // 4. 添加 Sprite 组件到 Background
        const spriteComp = bgNode.addComponent(cc.Sprite);
        spriteComp.type = cc.Sprite.Type.SLICED; // 九宫格模式
        spriteComp.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 0 - CUSTOM 模式
        
        // 直接设置 SpriteFrame 的 UUID（更可靠的方法）
        const normalSpriteFrame = new cc.SpriteFrame();
        (normalSpriteFrame as any)._uuid = sprites.normal;
        spriteComp.spriteFrame = normalSpriteFrame;

        // 5. 添加 Widget 组件到 Background（完全对齐）
        const widgetComp = bgNode.addComponent(cc.Widget);
        // 重要：先设置对齐值，再启用对齐标志
        widgetComp.top = 0;
        widgetComp.bottom = 0;
        widgetComp.left = 0;
        widgetComp.right = 0;
        // 然后启用对齐
        widgetComp.isAlignTop = true;
        widgetComp.isAlignBottom = true;
        widgetComp.isAlignLeft = true;
        widgetComp.isAlignRight = true;
        // 最后调用 updateAlignment 使设置生效
        widgetComp.updateAlignment();

        // 6. 创建 Label 子节点
        const labelNode = new Node('Label');
        bgNode.addChild(labelNode);
        labelNode.setContentSize(width, height);
        labelNode.setAnchorPoint(0.5, 0.5);
        labelNode.color = cc.color(0, 0, 0, 255); // 黑色

        // 7. 添加 Label 组件
        const labelComp = labelNode.addComponent(cc.Label);
        labelComp.string = text;
        labelComp.fontSize = 20;
        labelComp.lineHeight = 40;
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        labelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;

        // 8. 设置 Button 组件属性
        buttonComp.target = bgNode;
        buttonComp.transition = cc.Button.Transition.SPRITE;
        
        // 直接设置所有 4 个状态的 SpriteFrame UUID
        const normalSprite = new cc.SpriteFrame();
        (normalSprite as any)._uuid = sprites.normal;
        buttonComp.normalSprite = normalSprite;
        
        const pressedSprite = new cc.SpriteFrame();
        (pressedSprite as any)._uuid = sprites.pressed;
        buttonComp.pressedSprite = pressedSprite;
        
        const hoverSprite = new cc.SpriteFrame();
        (hoverSprite as any)._uuid = sprites.hover;
        buttonComp.hoverSprite = hoverSprite;
        
        const disabledSprite = new cc.SpriteFrame();
        (disabledSprite as any)._uuid = sprites.disabled;
        buttonComp.disabledSprite = disabledSprite;

        // 标记场景为已修改并保存
        markSceneDirty();
        
        // 通知编辑器刷新场景视图（让图片立即显示）
        try {
            if (typeof Editor !== 'undefined' && Editor.Ipc && Editor.Ipc.sendToPanel) {
                // 刷新场景视图
                Editor.Ipc.sendToPanel('scene', 'scene:soft-reload');
            }
        } catch (error) {
            console.warn('[scene-script] Failed to refresh scene view:', error);
        }

        return {
            success: true,
            message: `Button '${name}' created successfully with complete structure`,
            data: {
                uuid: buttonNode.uuid || buttonNode._id,
                name: buttonNode.name || buttonNode._name,
                width: width,
                height: height,
                sprites: {
                    normal: sprites.normal,
                    pressed: sprites.pressed,
                    hover: sprites.hover,
                    disabled: sprites.disabled
                },
                children: [
                    {
                        name: 'Background',
                        uuid: bgNode.uuid || bgNode._id,
                        components: ['cc.Sprite', 'cc.Widget']
                    },
                    {
                        name: 'Label',
                        uuid: labelNode.uuid || labelNode._id,
                        text: text,
                        components: ['cc.Label']
                    }
                ]
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || error
        };
    }
}

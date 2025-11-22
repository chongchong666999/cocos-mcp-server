/**
 * ScrollView UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

/**
 * 创建 ScrollView 组件
 * 结构:
 * - ScrollView (Sprite, ScrollView)
 *   - scrollBar (Sprite, Scrollbar, Widget)
 *     - bar (Sprite)
 *   - view (Mask)
 *     - content
 *       - item (Label)
 * 
 * @param name ScrollView 节点名称
 * @param parentUuid 父节点 UUID
 * @param width 宽度
 * @param height 高度
 * @param spriteFrameUuid 背景 Sprite Frame UUID
 * @param getCC 获取 Cocos 引擎实例的函数
 * @param markSceneDirty 标记场景为脏的函数
 */
export function createScrollViewWithTemplate(
    name: string,
    parentUuid: string | null,
    width: number,
    height: number,
    spriteFrameUuid: string,
    getCC: () => any,
    markSceneDirty: () => void
) {
    try {
        const {
            director,
            Node,
            color
        } = getCC();
        const scene = director.getScene();
        if (!scene) {
            return { success: false, error: 'No active scene' };
        }

        const BACKGROUND_SPRITE = spriteFrameUuid || '9bbda31e-ad49-43c9-aaf2-f7d9896bac69';
        const SCROLLBAR_SPRITE = '5fe5dcaa-b513-4dc5-a166-573627b3a159';
        const SCROLLBAR_HANDLE_SPRITE = '5c3bb932-6c3c-468f-88a9-c8c61d458641';
        const ITEM_TEXT = 'ScrollView content\n\n';
        const SCROLLBAR_WIDTH = 12;
        const HANDLE_SIZE = { width: 10, height: 30 };
        const CONTENT_PADDING = 10;
        const CONTENT_EXTRA_HEIGHT = 150; // 250(view height) -> 400(content height) in helloworld

        // 1. 创建主节点 (ScrollView)
        const scrollViewNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        if (parent) {
            parent.addChild(scrollViewNode);
        } else {
            scene.addChild(scrollViewNode);
        }

        scrollViewNode.setContentSize(width, height);
        scrollViewNode.setAnchorPoint(0.5, 0.5);
        scrollViewNode.active = true;

        // 添加背景 Sprite
        const spriteComp = scrollViewNode.addComponent(cc.Sprite);
        spriteComp.type = cc.Sprite.Type.SLICED;
        spriteComp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const spriteFrame = new cc.SpriteFrame();
        (spriteFrame as any)._uuid = BACKGROUND_SPRITE;
        spriteComp.spriteFrame = spriteFrame;

        // 2. 创建 ScrollView 组件
        const scrollViewComp = scrollViewNode.addComponent(cc.ScrollView);
        scrollViewComp.horizontal = false;
        scrollViewComp.vertical = true;
        scrollViewComp.inertia = true;
        scrollViewComp.brake = 0.75;
        scrollViewComp.elastic = true;
        scrollViewComp.bounceDuration = 0.23;
        scrollViewComp.cancelInnerEvents = true;

        // 3. 创建 view 节点 (Mask)
        const viewNode = new Node('view');
        scrollViewNode.addChild(viewNode);
        viewNode.setContentSize(width, height);
        viewNode.setAnchorPoint(0.5, 0.5);
        viewNode.setPosition(0, 0);

        // 添加 Mask 组件
        const maskComp = viewNode.addComponent(cc.Mask);
        maskComp.type = cc.Mask.Type.RECT;

        // 4. 创建 content 节点
        const contentNode = new Node('content');
        viewNode.addChild(contentNode);
        const contentWidth = Math.max(width - CONTENT_PADDING * 2, 0);
        const contentHeight = Math.max(height + CONTENT_EXTRA_HEIGHT, height);
        contentNode.setContentSize(contentWidth, contentHeight);
        contentNode.setAnchorPoint(0.5, 1);
        contentNode.setPosition(0, height / 2 - CONTENT_PADDING);

        // 5. 创建 item 节点 + Label
        const itemNode = new Node('item');
        contentNode.addChild(itemNode);
        itemNode.setAnchorPoint(0, 1);
        itemNode.setPosition(-contentWidth / 2 + CONTENT_PADDING - 2, -CONTENT_PADDING);
        itemNode.color = color(0, 0, 0, 255);

        const labelComp = itemNode.addComponent(cc.Label);
        labelComp.string = ITEM_TEXT;
        labelComp.fontSize = 16;
        labelComp.lineHeight = 20;
        labelComp.enableWrapText = true;
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        labelComp.verticalAlign = cc.Label.VerticalAlign.TOP;

        // 让节点尺寸跟随文本内容，和 helloworld 场景一致
        if (typeof (labelComp as any)._forceUpdateRenderData === 'function') {
            (labelComp as any)._forceUpdateRenderData(true);
        } else if (typeof (labelComp as any)._updateRenderData === 'function') {
            (labelComp as any)._updateRenderData(true);
        }
        const measuredSize = itemNode.getContentSize();
        if (measuredSize && measuredSize.width > 0 && measuredSize.height > 0) {
            itemNode.setContentSize(measuredSize.width, measuredSize.height);
        } else {
            itemNode.setContentSize(contentWidth * 0.6, labelComp.lineHeight * 3 + CONTENT_PADDING);
        }

        // 6. 创建 ScrollBar 及滑块
        const scrollBarNode = new Node('scrollBar');
        scrollViewNode.addChild(scrollBarNode);
        scrollBarNode.setContentSize(SCROLLBAR_WIDTH, height);
        scrollBarNode.setAnchorPoint(1, 0.5);
        scrollBarNode.setPosition(width / 2, 0);

        // ScrollBar 背景
        const scrollBarSprite = scrollBarNode.addComponent(cc.Sprite);
        scrollBarSprite.type = cc.Sprite.Type.SLICED;
        scrollBarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const scrollBarFrame = new cc.SpriteFrame();
        (scrollBarFrame as any)._uuid = SCROLLBAR_SPRITE;
        scrollBarSprite.spriteFrame = scrollBarFrame;

        // ScrollBar 对齐
        const scrollBarWidget = scrollBarNode.addComponent(cc.Widget);
        scrollBarWidget.isAlignRight = true;
        scrollBarWidget.isAlignTop = true;
        scrollBarWidget.isAlignBottom = true;
        scrollBarWidget.right = 0;
        scrollBarWidget.top = 0;
        scrollBarWidget.bottom = 0;
        scrollBarWidget.updateAlignment();
        scrollBarNode.setSiblingIndex(0); // 与 helloworld 场景的子节点顺序保持一致

        // 滑块
        const barNode = new Node('bar');
        scrollBarNode.addChild(barNode);
        barNode.setContentSize(HANDLE_SIZE.width, HANDLE_SIZE.height);
        barNode.setAnchorPoint(1, 0);
        barNode.setPosition(-1, 0);

        const barSprite = barNode.addComponent(cc.Sprite);
        barSprite.type = cc.Sprite.Type.SLICED;
        barSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const barSpriteFrame = new cc.SpriteFrame();
        (barSpriteFrame as any)._uuid = SCROLLBAR_HANDLE_SPRITE;
        barSprite.spriteFrame = barSpriteFrame;

        // ScrollBar 组件
        const scrollBarComp = scrollBarNode.addComponent(cc.Scrollbar);
        scrollBarComp.handle = barSprite;
        scrollBarComp.direction = cc.Scrollbar.Direction.VERTICAL;
        scrollBarComp.enableAutoHide = true;
        scrollBarComp.autoHideTime = 1;
        scrollBarComp.scrollView = scrollViewComp;

        // 7. 关联 ScrollView 内容与滚动条
        scrollViewComp.content = contentNode;
        scrollViewComp.verticalScrollBar = scrollBarComp;

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
            message: `ScrollView '${name}' created successfully`,
            data: {
                uuid: scrollViewNode.uuid || scrollViewNode._id,
                name: scrollViewNode.name || scrollViewNode._name,
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

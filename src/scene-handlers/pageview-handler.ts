/**
 * PageView UI 创建处理器
 * 在场景脚本上下文中执行，可以直接访问 cc 对象
 */

export function createPageViewWithTemplate(
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

        const BG_SPRITE = '9bbda31e-ad49-43c9-aaf2-f7d9896bac69';
        const INDICATOR_SPRITE = 'c9fa51ff-3f01-4601-8f80-325d1b11dab7';

        // 1. 主节点
        const pageViewNode = new Node(name);
        const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
        (parent || scene).addChild(pageViewNode);
        pageViewNode.setContentSize(width, height);
        pageViewNode.setAnchorPoint(0.5, 0.5);

        // 2. 背景
        const bgNode = new Node('background');
        pageViewNode.addChild(bgNode);
        bgNode.setContentSize(width, height);
        bgNode.setAnchorPoint(0.5, 0.5);
        const bgSprite = bgNode.addComponent(cc.Sprite);
        bgSprite.type = cc.Sprite.Type.SLICED;
        bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const bgFrame = new cc.SpriteFrame();
        (bgFrame as any)._uuid = BG_SPRITE;
        bgSprite.spriteFrame = bgFrame;

        // 3. view + mask
        const viewNode = new Node('view');
        pageViewNode.addChild(viewNode);
        viewNode.setContentSize(width, height);
        viewNode.setAnchorPoint(0.5, 0.5);
        const mask = viewNode.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;

        // 4. content + pages
        const contentNode = new Node('content');
        viewNode.addChild(contentNode);
        contentNode.setContentSize(width * 3, height);
        contentNode.setAnchorPoint(0, 0.5);
        contentNode.setPosition(-width / 2, 0);

        const layout = contentNode.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.HORIZONTAL;
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.spacingY = 15; // 与 helloworld 数据一致

        const PAGE_SIZE = { width, height: height - 60 };
        const pageColors = [
            color(255, 200, 200, 255),
            color(200, 255, 200, 255),
            color(200, 200, 255, 255)
        ];

        const pagePositions = [width / 2, width * 1.5, width * 2.5];
        for (let i = 0; i < 3; i++) {
            const pageNode = new Node(`page_${i + 1}`);
            contentNode.addChild(pageNode);
            pageNode.setContentSize(PAGE_SIZE.width, PAGE_SIZE.height);
            pageNode.setAnchorPoint(0.5, 0.5);
            pageNode.setPosition(pagePositions[i], 0);
            pageNode.color = pageColors[i];

            const pageSprite = pageNode.addComponent(cc.Sprite);
            pageSprite.type = cc.Sprite.Type.SLICED;
            pageSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            const frame = new cc.SpriteFrame();
            (frame as any)._uuid = BG_SPRITE;
            pageSprite.spriteFrame = frame;
        }

        // 5. indicator
        const indicatorNode = new Node('indicator');
        pageViewNode.addChild(indicatorNode);
        indicatorNode.setContentSize(100, 27);
        indicatorNode.setAnchorPoint(0.5, 0.5);
        indicatorNode.setPosition(0, -160);

        const indicatorComp = indicatorNode.addComponent(cc.PageViewIndicator);
        indicatorComp.direction = cc.PageViewIndicator.Direction.HORIZONTAL;
        indicatorComp.spacing = 10;
        indicatorComp.cellSize = { width: 10, height: 10 } as any;
        const indicatorFrame = new cc.SpriteFrame();
        (indicatorFrame as any)._uuid = INDICATOR_SPRITE;
        indicatorComp.spriteFrame = indicatorFrame;

        // 6. PageView 组件
        const pageViewComp = pageViewNode.addComponent(cc.PageView);
        pageViewComp.content = contentNode;
        pageViewComp.sizeMode = cc.PageView.SizeMode.Unified;
        pageViewComp.direction = cc.PageView.Direction.Horizontal;
        pageViewComp.indicator = indicatorComp;
        pageViewComp.horizontal = true;
        pageViewComp.vertical = true;
        pageViewComp.inertia = true;
        pageViewComp.brake = 0.5;
        pageViewComp.elastic = true;
        pageViewComp.bounceDuration = 0.5;
        pageViewComp.cancelInnerEvents = true;
        pageViewComp.scrollThreshold = 0.5;
        pageViewComp.autoPageTurningThreshold = 100;
        pageViewComp.pageTurningEventTiming = 0.1;
        pageViewComp.pageTurningSpeed = 0.3;

        // 建立 indicator 与 pageView 关联
        indicatorComp.setPageView(pageViewComp);

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
            message: `PageView '${name}' created successfully`,
            data: {
                uuid: pageViewNode.uuid || pageViewNode._id,
                name: pageViewNode.name || pageViewNode._name,
                width,
                height
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message || error };
    }
}

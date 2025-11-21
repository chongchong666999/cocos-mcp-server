// ========================================
// 快速测试：验证节点创建和操作
// 在 Cocos Creator 控制台运行
// ========================================

console.log('🚀 开始快速测试...\n');

// 使用你的 Canvas UUID（从之前的测试中获取）
const CANVAS_UUID = 'a286bbGknJLZpRpxROV6M94';

// 测试 1: 创建节点
console.log('1️⃣ 创建节点...');
Editor.Scene.callSceneScript('cocos-mcp-server', 'createNode', 'QuickTestNode', CANVAS_UUID, (err, result) => {
    if (err) {
        console.error('❌ 创建失败:', err);
        return;
    }

    console.log('✅ 创建成功!');
    console.log('   UUID:', result.data.uuid);
    console.log('   名称:', result.data.name);

    const nodeUuid = result.data.uuid;

    // 测试 2: 获取节点信息
    setTimeout(() => {
        console.log('\n2️⃣ 获取节点信息...');
        Editor.Scene.callSceneScript('cocos-mcp-server', 'getNodeInfo', nodeUuid, (err2, result2) => {
            if (err2) {
                console.error('❌ 获取失败:', err2);
                return;
            }

            console.log('✅ 获取成功!');
            console.log('   完整数据:', result2);

            // 测试 3: 修改位置
            setTimeout(() => {
                console.log('\n3️⃣ 修改节点位置...');
                Editor.Scene.callSceneScript('cocos-mcp-server', 'setNodeProperty', nodeUuid, 'position', { x: 150, y: 150, z: 0 }, (err3, result3) => {
                    if (err3) {
                        console.error('❌ 修改失败:', err3);
                        return;
                    }

                    console.log('✅ 修改成功!');
                    console.log('   👀 请在场景视图中查看节点移动到 (150, 150)');

                    // 保存 UUID
                    window.QUICK_TEST_NODE_UUID = nodeUuid;
                    console.log('\n✨ 测试完成!');
                    console.log('💡 节点 UUID 已保存到: window.QUICK_TEST_NODE_UUID');
                    console.log('💡 你现在可以在网页测试中使用这个 UUID');
                });
            }, 500);
        });
    }, 500);
});

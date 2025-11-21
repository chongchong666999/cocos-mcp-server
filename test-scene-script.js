// 测试场景脚本是否正常工作
// 在 Cocos Creator 2.4.13 控制台运行此代码

console.log('=== 测试场景脚本 ===');

// 测试 1: 调用 getSceneTreeData
Editor.Scene.callSceneScript('cocos-mcp-server', 'getSceneTreeData', (err, result) => {
    if (err) {
        console.error('❌ getSceneTreeData 失败:', err);
    } else {
        console.log('✅ getSceneTreeData 成功:');
        console.log('场景树数据:', JSON.stringify(result, null, 2));

        if (result && result.children) {
            console.log(`📊 场景根节点: ${result.name}`);
            console.log(`📊 子节点数量: ${result.children.length}`);

            // 遍历所有节点
            let totalNodes = 0;
            const countNodes = (node) => {
                totalNodes++;
                if (node.children && node.children.length > 0) {
                    node.children.forEach(countNodes);
                }
            };
            countNodes(result);
            console.log(`📊 总节点数: ${totalNodes}`);
        }
    }
});

// 测试 2: 对比 scene:query-hierarchy
console.log('\n=== 对比 scene:query-hierarchy ===');
Editor.Ipc.sendToPanel('scene', 'scene:query-hierarchy', (err, result) => {
    if (err) {
        console.error('❌ scene:query-hierarchy 失败:', err);
    } else {
        console.log('✅ scene:query-hierarchy 结果:');
        console.log('类型:', typeof result);
        console.log('值:', result);
        console.log('是否是 UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result));
    }
});

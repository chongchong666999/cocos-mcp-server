// ========================================
// Cocos Creator 2.4.13 控制台测试脚本
// 直接在控制台粘贴运行
// ========================================

console.log('=== 开始测试节点操作 ===\n');

// 测试 1: 获取场景树数据
console.log('📋 测试 1: 获取场景树数据');
Editor.Scene.callSceneScript('cocos-mcp-server', 'getSceneTreeData', (err, result) => {
    if (err) {
        console.error('❌ 失败:', err);
    } else {
        console.log('✅ 成功! 场景根节点:', result.name);
        console.log('   子节点数:', result.children ? result.children.length : 0);

        // 保存 Canvas UUID 供后续使用
        if (result.children) {
            const canvas = result.children.find(n => n.name === 'Canvas');
            if (canvas) {
                window.TEST_CANVAS_UUID = canvas.uuid;
                console.log('   Canvas UUID:', canvas.uuid);
            }
        }
    }
});

// 测试 2: 创建节点（等待 1 秒后执行）
setTimeout(() => {
    console.log('\n📋 测试 2: 创建节点');

    const testNodeName = 'TestNode_game';
    const parentUuid = window.TEST_CANVAS_UUID || 'a286bbGknJLZpRpxROV6M94'; // 使用你的 Canvas UUID

    // 正确的调用方式：展开参数，而不是传递数组
    Editor.Scene.callSceneScript('cocos-mcp-server', 'createNode', testNodeName, parentUuid, (err, result) => {
        if (err) {
            console.error('❌ 创建失败:', err);
        } else {
            console.log('✅ 创建成功!');
            console.log('   节点名称:', result.data.name);
            console.log('   节点 UUID:', result.data.uuid);

            // 保存 UUID 供后续测试使用
            window.TEST_NODE_UUID = result.data.uuid;

            // 在 Cocos Creator 层级管理器中应该能看到新节点！
            console.log('   👀 请在 Cocos Creator 层级管理器中查看新节点');
        }
    });
}, 1000);

// 测试 3: 获取节点信息（等待 2 秒后执行）
setTimeout(() => {
    if (!window.TEST_NODE_UUID) {
        console.log('\n⚠️  跳过测试 3: 没有可用的测试节点 UUID');
        return;
    }

    console.log('\n📋 测试 3: 获取节点信息');
    Editor.Scene.callSceneScript('cocos-mcp-server', 'getNodeInfo', window.TEST_NODE_UUID, (err, result) => {
        if (err) {
            console.error('❌ 失败:', err);
        } else {
            console.log('✅ 成功!');
            console.log('   节点名称:', result.data.name);
            console.log('   位置:', result.data.position);
            console.log('   组件数:', result.data.components.length);
        }
    });
}, 2000);

// 测试 4: 修改节点属性（等待 3 秒后执行）
setTimeout(() => {
    if (!window.TEST_NODE_UUID) {
        console.log('\n⚠️  跳过测试 4: 没有可用的测试节点 UUID');
        return;
    }

    console.log('\n📋 测试 4: 修改节点属性');
    const newName = 'RenamedNode_' + Date.now();

    Editor.Scene.callSceneScript('cocos-mcp-server', 'setNodeProperty', window.TEST_NODE_UUID, 'name', newName, (err, result) => {
        if (err) {
            console.error('❌ 失败:', err);
        } else {
            console.log('✅ 成功! 节点已重命名为:', newName);
            console.log('   👀 请在 Cocos Creator 层级管理器中查看节点名称变化');
        }
    });
}, 3000);

// 测试 5: 修改节点位置（等待 4 秒后执行）
setTimeout(() => {
    if (!window.TEST_NODE_UUID) {
        console.log('\n⚠️  跳过测试 5: 没有可用的测试节点 UUID');
        return;
    }

    console.log('\n📋 测试 5: 修改节点位置');
    const newPosition = { x: 100, y: 100, z: 0 };

    Editor.Scene.callSceneScript('cocos-mcp-server', 'setNodeProperty', window.TEST_NODE_UUID, 'position', newPosition, (err, result) => {
        if (err) {
            console.error('❌ 失败:', err);
        } else {
            console.log('✅ 成功! 节点已移动到:', newPosition);
            console.log('   👀 请在 Cocos Creator 场景视图中查看节点位置变化');
        }
    });
}, 4000);

// 测试 6: 获取所有节点（等待 5 秒后执行）
setTimeout(() => {
    console.log('\n📋 测试 6: 获取所有节点');

    Editor.Scene.callSceneScript('cocos-mcp-server', 'getAllNodes', (err, result) => {
        if (err) {
            console.error('❌ 失败:', err);
        } else {
            console.log('✅ 成功!');
            console.log('   总节点数:', result.data.length);
            console.log('   节点列表:', result.data.map(n => n.name).join(', '));
        }
    });
}, 5000);

// 完成提示
setTimeout(() => {
    console.log('\n=== 测试完成 ===');
    console.log('💡 提示:');
    console.log('   - 测试节点 UUID 已保存到: window.TEST_NODE_UUID');
    console.log('   - Canvas UUID 已保存到: window.TEST_CANVAS_UUID');
    console.log('   - 你可以使用这些 UUID 进行更多测试');
    console.log('\n📝 手动测试示例:');
    console.log('   Editor.Scene.callSceneScript("cocos-mcp-server", "getNodeInfo", [window.TEST_NODE_UUID], console.log);');
}, 6000);

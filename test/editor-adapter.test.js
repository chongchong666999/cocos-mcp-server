const assert = require('assert');
const { ensureEditorAdapters } = require('../dist/utils/editor-adapter');

let lastMessageSent = null;

global.Editor = {
    Message: {},
    Ipc: {
        sendToMain(message, ...args) {
            lastMessageSent = { message, args };
            const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
            if (callback) {
                callback(null, { ok: true });
            }
        },
    },
    Scene: {
        callSceneScript(packageName, methodName, ...args) {
            const callback = args.pop();
            callback(null, { packageName, methodName, args });
        },
    },
};

ensureEditorAdapters();

async function testRequestForwarding() {
    const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status', { foo: 'bar' });
    assert.deepStrictEqual(result, { ok: true }, 'Message.request should resolve with data from sendToMain callback');
    assert.strictEqual(lastMessageSent.message, 'cocos-mcp-server:get-server-status');
}

async function testSceneScriptBridge() {
    const result = await Editor.Message.request('scene', 'execute-scene-script', {
        name: 'test-package',
        method: 'doThing',
        args: [1, 2, 3],
    });
    assert.strictEqual(result.packageName, 'test-package');
    assert.strictEqual(result.methodName, 'doThing');
    assert.deepStrictEqual(result.args, [1, 2, 3]);
}

(async function run() {
    await testRequestForwarding();
    await testSceneScriptBridge();
    console.log('editor-adapter tests passed');
})();

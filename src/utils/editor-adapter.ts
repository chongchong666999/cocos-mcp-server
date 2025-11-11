/// <reference path="../../@types/editor.d.ts" />

export function ensureEditorAdapters() {
    const editor: any = Editor;

    if (!editor.Message) {
        editor.Message = {};
    }

    const callSceneScript = (packageName: string, methodName: string, methodArgs: any[] = []): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!editor.Scene || !editor.Scene.callSceneScript) {
                reject(new Error('Editor.Scene.callSceneScript 不可用'));
                return;
            }

            const callback = (err: Error | null, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            };

            try {
                editor.Scene.callSceneScript(packageName, methodName, ...methodArgs, callback);
            } catch (error) {
                reject(error);
            }
        });
    };

    if (!editor.Ipc) {
        console.warn('[MCP插件] Editor.Ipc 不存在，部分功能可能无法工作');
        return;
    }

    if (!editor.Message.request) {
        editor.Message.request = function (channel: string, message: string, ...args: any[]): Promise<any> {
            if (channel === 'scene' && message === 'execute-scene-script') {
                const options = args[0] || {};
                const packageName = options.name || options.package;
                const methodName = options.method;
                const methodArgs: any[] = options.args || [];
                return callSceneScript(packageName, methodName, methodArgs);
            }

            if (channel === 'scene' && message === 'query-node-tree') {
                // Cocos Creator 2.4.x 没有提供 scene:query-node-tree 消息，使用场景脚本兼容
                return callSceneScript('cocos-mcp-server', 'getSceneTreeData');
            }

            return new Promise((resolve, reject) => {
                const callback = (err: Error | null, result: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };

                try {
                    editor.Ipc.sendToMain(`${channel}:${message}`, ...args, callback);
                } catch (error) {
                    reject(error);
                }
            });
        };
    }

    if (!editor.Message.send) {
        editor.Message.send = function (channel: string, message: string, ...args: any[]) {
            try {
                editor.Ipc.sendToMain(`${channel}:${message}`, ...args);
            } catch (error) {
                console.error('[MCP插件] Message.send 调用失败:', error);
            }
        };
    }
}

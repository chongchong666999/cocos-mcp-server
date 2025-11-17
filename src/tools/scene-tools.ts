import { ToolDefinition, ToolResponse, ToolExecutor, SceneInfo } from '../types';
import logger from '../utils/logger';

export class SceneTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'get_current_scene',
                description: 'Get current scene information',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_scene_list',
                description: 'Get all scenes in the project',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'open_scene',
                description: 'Open a scene by path',
                inputSchema: {
                    type: 'object',
                    properties: {
                        scenePath: {
                            type: 'string',
                            description: 'The scene file path'
                        }
                    },
                    required: ['scenePath']
                }
            },
            {
                name: 'save_scene',
                description: 'Save current scene',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'create_scene',
                description: 'Create a new scene asset',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sceneName: {
                            type: 'string',
                            description: 'Name of the new scene'
                        },
                        savePath: {
                            type: 'string',
                            description: 'Path to save the scene (e.g., db://assets/Scene/NewScene.fire or db://assets/Scene)'
                        }
                    },
                    required: ['sceneName', 'savePath']
                }
            },
            {
                name: 'save_scene_as',
                description: 'Save scene as new file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Path to save the scene'
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'close_scene',
                description: 'Close current scene',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_scene_hierarchy',
                description: 'Get the complete hierarchy of current scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeComponents: {
                            type: 'boolean',
                            description: 'Include component information',
                            default: false
                        }
                    }
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_current_scene':
                return await this.getCurrentScene();
            case 'get_scene_list':
                return await this.getSceneList();
            case 'open_scene':
                return await this.openScene(args.scenePath);
            case 'save_scene':
                return await this.saveScene(args.scenePath);
            case 'create_scene':
                return await this.createScene(args.sceneName, args.savePath);
            case 'save_scene_as':
                return await this.saveSceneAs(args.path);
            case 'close_scene':
                return await this.closeScene();
            case 'get_scene_hierarchy':
                return await this.getSceneHierarchy(args.includeComponents);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getCurrentScene(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 直接使用 query-node-tree 来获取场景信息（这个方法已经验证可用）
            Editor.Message.request('scene', 'query-node-tree').then((tree: any) => {
                if (tree && tree.uuid) {
                    resolve({
                        success: true,
                        data: {
                            name: tree.name || 'Current Scene',
                            uuid: tree.uuid,
                            type: tree.type || 'cc.Scene',
                            active: tree.active !== undefined ? tree.active : true,
                            nodeCount: tree.children ? tree.children.length : 0
                        }
                    });
                } else {
                    resolve({ success: false, error: 'No scene data available' });
                }
            }).catch((err: Error) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getCurrentSceneInfo',
                    args: []
                };
                
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    resolve(result);
                }).catch((err2: Error) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }

    private async getSceneList(): Promise<ToolResponse> {
        const patterns = ['db://assets/**/*.scene', 'db://assets/**/*.fire'];
        const errors: string[] = [];

        for (const pattern of patterns) {
            try {
                const results = await this.queryScenesViaMessage(pattern);
                if (results) {
                    const scenes = this.normalizeSceneResults(results);
                    if (scenes.length > 0) {
                        return { success: true, data: scenes };
                    }
                    continue;
                }
            } catch (err: any) {
                errors.push(`[Message:${pattern}] ${err?.message || err}`);
            }

            try {
                const fallbackResults = await this.queryScenesViaAssetDB(pattern);
                if (fallbackResults) {
                    const scenes = this.normalizeSceneResults(fallbackResults);
                    if (scenes.length > 0) {
                        return { success: true, data: scenes };
                    }
                    continue;
                }
            } catch (err: any) {
                errors.push(`[AssetDB:${pattern}] ${err?.message || err}`);
            }
        }

        if (errors.length > 0) {
            return {
                success: false,
                error: errors.join(' | ')
            };
        }

        return {
            success: true,
            data: [],
            warning: '未在 assets 目录中找到 .scene 或 .fire 场景文件'
        };
    }

    private async queryScenesViaMessage(pattern: string): Promise<any[] | null> {
        if (!Editor.Message || !Editor.Message.request) {
            return null;
        }

        const results = await Editor.Message.request('asset-db', 'query-assets', { pattern });
        return Array.isArray(results) ? results : [];
    }

    private async queryScenesViaAssetDB(pattern: string): Promise<any[] | null> {
        const assetdb = (Editor as any)?.assetdb;
        if (!assetdb || typeof assetdb.queryAssets !== 'function') {
            return null;
        }

        return new Promise((resolve, reject) => {
            assetdb.queryAssets(pattern, 'scene', (err: Error, results: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(Array.isArray(results) ? results : []);
            });
        });
    }

    private normalizeSceneResults(results: any[]): SceneInfo[] {
        if (!Array.isArray(results)) {
            return [];
        }

        return results.map((asset: any) => {
            const url = asset.url || asset.path || '';
            const nameFromUrl = url.split('/').pop() || '';
            const cleanName = (asset.name || nameFromUrl).replace(/\.(scene|fire)$/i, '');

            return {
                name: cleanName || asset.name || 'Unnamed Scene',
                path: url,
                uuid: asset.uuid || asset.fileId || asset.fileid || ''
            } as SceneInfo;
        });
    }

    private async openScene(scenePath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            logger.info('[scene-tools] Opening scene:', scenePath);

            // Cocos Creator 2.4.x: Use Editor.assetdb to query UUID
            const editor: any = Editor;
            const assetdb = editor.assetdb || editor.remote?.assetdb;

            if (!assetdb) {
                logger.error('[scene-tools] Editor.assetdb not available');
                resolve({ success: false, error: 'Asset database not available' });
                return;
            }

            logger.info('[scene-tools] Querying UUID for scene:', scenePath);

            // Method 1: Try urlToUuid (synchronous method in main process)
            try {
                const uuid = assetdb.urlToUuid(scenePath);
                logger.info('[scene-tools] Got UUID via urlToUuid:', uuid);

                if (uuid) {
                    // In 2.4.x, open scene by sending 'scene:open-by-uuid' message to main process
                    logger.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', uuid);

                    // Wait a bit for the scene to open
                    setTimeout(() => {
                        logger.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                    return;
                }
            } catch (e) {
                logger.warn('[scene-tools] urlToUuid failed:', e);
            }

            // Method 2: Try queryUuidByUrl (callback-based method)
            if (typeof assetdb.queryUuidByUrl === 'function') {
                logger.info('[scene-tools] Trying queryUuidByUrl...');
                assetdb.queryUuidByUrl(scenePath, (err: Error | null, uuid: string) => {
                    if (err || !uuid) {
                        logger.error('[scene-tools] queryUuidByUrl failed:', err);
                        resolve({ success: false, error: 'Scene not found' });
                        return;
                    }

                    logger.info('[scene-tools] Got UUID via queryUuidByUrl:', uuid);
                    logger.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', uuid);

                    setTimeout(() => {
                        logger.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                });
                return;
            }

            // Method 3: Fallback - try to find scene using queryAssets
            logger.info('[scene-tools] Trying queryAssets as fallback...');
            if (typeof assetdb.queryAssets === 'function') {
                assetdb.queryAssets('db://assets/**/*.fire', ['scene'], (err: Error | null, results: any[]) => {
                    if (err) {
                        logger.error('[scene-tools] queryAssets failed:', err);
                        resolve({ success: false, error: err.message });
                        return;
                    }

                    logger.info('[scene-tools] queryAssets results:', results);

                    // Find matching scene
                    const scene = results.find((s: any) =>
                        s.url === scenePath ||
                        s.path === scenePath ||
                        s.path?.endsWith(scenePath.replace('db://assets/', ''))
                    );

                    if (!scene) {
                        logger.error('[scene-tools] Scene not found in queryAssets results');
                        resolve({ success: false, error: 'Scene not found' });
                        return;
                    }

                    logger.info('[scene-tools] Found scene:', scene);
                    logger.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', scene.uuid);

                    setTimeout(() => {
                        logger.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                });
                return;
            }

            logger.error('[scene-tools] No available method to query scene UUID');
            resolve({ success: false, error: 'No available method to query scene UUID' });
        });
    }

    private async saveScene(scenePath?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            logger.info('[scene-tools] Saving scene:', scenePath || 'current scene');

            // In 2.4.x, use scene panel's save-scene message
            const editor: any = Editor;

            // Try to send save-scene message to scene panel
            editor.Ipc.sendToPanel('scene', 'scene:save-scene', (err: Error | null) => {
                if (err) {
                    logger.error('[scene-tools] Failed to save scene via panel:', err);
                    resolve({ success: false, error: err.message });
                } else {
                    logger.info('[scene-tools] Scene saved successfully');
                    resolve({ success: true, message: 'Scene saved successfully' });
                }
            });
        });
    }

    private async createScene(sceneName: string, savePath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                const targetPath = this.normalizeSceneSavePath(sceneName, savePath);
                const sceneContent = this.buildCreator24SceneContent(sceneName);

                this.sendSceneDataToAssetDB(targetPath, sceneContent).then((result: any) => {
                    this.getSceneList().then((sceneList) => {
                        const createdScene = sceneList.data?.find((scene: any) => {
                            if (result?.uuid && scene.uuid) {
                                return scene.uuid === result.uuid;
                            }
                            return scene.path === targetPath;
                        });

                        resolve({
                            success: true,
                            data: {
                                uuid: result?.uuid,
                                url: result?.url || targetPath,
                                name: sceneName,
                                message: `Scene '${sceneName}' created successfully`,
                                sceneVerified: !!createdScene
                            },
                            verificationData: createdScene
                        });
                    }).catch(() => {
                        resolve({
                            success: true,
                            data: {
                                uuid: result?.uuid,
                                url: result?.url || targetPath,
                                name: sceneName,
                                message: `Scene '${sceneName}' created successfully (verification failed)`
                            }
                        });
                    });
                }).catch((err: Error) => {
                    resolve({ success: false, error: err.message });
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message || String(err) });
            }
        });
    }

    private sanitizeSceneName(name: string): string {
        const trimmed = (name || 'New Scene').trim();
        const cleaned = trimmed.replace(/\.(fire|scene)$/i, '');
        return cleaned || 'New Scene';
    }

    private normalizeSceneSavePath(sceneName: string, rawSavePath: string): string {
        const sanitizedName = this.sanitizeSceneName(sceneName);
        let normalized = (rawSavePath || '').trim();

        if (!normalized) {
            throw new Error('savePath is required to create a scene');
        }

        normalized = normalized.replace(/\\/g, '/');
        const lower = normalized.toLowerCase();

        if (lower.endsWith('.scene')) {
            normalized = normalized.slice(0, -6) + '.fire';
        } else if (!lower.endsWith('.fire')) {
            const suffix = normalized.endsWith('/') ? '' : '/';
            normalized = `${normalized}${suffix}${sanitizedName}.fire`;
        }

        return normalized;
    }

    private buildCreator24SceneContent(sceneName: string): string {
        const sanitizedName = this.sanitizeSceneName(sceneName);
        const sceneTemplate: any[] = [
            {
                __type__: 'cc.SceneAsset',
                _name: sanitizedName,
                _objFlags: 0,
                _native: '',
                scene: {
                    __id__: 1
                }
            },
            {
                __type__: 'cc.Scene',
                _objFlags: 0,
                _parent: null,
                _children: [
                    {
                        __id__: 2
                    }
                ],
                _active: true,
                _components: [],
                _prefab: null,
                _opacity: 255,
                _color: {
                    __type__: 'cc.Color',
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                },
                _contentSize: {
                    __type__: 'cc.Size',
                    width: 0,
                    height: 0
                },
                _anchorPoint: {
                    __type__: 'cc.Vec2',
                    x: 0,
                    y: 0
                },
                _trs: {
                    __type__: 'TypedArray',
                    ctor: 'Float64Array',
                    array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
                },
                _is3DNode: true,
                _groupIndex: 0,
                groupIndex: 0,
                autoReleaseAssets: false,
                _id: '324247e8-c584-495d-87b3-015a69fee444'
            },
            {
                __type__: 'cc.Node',
                _name: 'Canvas',
                _objFlags: 0,
                _parent: {
                    __id__: 1
                },
                _children: [
                    {
                        __id__: 3
                    }
                ],
                _active: true,
                _components: [
                    {
                        __id__: 5
                    },
                    {
                        __id__: 6
                    }
                ],
                _prefab: null,
                _opacity: 255,
                _color: {
                    __type__: 'cc.Color',
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                },
                _contentSize: {
                    __type__: 'cc.Size',
                    width: 960,
                    height: 640
                },
                _anchorPoint: {
                    __type__: 'cc.Vec2',
                    x: 0.5,
                    y: 0.5
                },
                _trs: {
                    __type__: 'TypedArray',
                    ctor: 'Float64Array',
                    array: [480, 320, 0, 0, 0, 0, 1, 1, 1, 1]
                },
                _eulerAngles: {
                    __type__: 'cc.Vec3',
                    x: 0,
                    y: 0,
                    z: 0
                },
                _skewX: 0,
                _skewY: 0,
                _is3DNode: false,
                _groupIndex: 0,
                groupIndex: 0,
                _id: 'a5esZu+45LA5mBpvttspPD'
            },
            {
                __type__: 'cc.Node',
                _name: 'Main Camera',
                _objFlags: 0,
                _parent: {
                    __id__: 2
                },
                _children: [],
                _active: true,
                _components: [
                    {
                        __id__: 4
                    }
                ],
                _prefab: null,
                _opacity: 255,
                _color: {
                    __type__: 'cc.Color',
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                },
                _contentSize: {
                    __type__: 'cc.Size',
                    width: 960,
                    height: 640
                },
                _anchorPoint: {
                    __type__: 'cc.Vec2',
                    x: 0.5,
                    y: 0.5
                },
                _trs: {
                    __type__: 'TypedArray',
                    ctor: 'Float64Array',
                    array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
                },
                _eulerAngles: {
                    __type__: 'cc.Vec3',
                    x: 0,
                    y: 0,
                    z: 0
                },
                _skewX: 0,
                _skewY: 0,
                _is3DNode: false,
                _groupIndex: 0,
                groupIndex: 0,
                _id: 'e1WoFrQ79G7r4ZuQE3HlNb'
            },
            {
                __type__: 'cc.Camera',
                _name: '',
                _objFlags: 0,
                node: {
                    __id__: 3
                },
                _enabled: true,
                _cullingMask: 4294967295,
                _clearFlags: 7,
                _backgroundColor: {
                    __type__: 'cc.Color',
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 255
                },
                _depth: -1,
                _zoomRatio: 1,
                _targetTexture: null,
                _fov: 60,
                _orthoSize: 10,
                _nearClip: 1,
                _farClip: 4096,
                _ortho: true,
                _rect: {
                    __type__: 'cc.Rect',
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1
                },
                _renderStages: 1,
                _alignWithScreen: true,
                _id: '81GN3uXINKVLeW4+iKSlim'
            },
            {
                __type__: 'cc.Canvas',
                _name: '',
                _objFlags: 0,
                node: {
                    __id__: 2
                },
                _enabled: true,
                _designResolution: {
                    __type__: 'cc.Size',
                    width: 960,
                    height: 640
                },
                _fitWidth: false,
                _fitHeight: true,
                _id: '59Cd0ovbdF4byw5sbjJDx7'
            },
            {
                __type__: 'cc.Widget',
                _name: '',
                _objFlags: 0,
                node: {
                    __id__: 2
                },
                _enabled: true,
                alignMode: 1,
                _target: null,
                _alignFlags: 45,
                _left: 0,
                _right: 0,
                _top: 0,
                _bottom: 0,
                _verticalCenter: 0,
                _horizontalCenter: 0,
                _isAbsLeft: true,
                _isAbsRight: true,
                _isAbsTop: true,
                _isAbsBottom: true,
                _isAbsHorizontalCenter: true,
                _isAbsVerticalCenter: true,
                _originalWidth: 0,
                _originalHeight: 0,
                _id: '29zXboiXFBKoIV4PQ2liTe'
            }
        ];

        return JSON.stringify(sceneTemplate);
    }

    private sendSceneDataToAssetDB(targetPath: string, sceneContent: string): Promise<any> {
        const editor: any = Editor;

        if (editor?.Ipc?.sendToMain) {
            return new Promise((resolve, reject) => {
                try {
                    editor.Ipc.sendToMain('asset-db:create-asset', targetPath, sceneContent, (err: Error | null, result: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }

        if (editor?.Message?.request) {
            return Editor.Message.request('asset-db', 'create-asset', targetPath, sceneContent);
        }

        return Promise.reject(new Error('Asset database interface is not available'));
    }

    private async getSceneHierarchy(includeComponents: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // 优先尝试使用 Editor API 查询场景节点树
            Editor.Message.request('scene', 'query-node-tree').then((tree: any) => {
                if (tree) {
                    const hierarchy = this.buildHierarchy(tree, includeComponents);
                    resolve({
                        success: true,
                        data: hierarchy
                    });
                } else {
                    resolve({ success: false, error: 'No scene hierarchy available' });
                }
            }).catch((err: Error) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getSceneHierarchy',
                    args: [includeComponents]
                };
                
                Editor.Message.request('scene', 'execute-scene-script', options).then((result: any) => {
                    resolve(result);
                }).catch((err2: Error) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }

    private buildHierarchy(node: any, includeComponents: boolean): any {
        const nodeInfo: any = {
            uuid: node.uuid,
            name: node.name,
            type: node.type,
            active: node.active,
            children: []
        };

        if (includeComponents && node.__comps__) {
            nodeInfo.components = node.__comps__.map((comp: any) => ({
                type: comp.__type__ || 'Unknown',
                enabled: comp.enabled !== undefined ? comp.enabled : true
            }));
        }

        if (node.children) {
            nodeInfo.children = node.children.map((child: any) => 
                this.buildHierarchy(child, includeComponents)
            );
        }

        return nodeInfo;
    }

    private async saveSceneAs(path: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // save-as-scene API 不接受路径参数，会弹出对话框让用户选择
            (Editor.Message.request as any)('scene', 'save-as-scene').then(() => {
                resolve({
                    success: true,
                    data: {
                        path: path,
                        message: `Scene save-as dialog opened`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async closeScene(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'close-scene').then(() => {
                resolve({
                    success: true,
                    message: 'Scene closed successfully'
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}

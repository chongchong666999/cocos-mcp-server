"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneTools = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class SceneTools {
    getTools() {
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
    async execute(toolName, args) {
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
    async getCurrentScene() {
        return new Promise((resolve) => {
            // 直接使用 query-node-tree 来获取场景信息（这个方法已经验证可用）
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
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
                }
                else {
                    resolve({ success: false, error: 'No scene data available' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getCurrentSceneInfo',
                    args: []
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async getSceneList() {
        const patterns = ['db://assets/**/*.scene', 'db://assets/**/*.fire'];
        const errors = [];
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
            }
            catch (err) {
                errors.push(`[Message:${pattern}] ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
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
            }
            catch (err) {
                errors.push(`[AssetDB:${pattern}] ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
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
    async queryScenesViaMessage(pattern) {
        if (!Editor.Message || !Editor.Message.request) {
            return null;
        }
        const results = await Editor.Message.request('asset-db', 'query-assets', { pattern });
        return Array.isArray(results) ? results : [];
    }
    async queryScenesViaAssetDB(pattern) {
        const assetdb = Editor === null || Editor === void 0 ? void 0 : Editor.assetdb;
        if (!assetdb || typeof assetdb.queryAssets !== 'function') {
            return null;
        }
        return new Promise((resolve, reject) => {
            assetdb.queryAssets(pattern, 'scene', (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(Array.isArray(results) ? results : []);
            });
        });
    }
    normalizeSceneResults(results) {
        if (!Array.isArray(results)) {
            return [];
        }
        return results.map((asset) => {
            const url = asset.url || asset.path || '';
            const nameFromUrl = url.split('/').pop() || '';
            const cleanName = (asset.name || nameFromUrl).replace(/\.(scene|fire)$/i, '');
            return {
                name: cleanName || asset.name || 'Unnamed Scene',
                path: url,
                uuid: asset.uuid || asset.fileId || asset.fileid || ''
            };
        });
    }
    async openScene(scenePath) {
        return new Promise((resolve) => {
            var _a;
            logger_1.default.info('[scene-tools] Opening scene:', scenePath);
            // Cocos Creator 2.4.x: Use Editor.assetdb to query UUID
            const editor = Editor;
            const assetdb = editor.assetdb || ((_a = editor.remote) === null || _a === void 0 ? void 0 : _a.assetdb);
            if (!assetdb) {
                logger_1.default.error('[scene-tools] Editor.assetdb not available');
                resolve({ success: false, error: 'Asset database not available' });
                return;
            }
            logger_1.default.info('[scene-tools] Querying UUID for scene:', scenePath);
            // Method 1: Try urlToUuid (synchronous method in main process)
            try {
                const uuid = assetdb.urlToUuid(scenePath);
                logger_1.default.info('[scene-tools] Got UUID via urlToUuid:', uuid);
                if (uuid) {
                    // In 2.4.x, open scene by sending 'scene:open-by-uuid' message to main process
                    logger_1.default.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', uuid);
                    // Wait a bit for the scene to open
                    setTimeout(() => {
                        logger_1.default.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                    return;
                }
            }
            catch (e) {
                logger_1.default.warn('[scene-tools] urlToUuid failed:', e);
            }
            // Method 2: Try queryUuidByUrl (callback-based method)
            if (typeof assetdb.queryUuidByUrl === 'function') {
                logger_1.default.info('[scene-tools] Trying queryUuidByUrl...');
                assetdb.queryUuidByUrl(scenePath, (err, uuid) => {
                    if (err || !uuid) {
                        logger_1.default.error('[scene-tools] queryUuidByUrl failed:', err);
                        resolve({ success: false, error: 'Scene not found' });
                        return;
                    }
                    logger_1.default.info('[scene-tools] Got UUID via queryUuidByUrl:', uuid);
                    logger_1.default.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', uuid);
                    setTimeout(() => {
                        logger_1.default.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                });
                return;
            }
            // Method 3: Fallback - try to find scene using queryAssets
            logger_1.default.info('[scene-tools] Trying queryAssets as fallback...');
            if (typeof assetdb.queryAssets === 'function') {
                assetdb.queryAssets('db://assets/**/*.fire', ['scene'], (err, results) => {
                    if (err) {
                        logger_1.default.error('[scene-tools] queryAssets failed:', err);
                        resolve({ success: false, error: err.message });
                        return;
                    }
                    logger_1.default.info('[scene-tools] queryAssets results:', results);
                    // Find matching scene
                    const scene = results.find((s) => {
                        var _a;
                        return s.url === scenePath ||
                            s.path === scenePath ||
                            ((_a = s.path) === null || _a === void 0 ? void 0 : _a.endsWith(scenePath.replace('db://assets/', '')));
                    });
                    if (!scene) {
                        logger_1.default.error('[scene-tools] Scene not found in queryAssets results');
                        resolve({ success: false, error: 'Scene not found' });
                        return;
                    }
                    logger_1.default.info('[scene-tools] Found scene:', scene);
                    logger_1.default.info('[scene-tools] Opening scene with UUID via scene:open-by-uuid...');
                    editor.Ipc.sendToMain('scene:open-by-uuid', scene.uuid);
                    setTimeout(() => {
                        logger_1.default.info('[scene-tools] Scene opened successfully');
                        resolve({ success: true, message: `Scene opened: ${scenePath}` });
                    }, 500);
                });
                return;
            }
            logger_1.default.error('[scene-tools] No available method to query scene UUID');
            resolve({ success: false, error: 'No available method to query scene UUID' });
        });
    }
    async saveScene(scenePath) {
        return new Promise((resolve) => {
            logger_1.default.info('[scene-tools] Saving scene:', scenePath || 'current scene');
            // In 2.4.x, use scene panel's save-scene message
            const editor = Editor;
            // Try to send save-scene message to scene panel
            editor.Ipc.sendToPanel('scene', 'scene:save-scene', (err) => {
                if (err) {
                    logger_1.default.error('[scene-tools] Failed to save scene via panel:', err);
                    resolve({ success: false, error: err.message });
                }
                else {
                    logger_1.default.info('[scene-tools] Scene saved successfully');
                    resolve({ success: true, message: 'Scene saved successfully' });
                }
            });
        });
    }
    async createScene(sceneName, savePath) {
        return new Promise((resolve) => {
            try {
                const targetPath = this.normalizeSceneSavePath(sceneName, savePath);
                const sceneContent = this.buildCreator24SceneContent(sceneName);
                this.sendSceneDataToAssetDB(targetPath, sceneContent).then((result) => {
                    this.getSceneList().then((sceneList) => {
                        var _a;
                        const createdScene = (_a = sceneList.data) === null || _a === void 0 ? void 0 : _a.find((scene) => {
                            if ((result === null || result === void 0 ? void 0 : result.uuid) && scene.uuid) {
                                return scene.uuid === result.uuid;
                            }
                            return scene.path === targetPath;
                        });
                        resolve({
                            success: true,
                            data: {
                                uuid: result === null || result === void 0 ? void 0 : result.uuid,
                                url: (result === null || result === void 0 ? void 0 : result.url) || targetPath,
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
                                uuid: result === null || result === void 0 ? void 0 : result.uuid,
                                url: (result === null || result === void 0 ? void 0 : result.url) || targetPath,
                                name: sceneName,
                                message: `Scene '${sceneName}' created successfully (verification failed)`
                            }
                        });
                    });
                }).catch((err) => {
                    resolve({ success: false, error: err.message });
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message || String(err) });
            }
        });
    }
    sanitizeSceneName(name) {
        const trimmed = (name || 'New Scene').trim();
        const cleaned = trimmed.replace(/\.(fire|scene)$/i, '');
        return cleaned || 'New Scene';
    }
    normalizeSceneSavePath(sceneName, rawSavePath) {
        const sanitizedName = this.sanitizeSceneName(sceneName);
        let normalized = (rawSavePath || '').trim();
        if (!normalized) {
            throw new Error('savePath is required to create a scene');
        }
        normalized = normalized.replace(/\\/g, '/');
        const lower = normalized.toLowerCase();
        if (lower.endsWith('.scene')) {
            normalized = normalized.slice(0, -6) + '.fire';
        }
        else if (!lower.endsWith('.fire')) {
            const suffix = normalized.endsWith('/') ? '' : '/';
            normalized = `${normalized}${suffix}${sanitizedName}.fire`;
        }
        return normalized;
    }
    buildCreator24SceneContent(sceneName) {
        const sanitizedName = this.sanitizeSceneName(sceneName);
        const sceneTemplate = [
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
    sendSceneDataToAssetDB(targetPath, sceneContent) {
        var _a, _b;
        const editor = Editor;
        if ((_a = editor === null || editor === void 0 ? void 0 : editor.Ipc) === null || _a === void 0 ? void 0 : _a.sendToMain) {
            return new Promise((resolve, reject) => {
                try {
                    editor.Ipc.sendToMain('asset-db:create-asset', targetPath, sceneContent, (err, result) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        if ((_b = editor === null || editor === void 0 ? void 0 : editor.Message) === null || _b === void 0 ? void 0 : _b.request) {
            return Editor.Message.request('asset-db', 'create-asset', targetPath, sceneContent);
        }
        return Promise.reject(new Error('Asset database interface is not available'));
    }
    async getSceneHierarchy(includeComponents = false) {
        return new Promise((resolve) => {
            // 优先尝试使用 Editor API 查询场景节点树
            Editor.Message.request('scene', 'query-node-tree').then((tree) => {
                if (tree) {
                    const hierarchy = this.buildHierarchy(tree, includeComponents);
                    resolve({
                        success: true,
                        data: hierarchy
                    });
                }
                else {
                    resolve({ success: false, error: 'No scene hierarchy available' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getSceneHierarchy',
                    args: [includeComponents]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    buildHierarchy(node, includeComponents) {
        const nodeInfo = {
            uuid: node.uuid,
            name: node.name,
            type: node.type,
            active: node.active,
            children: []
        };
        if (includeComponents && node.__comps__) {
            nodeInfo.components = node.__comps__.map((comp) => ({
                type: comp.__type__ || 'Unknown',
                enabled: comp.enabled !== undefined ? comp.enabled : true
            }));
        }
        if (node.children) {
            nodeInfo.children = node.children.map((child) => this.buildHierarchy(child, includeComponents));
        }
        return nodeInfo;
    }
    async saveSceneAs(path) {
        return new Promise((resolve) => {
            // save-as-scene API 不接受路径参数，会弹出对话框让用户选择
            Editor.Message.request('scene', 'save-as-scene').then(() => {
                resolve({
                    success: true,
                    data: {
                        path: path,
                        message: `Scene save-as dialog opened`
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async closeScene() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'close-scene').then(() => {
                resolve({
                    success: true,
                    message: 'Scene closed successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}
exports.SceneTools = SceneTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsNkRBQXFDO0FBRXJDLE1BQWEsVUFBVTtJQUNuQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsc0JBQXNCO2dCQUNuQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFNBQVMsRUFBRTs0QkFDUCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUscUJBQXFCO3lCQUNyQztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxR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YSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDckQsT0FBTyxDQUFDO29CQUNKLE9BQU8sRUFBRSxJQUFJO29CQUNiLE9BQU8sRUFBRSwyQkFBMkI7aUJBQ3ZDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO2dCQUNwQixPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBN3hCRCxnQ0E2eEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yLCBTY2VuZUluZm8gfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X2N1cnJlbnRfc2NlbmUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGN1cnJlbnQgc2NlbmUgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9zY2VuZV9saXN0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhbGwgc2NlbmVzIGluIHRoZSBwcm9qZWN0JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW4gYSBzY2VuZSBieSBwYXRoJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgc2NlbmUgZmlsZSBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydzY2VuZVBhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NhdmVfc2NlbmUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2F2ZSBjdXJyZW50IHNjZW5lJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjcmVhdGVfc2NlbmUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGEgbmV3IHNjZW5lIGFzc2V0JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVOYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBuZXcgc2NlbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZVBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gc2F2ZSB0aGUgc2NlbmUgKGUuZy4sIGRiOi8vYXNzZXRzL1NjZW5lL05ld1NjZW5lLmZpcmUgb3IgZGI6Ly9hc3NldHMvU2NlbmUpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydzY2VuZU5hbWUnLCAnc2F2ZVBhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NhdmVfc2NlbmVfYXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2F2ZSBzY2VuZSBhcyBuZXcgZmlsZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gc2F2ZSB0aGUgc2NlbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Nsb3NlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3NlIGN1cnJlbnQgc2NlbmUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9zY2VuZV9oaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHRoZSBjb21wbGV0ZSBoaWVyYXJjaHkgb2YgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjb21wb25lbnQgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfY3VycmVudF9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Q3VycmVudFNjZW5lKCk7XG4gICAgICAgICAgICBjYXNlICdnZXRfc2NlbmVfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0U2NlbmVMaXN0KCk7XG4gICAgICAgICAgICBjYXNlICdvcGVuX3NjZW5lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5vcGVuU2NlbmUoYXJncy5zY2VuZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lKGFyZ3Muc2NlbmVQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlU2NlbmUoYXJncy5zY2VuZU5hbWUsIGFyZ3Muc2F2ZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZV9hcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lQXMoYXJncy5wYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2Nsb3NlX3NjZW5lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jbG9zZVNjZW5lKCk7XG4gICAgICAgICAgICBjYXNlICdnZXRfc2NlbmVfaGllcmFyY2h5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRTY2VuZUhpZXJhcmNoeShhcmdzLmluY2x1ZGVDb21wb25lbnRzKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEN1cnJlbnRTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIOebtOaOpeS9v+eUqCBxdWVyeS1ub2RlLXRyZWUg5p2l6I635Y+W5Zy65pmv5L+h5oGv77yI6L+Z5Liq5pa55rOV5bey57uP6aqM6K+B5Y+v55So77yJXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHJlZSAmJiB0cmVlLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRyZWUubmFtZSB8fCAnQ3VycmVudCBTY2VuZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdHJlZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRyZWUudHlwZSB8fCAnY2MuU2NlbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJlZS5hY3RpdmUgIT09IHVuZGVmaW5lZCA/IHRyZWUuYWN0aXZlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlQ291bnQ6IHRyZWUuY2hpbGRyZW4gPyB0cmVlLmNoaWxkcmVuLmxlbmd0aCA6IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIHNjZW5lIGRhdGEgYXZhaWxhYmxlJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWkh+eUqOaWueahiO+8muS9v+eUqOWcuuaZr+iEmuacrFxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1tY3Atc2VydmVyJyxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnZ2V0Q3VycmVudFNjZW5lSW5mbycsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIG9wdGlvbnMpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyMjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYERpcmVjdCBBUEkgZmFpbGVkOiAke2Vyci5tZXNzYWdlfSwgU2NlbmUgc2NyaXB0IGZhaWxlZDogJHtlcnIyLm1lc3NhZ2V9YCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFNjZW5lTGlzdCgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IFsnZGI6Ly9hc3NldHMvKiovKi5zY2VuZScsICdkYjovL2Fzc2V0cy8qKi8qLmZpcmUnXTtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5xdWVyeVNjZW5lc1ZpYU1lc3NhZ2UocGF0dGVybik7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gdGhpcy5ub3JtYWxpemVTY2VuZVJlc3VsdHMocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2VuZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogc2NlbmVzIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgW01lc3NhZ2U6JHtwYXR0ZXJufV0gJHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhbGxiYWNrUmVzdWx0cyA9IGF3YWl0IHRoaXMucXVlcnlTY2VuZXNWaWFBc3NldERCKHBhdHRlcm4pO1xuICAgICAgICAgICAgICAgIGlmIChmYWxsYmFja1Jlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVzID0gdGhpcy5ub3JtYWxpemVTY2VuZVJlc3VsdHMoZmFsbGJhY2tSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjZW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBzY2VuZXMgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBbQXNzZXREQjoke3BhdHRlcm59XSAke2Vycj8ubWVzc2FnZSB8fCBlcnJ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9ycy5qb2luKCcgfCAnKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgZGF0YTogW10sXG4gICAgICAgICAgICB3YXJuaW5nOiAn5pyq5ZyoIGFzc2V0cyDnm67lvZXkuK3mib7liLAgLnNjZW5lIOaIliAuZmlyZSDlnLrmma/mlofku7YnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVNjZW5lc1ZpYU1lc3NhZ2UocGF0dGVybjogc3RyaW5nKTogUHJvbWlzZTxhbnlbXSB8IG51bGw+IHtcbiAgICAgICAgaWYgKCFFZGl0b3IuTWVzc2FnZSB8fCAhRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXRzJywgeyBwYXR0ZXJuIH0pO1xuICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShyZXN1bHRzKSA/IHJlc3VsdHMgOiBbXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U2NlbmVzVmlhQXNzZXREQihwYXR0ZXJuOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBhc3NldGRiID0gKEVkaXRvciBhcyBhbnkpPy5hc3NldGRiO1xuICAgICAgICBpZiAoIWFzc2V0ZGIgfHwgdHlwZW9mIGFzc2V0ZGIucXVlcnlBc3NldHMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGFzc2V0ZGIucXVlcnlBc3NldHMocGF0dGVybiwgJ3NjZW5lJywgKGVycjogRXJyb3IsIHJlc3VsdHM6IGFueVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKEFycmF5LmlzQXJyYXkocmVzdWx0cykgPyByZXN1bHRzIDogW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplU2NlbmVSZXN1bHRzKHJlc3VsdHM6IGFueVtdKTogU2NlbmVJbmZvW10ge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzdWx0cykpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzLm1hcCgoYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gYXNzZXQudXJsIHx8IGFzc2V0LnBhdGggfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBuYW1lRnJvbVVybCA9IHVybC5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgY2xlYW5OYW1lID0gKGFzc2V0Lm5hbWUgfHwgbmFtZUZyb21VcmwpLnJlcGxhY2UoL1xcLihzY2VuZXxmaXJlKSQvaSwgJycpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGNsZWFuTmFtZSB8fCBhc3NldC5uYW1lIHx8ICdVbm5hbWVkIFNjZW5lJyxcbiAgICAgICAgICAgICAgICBwYXRoOiB1cmwsXG4gICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCB8fCBhc3NldC5maWxlSWQgfHwgYXNzZXQuZmlsZWlkIHx8ICcnXG4gICAgICAgICAgICB9IGFzIFNjZW5lSW5mbztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuU2NlbmUoc2NlbmVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIE9wZW5pbmcgc2NlbmU6Jywgc2NlbmVQYXRoKTtcblxuICAgICAgICAgICAgLy8gQ29jb3MgQ3JlYXRvciAyLjQueDogVXNlIEVkaXRvci5hc3NldGRiIHRvIHF1ZXJ5IFVVSURcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRkYiA9IGVkaXRvci5hc3NldGRiIHx8IGVkaXRvci5yZW1vdGU/LmFzc2V0ZGI7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXRkYikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBFZGl0b3IuYXNzZXRkYiBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0Fzc2V0IGRhdGFiYXNlIG5vdCBhdmFpbGFibGUnIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gUXVlcnlpbmcgVVVJRCBmb3Igc2NlbmU6Jywgc2NlbmVQYXRoKTtcblxuICAgICAgICAgICAgLy8gTWV0aG9kIDE6IFRyeSB1cmxUb1V1aWQgKHN5bmNocm9ub3VzIG1ldGhvZCBpbiBtYWluIHByb2Nlc3MpXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhc3NldGRiLnVybFRvVXVpZChzY2VuZVBhdGgpO1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIEdvdCBVVUlEIHZpYSB1cmxUb1V1aWQ6JywgdXVpZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiAyLjQueCwgb3BlbiBzY2VuZSBieSBzZW5kaW5nICdzY2VuZTpvcGVuLWJ5LXV1aWQnIG1lc3NhZ2UgdG8gbWFpbiBwcm9jZXNzXG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIE9wZW5pbmcgc2NlbmUgd2l0aCBVVUlEIHZpYSBzY2VuZTpvcGVuLWJ5LXV1aWQuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9NYWluKCdzY2VuZTpvcGVuLWJ5LXV1aWQnLCB1dWlkKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBXYWl0IGEgYml0IGZvciB0aGUgc2NlbmUgdG8gb3BlblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFNjZW5lIG9wZW5lZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgU2NlbmUgb3BlbmVkOiAke3NjZW5lUGF0aH1gIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdbc2NlbmUtdG9vbHNdIHVybFRvVXVpZCBmYWlsZWQ6JywgZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ldGhvZCAyOiBUcnkgcXVlcnlVdWlkQnlVcmwgKGNhbGxiYWNrLWJhc2VkIG1ldGhvZClcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXNzZXRkYi5xdWVyeVV1aWRCeVVybCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFRyeWluZyBxdWVyeVV1aWRCeVVybC4uLicpO1xuICAgICAgICAgICAgICAgIGFzc2V0ZGIucXVlcnlVdWlkQnlVcmwoc2NlbmVQYXRoLCAoZXJyOiBFcnJvciB8IG51bGwsIHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gcXVlcnlVdWlkQnlVcmwgZmFpbGVkOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2NlbmUgbm90IGZvdW5kJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIEdvdCBVVUlEIHZpYSBxdWVyeVV1aWRCeVVybDonLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gT3BlbmluZyBzY2VuZSB3aXRoIFVVSUQgdmlhIHNjZW5lOm9wZW4tYnktdXVpZC4uLicpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb01haW4oJ3NjZW5lOm9wZW4tYnktdXVpZCcsIHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gU2NlbmUgb3BlbmVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBTY2VuZSBvcGVuZWQ6ICR7c2NlbmVQYXRofWAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNZXRob2QgMzogRmFsbGJhY2sgLSB0cnkgdG8gZmluZCBzY2VuZSB1c2luZyBxdWVyeUFzc2V0c1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gVHJ5aW5nIHF1ZXJ5QXNzZXRzIGFzIGZhbGxiYWNrLi4uJyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzc2V0ZGIucXVlcnlBc3NldHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBhc3NldGRiLnF1ZXJ5QXNzZXRzKCdkYjovL2Fzc2V0cy8qKi8qLmZpcmUnLCBbJ3NjZW5lJ10sIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIHF1ZXJ5QXNzZXRzIGZhaWxlZDonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBxdWVyeUFzc2V0cyByZXN1bHRzOicsIHJlc3VsdHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgbWF0Y2hpbmcgc2NlbmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSByZXN1bHRzLmZpbmQoKHM6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHMudXJsID09PSBzY2VuZVBhdGggfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHMucGF0aCA9PT0gc2NlbmVQYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBzLnBhdGg/LmVuZHNXaXRoKHNjZW5lUGF0aC5yZXBsYWNlKCdkYjovL2Fzc2V0cy8nLCAnJykpXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIFNjZW5lIG5vdCBmb3VuZCBpbiBxdWVyeUFzc2V0cyByZXN1bHRzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2NlbmUgbm90IGZvdW5kJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIEZvdW5kIHNjZW5lOicsIHNjZW5lKTtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gT3BlbmluZyBzY2VuZSB3aXRoIFVVSUQgdmlhIHNjZW5lOm9wZW4tYnktdXVpZC4uLicpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb01haW4oJ3NjZW5lOm9wZW4tYnktdXVpZCcsIHNjZW5lLnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gU2NlbmUgb3BlbmVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBTY2VuZSBvcGVuZWQ6ICR7c2NlbmVQYXRofWAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gTm8gYXZhaWxhYmxlIG1ldGhvZCB0byBxdWVyeSBzY2VuZSBVVUlEJyk7XG4gICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYXZhaWxhYmxlIG1ldGhvZCB0byBxdWVyeSBzY2VuZSBVVUlEJyB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlU2NlbmUoc2NlbmVQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBTYXZpbmcgc2NlbmU6Jywgc2NlbmVQYXRoIHx8ICdjdXJyZW50IHNjZW5lJyk7XG5cbiAgICAgICAgICAgIC8vIEluIDIuNC54LCB1c2Ugc2NlbmUgcGFuZWwncyBzYXZlLXNjZW5lIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuXG4gICAgICAgICAgICAvLyBUcnkgdG8gc2VuZCBzYXZlLXNjZW5lIG1lc3NhZ2UgdG8gc2NlbmUgcGFuZWxcbiAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgJ3NjZW5lOnNhdmUtc2NlbmUnLCAoZXJyOiBFcnJvciB8IG51bGwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBGYWlsZWQgdG8gc2F2ZSBzY2VuZSB2aWEgcGFuZWw6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gU2NlbmUgc2F2ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnU2NlbmUgc2F2ZWQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTY2VuZShzY2VuZU5hbWU6IHN0cmluZywgc2F2ZVBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gdGhpcy5ub3JtYWxpemVTY2VuZVNhdmVQYXRoKHNjZW5lTmFtZSwgc2F2ZVBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lQ29udGVudCA9IHRoaXMuYnVpbGRDcmVhdG9yMjRTY2VuZUNvbnRlbnQoc2NlbmVOYW1lKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2VuZFNjZW5lRGF0YVRvQXNzZXREQih0YXJnZXRQYXRoLCBzY2VuZUNvbnRlbnQpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0U2NlbmVMaXN0KCkudGhlbigoc2NlbmVMaXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVkU2NlbmUgPSBzY2VuZUxpc3QuZGF0YT8uZmluZCgoc2NlbmU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LnV1aWQgJiYgc2NlbmUudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NlbmUudXVpZCA9PT0gcmVzdWx0LnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2VuZS5wYXRoID09PSB0YXJnZXRQYXRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiByZXN1bHQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcmVzdWx0Py51cmwgfHwgdGFyZ2V0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU2NlbmUgJyR7c2NlbmVOYW1lfScgY3JlYXRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVZlcmlmaWVkOiAhIWNyZWF0ZWRTY2VuZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YTogY3JlYXRlZFNjZW5lXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlc3VsdD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiByZXN1bHQ/LnVybCB8fCB0YXJnZXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzY2VuZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY2VuZSAnJHtzY2VuZU5hbWV9JyBjcmVhdGVkIHN1Y2Nlc3NmdWxseSAodmVyaWZpY2F0aW9uIGZhaWxlZClgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYW5pdGl6ZVNjZW5lTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gKG5hbWUgfHwgJ05ldyBTY2VuZScpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IHRyaW1tZWQucmVwbGFjZSgvXFwuKGZpcmV8c2NlbmUpJC9pLCAnJyk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkIHx8ICdOZXcgU2NlbmUnO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplU2NlbmVTYXZlUGF0aChzY2VuZU5hbWU6IHN0cmluZywgcmF3U2F2ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHNhbml0aXplZE5hbWUgPSB0aGlzLnNhbml0aXplU2NlbmVOYW1lKHNjZW5lTmFtZSk7XG4gICAgICAgIGxldCBub3JtYWxpemVkID0gKHJhd1NhdmVQYXRoIHx8ICcnKS50cmltKCk7XG5cbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NhdmVQYXRoIGlzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhIHNjZW5lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgIGNvbnN0IGxvd2VyID0gbm9ybWFsaXplZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChsb3dlci5lbmRzV2l0aCgnLnNjZW5lJykpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnNsaWNlKDAsIC02KSArICcuZmlyZSc7XG4gICAgICAgIH0gZWxzZSBpZiAoIWxvd2VyLmVuZHNXaXRoKCcuZmlyZScpKSB7XG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBub3JtYWxpemVkLmVuZHNXaXRoKCcvJykgPyAnJyA6ICcvJztcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQgPSBgJHtub3JtYWxpemVkfSR7c3VmZml4fSR7c2FuaXRpemVkTmFtZX0uZmlyZWA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkQ3JlYXRvcjI0U2NlbmVDb250ZW50KHNjZW5lTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgc2FuaXRpemVkTmFtZSA9IHRoaXMuc2FuaXRpemVTY2VuZU5hbWUoc2NlbmVOYW1lKTtcbiAgICAgICAgY29uc3Qgc2NlbmVUZW1wbGF0ZTogYW55W10gPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TY2VuZUFzc2V0JyxcbiAgICAgICAgICAgICAgICBfbmFtZTogc2FuaXRpemVkTmFtZSxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX25hdGl2ZTogJycsXG4gICAgICAgICAgICAgICAgc2NlbmU6IHtcbiAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlNjZW5lJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICBfY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAyXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFtdLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX29wYWNpdHk6IDI1NSxcbiAgICAgICAgICAgICAgICBfY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Db2xvcicsXG4gICAgICAgICAgICAgICAgICAgIHI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgZzogMjU1LFxuICAgICAgICAgICAgICAgICAgICBiOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGE6IDI1NVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NvbnRlbnRTaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hbmNob3JQb2ludDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzInLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfdHJzOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnVHlwZWRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGN0b3I6ICdGbG9hdDY0QXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBhcnJheTogWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfaXMzRE5vZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2dyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBhdXRvUmVsZWFzZUFzc2V0czogZmFsc2UsXG4gICAgICAgICAgICAgICAgX2lkOiAnMzI0MjQ3ZTgtYzU4NC00OTVkLTg3YjMtMDE1YTY5ZmVlNDQ0J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLk5vZGUnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnQ2FudmFzJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDoge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgX19pZF9fOiA2XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX29wYWNpdHk6IDI1NSxcbiAgICAgICAgICAgICAgICBfY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Db2xvcicsXG4gICAgICAgICAgICAgICAgICAgIHI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgZzogMjU1LFxuICAgICAgICAgICAgICAgICAgICBiOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGE6IDI1NVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NvbnRlbnRTaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA5NjAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjQwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfYW5jaG9yUG9pbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMyJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMC41LFxuICAgICAgICAgICAgICAgICAgICB5OiAwLjVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF90cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdUeXBlZEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgY3RvcjogJ0Zsb2F0NjRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGFycmF5OiBbNDgwLCAzMjAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZXVsZXJBbmdsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMzJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICAgICAgejogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3NrZXdYOiAwLFxuICAgICAgICAgICAgICAgIF9za2V3WTogMCxcbiAgICAgICAgICAgICAgICBfaXMzRE5vZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9ncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgX2lkOiAnYTVlc1p1KzQ1TEE1bUJwdnR0c3BQRCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Ob2RlJyxcbiAgICAgICAgICAgICAgICBfbmFtZTogJ01haW4gQ2FtZXJhJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDoge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW10sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcbiAgICAgICAgICAgICAgICBfb3BhY2l0eTogMjU1LFxuICAgICAgICAgICAgICAgIF9jb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMjU1LFxuICAgICAgICAgICAgICAgICAgICBnOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfY29udGVudFNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TaXplJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDk2MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hbmNob3JQb2ludDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzInLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAuNVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3Ryczoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ1R5cGVkQXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBjdG9yOiAnRmxvYXQ2NEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgYXJyYXk6IFswLCAwLCAwLCAwLCAwLCAwLCAxLCAxLCAxLCAxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2V1bGVyQW5nbGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMycsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIHo6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9za2V3WDogMCxcbiAgICAgICAgICAgICAgICBfc2tld1k6IDAsXG4gICAgICAgICAgICAgICAgX2lzM0ROb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBfZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIF9pZDogJ2UxV29GclE3OUc3cjRadVFFM0hsTmInXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuQ2FtZXJhJyxcbiAgICAgICAgICAgICAgICBfbmFtZTogJycsXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxuICAgICAgICAgICAgICAgIG5vZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY3VsbGluZ01hc2s6IDQyOTQ5NjcyOTUsXG4gICAgICAgICAgICAgICAgX2NsZWFyRmxhZ3M6IDcsXG4gICAgICAgICAgICAgICAgX2JhY2tncm91bmRDb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMCxcbiAgICAgICAgICAgICAgICAgICAgZzogMCxcbiAgICAgICAgICAgICAgICAgICAgYjogMCxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZGVwdGg6IC0xLFxuICAgICAgICAgICAgICAgIF96b29tUmF0aW86IDEsXG4gICAgICAgICAgICAgICAgX3RhcmdldFRleHR1cmU6IG51bGwsXG4gICAgICAgICAgICAgICAgX2ZvdjogNjAsXG4gICAgICAgICAgICAgICAgX29ydGhvU2l6ZTogMTAsXG4gICAgICAgICAgICAgICAgX25lYXJDbGlwOiAxLFxuICAgICAgICAgICAgICAgIF9mYXJDbGlwOiA0MDk2LFxuICAgICAgICAgICAgICAgIF9vcnRobzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfcmVjdDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlJlY3QnLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfcmVuZGVyU3RhZ2VzOiAxLFxuICAgICAgICAgICAgICAgIF9hbGlnbldpdGhTY3JlZW46IHRydWUsXG4gICAgICAgICAgICAgICAgX2lkOiAnODFHTjN1WElOS1ZMZVc0K2lLU2xpbSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5DYW52YXMnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgbm9kZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9kZXNpZ25SZXNvbHV0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA5NjAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjQwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZml0V2lkdGg6IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9maXRIZWlnaHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2lkOiAnNTlDZDBvdmJkRjRieXc1c2JqSkR4NydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5XaWRnZXQnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgbm9kZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsaWduTW9kZTogMSxcbiAgICAgICAgICAgICAgICBfdGFyZ2V0OiBudWxsLFxuICAgICAgICAgICAgICAgIF9hbGlnbkZsYWdzOiA0NSxcbiAgICAgICAgICAgICAgICBfbGVmdDogMCxcbiAgICAgICAgICAgICAgICBfcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgX3RvcDogMCxcbiAgICAgICAgICAgICAgICBfYm90dG9tOiAwLFxuICAgICAgICAgICAgICAgIF92ZXJ0aWNhbENlbnRlcjogMCxcbiAgICAgICAgICAgICAgICBfaG9yaXpvbnRhbENlbnRlcjogMCxcbiAgICAgICAgICAgICAgICBfaXNBYnNMZWZ0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1JpZ2h0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1RvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNCb3R0b206IHRydWUsXG4gICAgICAgICAgICAgICAgX2lzQWJzSG9yaXpvbnRhbENlbnRlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNWZXJ0aWNhbENlbnRlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfb3JpZ2luYWxXaWR0aDogMCxcbiAgICAgICAgICAgICAgICBfb3JpZ2luYWxIZWlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgX2lkOiAnMjl6WGJvaVhGQktvSVY0UFEybGlUZSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NlbmVUZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZW5kU2NlbmVEYXRhVG9Bc3NldERCKHRhcmdldFBhdGg6IHN0cmluZywgc2NlbmVDb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcblxuICAgICAgICBpZiAoZWRpdG9yPy5JcGM/LnNlbmRUb01haW4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9NYWluKCdhc3NldC1kYjpjcmVhdGUtYXNzZXQnLCB0YXJnZXRQYXRoLCBzY2VuZUNvbnRlbnQsIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVkaXRvcj8uTWVzc2FnZT8ucmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIHRhcmdldFBhdGgsIHNjZW5lQ29udGVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdBc3NldCBkYXRhYmFzZSBpbnRlcmZhY2UgaXMgbm90IGF2YWlsYWJsZScpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFNjZW5lSGllcmFyY2h5KGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIOS8mOWFiOWwneivleS9v+eUqCBFZGl0b3IgQVBJIOafpeivouWcuuaZr+iKgueCueagkVxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZS10cmVlJykudGhlbigodHJlZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRyZWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gdGhpcy5idWlsZEhpZXJhcmNoeSh0cmVlLCBpbmNsdWRlQ29tcG9uZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGhpZXJhcmNoeVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gc2NlbmUgaGllcmFyY2h5IGF2YWlsYWJsZScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDlpIfnlKjmlrnmoYjvvJrkvb/nlKjlnLrmma/ohJrmnKxcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ2dldFNjZW5lSGllcmFyY2h5JyxcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW2luY2x1ZGVDb21wb25lbnRzXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycjI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBEaXJlY3QgQVBJIGZhaWxlZDogJHtlcnIubWVzc2FnZX0sIFNjZW5lIHNjcmlwdCBmYWlsZWQ6ICR7ZXJyMi5tZXNzYWdlfWAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZEhpZXJhcmNoeShub2RlOiBhbnksIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55IHtcbiAgICAgICAgY29uc3Qgbm9kZUluZm86IGFueSA9IHtcbiAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZSxcbiAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW5jbHVkZUNvbXBvbmVudHMgJiYgbm9kZS5fX2NvbXBzX18pIHtcbiAgICAgICAgICAgIG5vZGVJbmZvLmNvbXBvbmVudHMgPSBub2RlLl9fY29tcHNfXy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBjb21wLl9fdHlwZV9fIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXAuZW5hYmxlZCA6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBub2RlSW5mby5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkSGllcmFyY2h5KGNoaWxkLCBpbmNsdWRlQ29tcG9uZW50cylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZUluZm87XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlU2NlbmVBcyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIHNhdmUtYXMtc2NlbmUgQVBJIOS4jeaOpeWPl+i3r+W+hOWPguaVsO+8jOS8muW8ueWHuuWvueivneahhuiuqeeUqOaIt+mAieaLqVxuICAgICAgICAgICAgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KSgnc2NlbmUnLCAnc2F2ZS1hcy1zY2VuZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFNjZW5lIHNhdmUtYXMgZGlhbG9nIG9wZW5lZGBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNsb3NlU2NlbmUoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjbG9zZS1zY2VuZScpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnU2NlbmUgY2xvc2VkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19
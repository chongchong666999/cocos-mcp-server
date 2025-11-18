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
                        },
                        sourcePath: {
                            type: 'string',
                            description: 'Optional explicit path of the current scene'
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
                return await this.saveSceneAs(args.path, args.sourcePath);
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
    ensureDbUrl(rawPath) {
        let normalized = (rawPath || '').trim();
        if (!normalized) {
            throw new Error('Scene path is required');
        }
        normalized = normalized.replace(/\\/g, '/');
        if (normalized.startsWith('db://')) {
            return normalized;
        }
        if (normalized.startsWith('assets/')) {
            return `db://${normalized}`;
        }
        if (normalized.startsWith('/')) {
            return `db://assets${normalized}`;
        }
        return `db://assets/${normalized}`;
    }
    normalizeSceneSourcePath(rawPath) {
        let normalized = this.ensureDbUrl(rawPath);
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        const lower = normalized.toLowerCase();
        if (lower.endsWith('.scene')) {
            return normalized.slice(0, -6) + '.fire';
        }
        if (!lower.endsWith('.fire')) {
            return `${normalized}.fire`;
        }
        return normalized;
    }
    extractSceneNameFromPath(scenePath) {
        if (!scenePath) {
            return 'New Scene';
        }
        const normalized = scenePath.replace(/\\/g, '/');
        const segments = normalized.split('/');
        const last = segments[segments.length - 1] || '';
        const withoutExt = last.replace(/\.(fire|scene)$/i, '');
        return this.sanitizeSceneName(withoutExt || 'New Scene');
    }
    async resolveCurrentSceneSource(sourceOverride) {
        if (sourceOverride) {
            const normalizedSource = this.normalizeSceneSourcePath(sourceOverride);
            return {
                path: normalizedSource,
                name: this.extractSceneNameFromPath(normalizedSource)
            };
        }
        let sceneInfo = null;
        try {
            sceneInfo = await Editor.Message.request('scene', 'query-current-scene');
        }
        catch (err) {
            logger_1.default.warn(`[scene-tools] Failed to query current scene info: ${err}`);
        }
        let rawPath = (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.url) || (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.path) || (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.file);
        let sceneName = (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.name) || (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.sceneName);
        if ((!rawPath || typeof rawPath !== 'string') && (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.uuid)) {
            try {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', { uuid: sceneInfo.uuid });
                if (assetInfo) {
                    rawPath = assetInfo.url || assetInfo.path;
                    sceneName = sceneName || assetInfo.name;
                }
            }
            catch (assetErr) {
                logger_1.default.warn(`[scene-tools] Failed to query asset info for scene uuid ${sceneInfo.uuid}: ${assetErr}`);
            }
        }
        if (!rawPath) {
            throw new Error('Unable to determine current scene path. Please provide sourcePath explicitly.');
        }
        const normalizedSource = this.normalizeSceneSourcePath(rawPath);
        return {
            path: normalizedSource,
            name: sceneName || this.extractSceneNameFromPath(normalizedSource)
        };
    }
    moveSceneAsset(source, target) {
        return new Promise((resolve, reject) => {
            var _a, _b;
            const editor = Editor;
            if ((_a = editor === null || editor === void 0 ? void 0 : editor.Ipc) === null || _a === void 0 ? void 0 : _a.sendToMain) {
                try {
                    editor.Ipc.sendToMain('asset-db:move-asset', source, target, (err, result) => {
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
                return;
            }
            if ((_b = Editor === null || Editor === void 0 ? void 0 : Editor.Message) === null || _b === void 0 ? void 0 : _b.request) {
                Editor.Message.request('asset-db', 'move-asset', source, target).then(resolve).catch(reject);
                return;
            }
            reject(new Error('Asset database interface is not available'));
        });
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
    async saveSceneAs(path, sourcePath) {
        return new Promise(async (resolve) => {
            try {
                if (!path || typeof path !== 'string') {
                    resolve({ success: false, error: 'path is required' });
                    return;
                }
                const currentScene = await this.resolveCurrentSceneSource(sourcePath);
                const targetPath = this.normalizeSceneSavePath(currentScene.name, this.ensureDbUrl(path));
                if (targetPath === currentScene.path) {
                    resolve({ success: false, error: 'Source and destination paths are identical' });
                    return;
                }
                await this.moveSceneAsset(currentScene.path, targetPath);
                resolve({
                    success: true,
                    data: {
                        source: currentScene.path,
                        path: targetPath,
                        message: `Scene moved to ${targetPath}`
                    }
                });
            }
            catch (err) {
                resolve({ success: false, error: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsNkRBQXFDO0FBRXJDLE1BQWEsVUFBVTtJQUNuQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsc0JBQXNCO2dCQUNuQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFNBQVMsRUFBRTs0QkFDUCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUscUJBQXFCO3lCQUNyQztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx1QkFBdUI7eUJBQ3ZDO3dCQUNELFFBQVEsRUFBRTs0QkFDTixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUscUZBQXFGO3lCQUNyRztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDO2lCQUN0QzthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLFdBQVcsRUFBRSx3QkFBd0I7Z0JBQ3JDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx3QkFBd0I7eUJBQ3hDO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsNkNBQTZDO3lCQUM3RDtxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLHFCQUFxQjtnQkFDbEMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLDZDQUE2QztnQkFDMUQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixpQkFBaUIsRUFBRTs0QkFDZixJQUFJLEVBQUUsU0FBUzs0QkFDZixXQUFXLEVBQUUsK0JBQStCOzRCQUM1QyxPQUFPLEVBQUUsS0FBSzt5QkFDakI7cUJBQ0o7aUJBQ0o7YUFDSjtTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsUUFBUSxRQUFRLEVBQUUsQ0FBQztZQUNmLEtBQUssbUJBQW1CO2dCQUNwQixPQUFPLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3hDLEtBQUssZ0JBQWdCO2dCQUNqQixPQUFPLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3JDLEtBQUssWUFBWTtnQkFDYixPQUFPLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEQsS0FBSyxZQUFZO2dCQUNiLE9BQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRCxLQUFLLGNBQWM7Z0JBQ2YsT0FBTyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakUsS0FBSyxlQUFlO2dCQUNoQixPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5RCxLQUFLLGFBQWE7Z0JBQ2QsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNuQyxLQUFLLHFCQUFxQjtnQkFDdEIsT0FBTyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNoRTtnQkFDSSxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDTCxDQUFDO0lBRU8sS0FBSyxDQUFDLGVBQWU7UUFDekIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzNCLDJDQUEyQztZQUMzQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtnQkFDbEUsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNwQixPQUFPLENBQUM7d0JBQ0osT0FBTyxFQUFFLElBQUk7d0JBQ2IsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLGVBQWU7NEJBQ2xDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTs0QkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVOzRCQUM3QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUk7NEJBQ3RELFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDdEQ7cUJBQ0osQ0FBQyxDQUFDO2dCQUNQLENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSx5QkFBeUIsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFVLEVBQUUsRUFBRTtnQkFDcEIsY0FBYztnQkFDZCxNQUFNLE9BQU8sR0FBRztvQkFDWixJQUFJLEVBQUUsa0JBQWtCO29CQUN4QixNQUFNLEVBQUUscUJBQXFCO29CQUM3QixJQUFJLEVBQUUsRUFBRTtpQkFDWCxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRTtvQkFDbEYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFXLEVBQUUsRUFBRTtvQkFDckIsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEdBQUcsQ0FBQyxPQUFPLDBCQUEwQixJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsSCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sS0FBSyxDQUFDLFlBQVk7UUFDdEIsTUFBTSxRQUFRLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztRQUU1QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQztnQkFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDVixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ25ELElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEIsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUMzQyxDQUFDO29CQUNELFNBQVM7Z0JBQ2IsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksT0FBTyxLQUFLLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLE9BQU8sS0FBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xFLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ2xCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDM0QsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNwQixPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7b0JBQzNDLENBQUM7b0JBQ0QsU0FBUztnQkFDYixDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxPQUFPLEtBQUssQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsT0FBTyxLQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDL0QsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDcEIsT0FBTztnQkFDSCxPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7YUFDNUIsQ0FBQztRQUNOLENBQUM7UUFFRCxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsRUFBRTtZQUNSLE9BQU8sRUFBRSxxQ0FBcUM7U0FDakQsQ0FBQztJQUNOLENBQUM7SUFFTyxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBZTtRQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDN0MsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDdEYsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNqRCxDQUFDO0lBRU8sS0FBSyxDQUFDLHFCQUFxQixDQUFDLE9BQWU7UUFDL0MsTUFBTSxPQUFPLEdBQUksTUFBYyxhQUFkLE1BQU0sdUJBQU4sTUFBTSxDQUFVLE9BQU8sQ0FBQztRQUN6QyxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sT0FBTyxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUN4RCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxHQUFVLEVBQUUsT0FBYyxFQUFFLEVBQUU7Z0JBQ2pFLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNaLE9BQU87Z0JBQ1gsQ0FBQztnQkFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLHFCQUFxQixDQUFDLE9BQWM7UUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMxQixPQUFPLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtZQUM5QixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQzFDLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQy9DLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFOUUsT0FBTztnQkFDSCxJQUFJLEVBQUUsU0FBUyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksZUFBZTtnQkFDaEQsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUU7YUFDNUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQWlCO1FBQ3JDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTs7WUFDM0IsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdkQsd0RBQXdEO1lBQ3hELE1BQU0sTUFBTSxHQUFRLE1BQU0sQ0FBQztZQUMzQixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxLQUFJLE1BQUEsTUFBTSxDQUFDLE1BQU0sMENBQUUsT0FBTyxDQUFBLENBQUM7WUFFekQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLGdCQUFNLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7Z0JBQzNELE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUFFLENBQUMsQ0FBQztnQkFDbkUsT0FBTztZQUNYLENBQUM7WUFFRCxnQkFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVqRSwrREFBK0Q7WUFDL0QsSUFBSSxDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLGdCQUFNLENBQUMsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUUzRCxJQUFJLElBQUksRUFBRSxDQUFDO29CQUNQLCtFQUErRTtvQkFDL0UsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLENBQUMsQ0FBQztvQkFDL0UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBRWxELG1DQUFtQztvQkFDbkMsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDWixnQkFBTSxDQUFDLElBQUksQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO3dCQUN2RCxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUN0RSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ1IsT0FBTztnQkFDWCxDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUVELHVEQUF1RDtZQUN2RCxJQUFJLE9BQU8sT0FBTyxDQUFDLGNBQWMsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDL0MsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsQ0FBQztnQkFDdEQsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFpQixFQUFFLElBQVksRUFBRSxFQUFFO29CQUNsRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNmLGdCQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUMxRCxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7d0JBQ3RELE9BQU87b0JBQ1gsQ0FBQztvQkFFRCxnQkFBTSxDQUFDLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDaEUsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLENBQUMsQ0FBQztvQkFDL0UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBRWxELFVBQVUsQ0FBQyxHQUFHLEVBQUU7d0JBQ1osZ0JBQU0sQ0FBQyxJQUFJLENBQUMseUNBQXlDLENBQUMsQ0FBQzt3QkFDdkQsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsaUJBQWlCLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDdEUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFDWCxDQUFDO1lBRUQsMkRBQTJEO1lBQzNELGdCQUFNLENBQUMsSUFBSSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7WUFDL0QsSUFBSSxPQUFPLE9BQU8sQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzVDLE9BQU8sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQWlCLEVBQUUsT0FBYyxFQUFFLEVBQUU7b0JBQzFGLElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ04sZ0JBQU0sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQUM7d0JBQ3ZELE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO3dCQUNoRCxPQUFPO29CQUNYLENBQUM7b0JBRUQsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBRTNELHNCQUFzQjtvQkFDdEIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFOzt3QkFDbEMsT0FBQSxDQUFDLENBQUMsR0FBRyxLQUFLLFNBQVM7NEJBQ25CLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUzs2QkFDcEIsTUFBQSxDQUFDLENBQUMsSUFBSSwwQ0FBRSxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQSxDQUFBO3FCQUFBLENBQzFELENBQUM7b0JBRUYsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNULGdCQUFNLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7d0JBQ3JFLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQzt3QkFDdEQsT0FBTztvQkFDWCxDQUFDO29CQUVELGdCQUFNLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNqRCxnQkFBTSxDQUFDLElBQUksQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO29CQUMvRSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRXhELFVBQVUsQ0FBQyxHQUFHLEVBQUU7d0JBQ1osZ0JBQU0sQ0FBQyxJQUFJLENBQUMseUNBQXlDLENBQUMsQ0FBQzt3QkFDdkQsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsaUJBQWlCLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDdEUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNaLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFDWCxDQUFDO1lBRUQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztZQUN0RSxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSx5Q0FBeUMsRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFrQjtRQUN0QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsU0FBUyxJQUFJLGVBQWUsQ0FBQyxDQUFDO1lBRXpFLGlEQUFpRDtZQUNqRCxNQUFNLE1BQU0sR0FBUSxNQUFNLENBQUM7WUFFM0IsZ0RBQWdEO1lBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDLEdBQWlCLEVBQUUsRUFBRTtnQkFDdEUsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDTixnQkFBTSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDbkUsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7cUJBQU0sQ0FBQztvQkFDSixnQkFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO29CQUN0RCxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBaUIsRUFBRSxRQUFnQjtRQUN6RCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDO2dCQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFaEUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRTtvQkFDdkUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFOzt3QkFDbkMsTUFBTSxZQUFZLEdBQUcsTUFBQSxTQUFTLENBQUMsSUFBSSwwQ0FBRSxJQUFJLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTs0QkFDckQsSUFBSSxDQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxJQUFJLEtBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dDQUM3QixPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQzs0QkFDdEMsQ0FBQzs0QkFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDO3dCQUNyQyxDQUFDLENBQUMsQ0FBQzt3QkFFSCxPQUFPLENBQUM7NEJBQ0osT0FBTyxFQUFFLElBQUk7NEJBQ2IsSUFBSSxFQUFFO2dDQUNGLElBQUksRUFBRSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsSUFBSTtnQ0FDbEIsR0FBRyxFQUFFLENBQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLEdBQUcsS0FBSSxVQUFVO2dDQUM5QixJQUFJLEVBQUUsU0FBUztnQ0FDZixPQUFPLEVBQUUsVUFBVSxTQUFTLHdCQUF3QjtnQ0FDcEQsYUFBYSxFQUFFLENBQUMsQ0FBQyxZQUFZOzZCQUNoQzs0QkFDRCxnQkFBZ0IsRUFBRSxZQUFZO3lCQUNqQyxDQUFDLENBQUM7b0JBQ1AsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTt3QkFDVixPQUFPLENBQUM7NEJBQ0osT0FBTyxFQUFFLElBQUk7NEJBQ2IsSUFBSSxFQUFFO2dDQUNGLElBQUksRUFBRSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsSUFBSTtnQ0FDbEIsR0FBRyxFQUFFLENBQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLEdBQUcsS0FBSSxVQUFVO2dDQUM5QixJQUFJLEVBQUUsU0FBUztnQ0FDZixPQUFPLEVBQUUsVUFBVSxTQUFTLDhDQUE4Qzs2QkFDN0U7eUJBQ0osQ0FBQyxDQUFDO29CQUNQLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO29CQUNwQixPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDcEQsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBQUMsT0FBTyxHQUFRLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxJQUFZO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBTyxPQUFPLElBQUksV0FBVyxDQUFDO0lBQ2xDLENBQUM7SUFFTyxXQUFXLENBQUMsT0FBZTtRQUMvQixJQUFJLFVBQVUsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUV4QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU1QyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxPQUFPLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDbkMsT0FBTyxRQUFRLFVBQVUsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM3QixPQUFPLGNBQWMsVUFBVSxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU8sZUFBZSxVQUFVLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRU8sd0JBQXdCLENBQUMsT0FBZTtRQUM1QyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzNCLFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdkMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDM0IsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUM3QyxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMzQixPQUFPLEdBQUcsVUFBVSxPQUFPLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3RCLENBQUM7SUFFTyx3QkFBd0IsQ0FBQyxTQUFpQjtRQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDYixPQUFPLFdBQVcsQ0FBQztRQUN2QixDQUFDO1FBRUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDakQsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN4RCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLElBQUksV0FBVyxDQUFDLENBQUM7SUFDN0QsQ0FBQztJQUVPLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxjQUF1QjtRQUMzRCxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3ZFLE9BQU87Z0JBQ0gsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsSUFBSSxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQzthQUN4RCxDQUFDO1FBQ04sQ0FBQztRQUVELElBQUksU0FBUyxHQUFRLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUM7WUFDRCxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLGdCQUFNLENBQUMsSUFBSSxDQUFDLHFEQUFxRCxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxHQUFHLE1BQUksU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxLQUFJLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLENBQUEsQ0FBQztRQUNuRSxJQUFJLFNBQVMsR0FBRyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUksU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLFNBQVMsQ0FBQSxDQUFDO1FBRXhELElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsS0FBSSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQUUsQ0FBQztZQUMvRCxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3pHLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ1osT0FBTyxHQUFHLFNBQVMsQ0FBQyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQztvQkFDMUMsU0FBUyxHQUFHLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUM1QyxDQUFDO1lBQ0wsQ0FBQztZQUFDLE9BQU8sUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLGdCQUFNLENBQUMsSUFBSSxDQUFDLDJEQUEyRCxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDMUcsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLCtFQUErRSxDQUFDLENBQUM7UUFDckcsQ0FBQztRQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hFLE9BQU87WUFDSCxJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLElBQUksRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDO1NBQ3JFLENBQUM7SUFDTixDQUFDO0lBRU8sY0FBYyxDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQ2pELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7O1lBQ25DLE1BQU0sTUFBTSxHQUFRLE1BQU0sQ0FBQztZQUUzQixJQUFJLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLEdBQUcsMENBQUUsVUFBVSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQztvQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBaUIsRUFBRSxNQUFXLEVBQUUsRUFBRTt3QkFDNUYsSUFBSSxHQUFHLEVBQUUsQ0FBQzs0QkFDTixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2hCLENBQUM7NkJBQU0sQ0FBQzs0QkFDSixPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ3BCLENBQUM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztnQkFDRCxPQUFPO1lBQ1gsQ0FBQztZQUVELElBQUksTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsT0FBTywwQ0FBRSxPQUFPLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0YsT0FBTztZQUNYLENBQUM7WUFFRCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLHNCQUFzQixDQUFDLFNBQWlCLEVBQUUsV0FBbUI7UUFDakUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksVUFBVSxHQUFHLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTVDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUV2QyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUMzQixVQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDbkQsQ0FBQzthQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDbEMsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDbkQsVUFBVSxHQUFHLEdBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxhQUFhLE9BQU8sQ0FBQztRQUMvRCxDQUFDO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDdEIsQ0FBQztJQUVPLDBCQUEwQixDQUFDLFNBQWlCO1FBQ2hELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RCxNQUFNLGFBQWEsR0FBVTtZQUN6QjtnQkFDSSxRQUFRLEVBQUUsZUFBZTtnQkFDekIsS0FBSyxFQUFFLGFBQWE7Z0JBQ3BCLFNBQVMsRUFBRSxDQUFDO2dCQUNaLE9BQU8sRUFBRSxFQUFFO2dCQUNYLEtBQUssRUFBRTtvQkFDSCxNQUFNLEVBQUUsQ0FBQztpQkFDWjthQUNKO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLFVBQVU7Z0JBQ3BCLFNBQVMsRUFBRSxDQUFDO2dCQUNaLE9BQU8sRUFBRSxJQUFJO2dCQUNiLFNBQVMsRUFBRTtvQkFDUDt3QkFDSSxNQUFNLEVBQUUsQ0FBQztxQkFDWjtpQkFDSjtnQkFDRCxPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUUsRUFBRTtnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixRQUFRLEVBQUUsR0FBRztnQkFDYixNQUFNLEVBQUU7b0JBQ0osUUFBUSxFQUFFLFVBQVU7b0JBQ3BCLENBQUMsRUFBRSxHQUFHO29CQUNOLENBQUMsRUFBRSxHQUFHO29CQUNOLENBQUMsRUFBRSxHQUFHO29CQUNOLENBQUMsRUFBRSxHQUFHO2lCQUNUO2dCQUNELFlBQVksRUFBRTtvQkFDVixRQUFRLEVBQUUsU0FBUztvQkFDbkIsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLENBQUM7aUJBQ1o7Z0JBQ0QsWUFBWSxFQUFFO29CQUNWLFFBQVEsRUFBRSxTQUFTO29CQUNuQixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztpQkFDUDtnQkFDRCxJQUFJLEVBQUU7b0JBQ0YsUUFBUSxFQUFFLFlBQVk7b0JBQ3RCLElBQUksRUFBRSxjQUFjO29CQUNwQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3hDO2dCQUNELFNBQVMsRUFBRSxJQUFJO2dCQUNmLFdBQVcsRUFBRSxDQUFDO2dCQUNkLFVBQVUsRUFBRSxDQUFDO2dCQUNiLGlCQUFpQixFQUFFLEtBQUs7Z0JBQ3hCLEdBQUcsRUFBRSxzQ0FBc0M7YUFDOUM7WUFDRDtnQkFDSSxRQUFRLEVBQUUsU0FBUztnQkFDbkIsS0FBSyxFQUFFLFFBQVE7Z0JBQ2YsU0FBUyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxFQUFFO29CQUNMLE1BQU0sRUFBRSxDQUFDO2lCQUNaO2dCQUNELFNBQVMsRUFBRTtvQkFDUDt3QkFDSSxNQUFNLEVBQUUsQ0FBQztxQkFDWjtpQkFDSjtnQkFDRCxPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUU7b0JBQ1Q7d0JBQ0ksTUFBTSxFQUFFLENBQUM7cUJBQ1o7b0JBQ0Q7d0JBQ0ksTUFBTSxFQUFFLENBQUM7cUJBQ1o7aUJBQ0o7Z0JBQ0QsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsUUFBUSxFQUFFLEdBQUc7Z0JBQ2IsTUFBTSxFQUFFO29CQUNKLFFBQVEsRUFBRSxVQUFVO29CQUNwQixDQUFDLEVBQUUsR0FBRztvQkFDTixDQUFDLEVBQUUsR0FBRztvQkFDTixDQUFDLEVBQUUsR0FBRztvQkFDTixDQUFDLEVBQUUsR0FBRztpQkFDVDtnQkFDRCxZQUFZLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLEtBQUssRUFBRSxHQUFHO29CQUNWLE1BQU0sRUFBRSxHQUFHO2lCQUNkO2dCQUNELFlBQVksRUFBRTtvQkFDVixRQUFRLEVBQUUsU0FBUztvQkFDbkIsQ0FBQyxFQUFFLEdBQUc7b0JBQ04sQ0FBQyxFQUFFLEdBQUc7aUJBQ1Q7Z0JBQ0QsSUFBSSxFQUFFO29CQUNGLFFBQVEsRUFBRSxZQUFZO29CQUN0QixJQUFJLEVBQUUsY0FBYztvQkFDcEIsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM1QztnQkFDRCxZQUFZLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLENBQUMsRUFBRSxDQUFDO29CQUNKLENBQUMsRUFBRSxDQUFDO29CQUNKLENBQUMsRUFBRSxDQUFDO2lCQUNQO2dCQUNELE1BQU0sRUFBRSxDQUFDO2dCQUNULE1BQU0sRUFBRSxDQUFDO2dCQUNULFNBQVMsRUFBRSxLQUFLO2dCQUNoQixXQUFXLEVBQUUsQ0FBQztnQkFDZCxVQUFVLEVBQUUsQ0FBQztnQkFDYixHQUFHLEVBQUUsd0JBQXdCO2FBQ2hDO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLEtBQUssRUFBRSxhQUFhO2dCQUNwQixTQUFTLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUU7b0JBQ0wsTUFBTSxFQUFFLENBQUM7aUJBQ1o7Z0JBQ0QsU0FBUyxFQUFFLEVBQUU7Z0JBQ2IsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsV0FBVyxFQUFFO29CQUNUO3dCQUNJLE1BQU0sRUFBRSxDQUFDO3FCQUNaO2lCQUNKO2dCQUNELE9BQU8sRUFBRSxJQUFJO2dCQUNiLFFBQVEsRUFBRSxHQUFHO2dCQUNiLE1BQU0sRUFBRTtvQkFDSixRQUFRLEVBQUUsVUFBVTtvQkFDcEIsQ0FBQyxFQUFFLEdBQUc7b0JBQ04sQ0FBQyxFQUFFLEdBQUc7b0JBQ04sQ0FBQyxFQUFFLEdBQUc7b0JBQ04sQ0FBQyxFQUFFLEdBQUc7aUJBQ1Q7Z0JBQ0QsWUFBWSxFQUFFO29CQUNWLFFBQVEsRUFBRSxTQUFTO29CQUNuQixLQUFLLEVBQUUsR0FBRztvQkFDVixNQUFNLEVBQUUsR0FBRztpQkFDZDtnQkFDRCxZQUFZLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLENBQUMsRUFBRSxHQUFHO29CQUNOLENBQUMsRUFBRSxHQUFHO2lCQUNUO2dCQUNELElBQUksRUFBRTtvQkFDRixRQUFRLEVBQUUsWUFBWTtvQkFDdEIsSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDeEM7Z0JBQ0QsWUFBWSxFQUFFO29CQUNWLFFBQVEsRUFBRSxTQUFTO29CQUNuQixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztpQkFDUDtnQkFDRCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxTQUFTLEVBQUUsS0FBSztnQkFDaEIsV0FBVyxFQUFFLENBQUM7Z0JBQ2QsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsR0FBRyxFQUFFLHdCQUF3QjthQUNoQztZQUNEO2dCQUNJLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixLQUFLLEVBQUUsRUFBRTtnQkFDVCxTQUFTLEVBQUUsQ0FBQztnQkFDWixJQUFJLEVBQUU7b0JBQ0YsTUFBTSxFQUFFLENBQUM7aUJBQ1o7Z0JBQ0QsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsWUFBWSxFQUFFLFVBQVU7Z0JBQ3hCLFdBQVcsRUFBRSxDQUFDO2dCQUNkLGdCQUFnQixFQUFFO29CQUNkLFFBQVEsRUFBRSxVQUFVO29CQUNwQixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsQ0FBQztvQkFDSixDQUFDLEVBQUUsR0FBRztpQkFDVDtnQkFDRCxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUNWLFVBQVUsRUFBRSxDQUFDO2dCQUNiLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixJQUFJLEVBQUUsRUFBRTtnQkFDUixVQUFVLEVBQUUsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixRQUFRLEVBQUUsSUFBSTtnQkFDZCxNQUFNLEVBQUUsSUFBSTtnQkFDWixLQUFLLEVBQUU7b0JBQ0gsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLENBQUMsRUFBRSxDQUFDO29CQUNKLENBQUMsRUFBRSxDQUFDO29CQUNKLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxDQUFDO2lCQUNaO2dCQUNELGFBQWEsRUFBRSxDQUFDO2dCQUNoQixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixHQUFHLEVBQUUsd0JBQXdCO2FBQ2hDO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLEtBQUssRUFBRSxFQUFFO2dCQUNULFNBQVMsRUFBRSxDQUFDO2dCQUNaLElBQUksRUFBRTtvQkFDRixNQUFNLEVBQUUsQ0FBQztpQkFDWjtnQkFDRCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxpQkFBaUIsRUFBRTtvQkFDZixRQUFRLEVBQUUsU0FBUztvQkFDbkIsS0FBSyxFQUFFLEdBQUc7b0JBQ1YsTUFBTSxFQUFFLEdBQUc7aUJBQ2Q7Z0JBQ0QsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixHQUFHLEVBQUUsd0JBQXdCO2FBQ2hDO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLFdBQVc7Z0JBQ3JCLEtBQUssRUFBRSxFQUFFO2dCQUNULFNBQVMsRUFBRSxDQUFDO2dCQUNaLElBQUksRUFBRTtvQkFDRixNQUFNLEVBQUUsQ0FBQztpQkFDWjtnQkFDRCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsSUFBSTtnQkFDYixXQUFXLEVBQUUsRUFBRTtnQkFDZixLQUFLLEVBQUUsQ0FBQztnQkFDUixNQUFNLEVBQUUsQ0FBQztnQkFDVCxJQUFJLEVBQUUsQ0FBQztnQkFDUCxPQUFPLEVBQUUsQ0FBQztnQkFDVixlQUFlLEVBQUUsQ0FBQztnQkFDbEIsaUJBQWlCLEVBQUUsQ0FBQztnQkFDcEIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixTQUFTLEVBQUUsSUFBSTtnQkFDZixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsc0JBQXNCLEVBQUUsSUFBSTtnQkFDNUIsb0JBQW9CLEVBQUUsSUFBSTtnQkFDMUIsY0FBYyxFQUFFLENBQUM7Z0JBQ2pCLGVBQWUsRUFBRSxDQUFDO2dCQUNsQixHQUFHLEVBQUUsd0JBQXdCO2FBQ2hDO1NBQ0osQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRU8sc0JBQXNCLENBQUMsVUFBa0IsRUFBRSxZQUFvQjs7UUFDbkUsTUFBTSxNQUFNLEdBQVEsTUFBTSxDQUFDO1FBRTNCLElBQUksTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsR0FBRywwQ0FBRSxVQUFVLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNuQyxJQUFJLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxDQUFDLEdBQWlCLEVBQUUsTUFBVyxFQUFFLEVBQUU7d0JBQ3hHLElBQUksR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNoQixDQUFDOzZCQUFNLENBQUM7NEJBQ0osT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNwQixDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDYixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxJQUFJLE1BQUEsTUFBTSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLE9BQU8sMENBQUUsT0FBTyxFQUFFLENBQUM7WUFDM0IsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUMsQ0FBQztJQUNsRixDQUFDO0lBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLG9CQUE2QixLQUFLO1FBQzlELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUMzQiw0QkFBNEI7WUFDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUU7Z0JBQ2xFLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1AsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztvQkFDL0QsT0FBTyxDQUFDO3dCQUNKLE9BQU8sRUFBRSxJQUFJO3dCQUNiLElBQUksRUFBRSxTQUFTO3FCQUNsQixDQUFDLENBQUM7Z0JBQ1AsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUFFLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO2dCQUNwQixjQUFjO2dCQUNkLE1BQU0sT0FBTyxHQUFHO29CQUNaLElBQUksRUFBRSxrQkFBa0I7b0JBQ3hCLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFDO2lCQUM1QixDQUFDO2dCQUVGLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRTtvQkFDbEYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFXLEVBQUUsRUFBRTtvQkFDckIsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEdBQUcsQ0FBQyxPQUFPLDBCQUEwQixJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsSCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sY0FBYyxDQUFDLElBQVMsRUFBRSxpQkFBMEI7UUFDeEQsTUFBTSxRQUFRLEdBQVE7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLFFBQVEsRUFBRSxFQUFFO1NBQ2YsQ0FBQztRQUVGLElBQUksaUJBQWlCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3RDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLFNBQVM7Z0JBQ2hDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSTthQUM1RCxDQUFDLENBQUMsQ0FBQztRQUNSLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQixRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUUsQ0FDakQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FDaEQsQ0FBQztRQUNOLENBQUM7UUFFRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFZLEVBQUUsVUFBbUI7UUFDdkQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDakMsSUFBSSxDQUFDO2dCQUNELElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3BDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQztvQkFDdkQsT0FBTztnQkFDWCxDQUFDO2dCQUVELE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQzFDLFlBQVksQ0FBQyxJQUFJLEVBQ2pCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQ3pCLENBQUM7Z0JBRUYsSUFBSSxVQUFVLEtBQUssWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNuQyxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSw0Q0FBNEMsRUFBRSxDQUFDLENBQUM7b0JBQ2pGLE9BQU87Z0JBQ1gsQ0FBQztnQkFFRCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFekQsT0FBTyxDQUFDO29CQUNKLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRTt3QkFDRixNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUk7d0JBQ3pCLElBQUksRUFBRSxVQUFVO3dCQUNoQixPQUFPLEVBQUUsa0JBQWtCLFVBQVUsRUFBRTtxQkFDMUM7aUJBQ0osQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLE9BQU8sS0FBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxLQUFLLENBQUMsVUFBVTtRQUNwQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JELE9BQU8sQ0FBQztvQkFDSixPQUFPLEVBQUUsSUFBSTtvQkFDYixPQUFPLEVBQUUsMkJBQTJCO2lCQUN2QyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFVLEVBQUUsRUFBRTtnQkFDcEIsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWg3QkQsZ0NBZzdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciwgU2NlbmVJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xuXG5leHBvcnQgY2xhc3MgU2NlbmVUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9jdXJyZW50X3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBjdXJyZW50IHNjZW5lIGluZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfc2NlbmVfbGlzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIHNjZW5lcyBpbiB0aGUgcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnb3Blbl9zY2VuZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcGVuIGEgc2NlbmUgYnkgcGF0aCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHNjZW5lIGZpbGUgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc2NlbmVQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzYXZlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY3JlYXRlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBzY2VuZSBhc3NldCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgbmV3IHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIHNhdmUgdGhlIHNjZW5lIChlLmcuLCBkYjovL2Fzc2V0cy9TY2VuZS9OZXdTY2VuZS5maXJlIG9yIGRiOi8vYXNzZXRzL1NjZW5lKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc2NlbmVOYW1lJywgJ3NhdmVQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzYXZlX3NjZW5lX2FzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgc2NlbmUgYXMgbmV3IGZpbGUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIHNhdmUgdGhlIHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGV4cGxpY2l0IHBhdGggb2YgdGhlIGN1cnJlbnQgc2NlbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Nsb3NlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3NlIGN1cnJlbnQgc2NlbmUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9zY2VuZV9oaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHRoZSBjb21wbGV0ZSBoaWVyYXJjaHkgb2YgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjb21wb25lbnQgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfY3VycmVudF9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Q3VycmVudFNjZW5lKCk7XG4gICAgICAgICAgICBjYXNlICdnZXRfc2NlbmVfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0U2NlbmVMaXN0KCk7XG4gICAgICAgICAgICBjYXNlICdvcGVuX3NjZW5lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5vcGVuU2NlbmUoYXJncy5zY2VuZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lKGFyZ3Muc2NlbmVQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlU2NlbmUoYXJncy5zY2VuZU5hbWUsIGFyZ3Muc2F2ZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZV9hcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lQXMoYXJncy5wYXRoLCBhcmdzLnNvdXJjZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnY2xvc2Vfc2NlbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNsb3NlU2NlbmUoKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9zY2VuZV9oaWVyYXJjaHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFNjZW5lSGllcmFyY2h5KGFyZ3MuaW5jbHVkZUNvbXBvbmVudHMpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q3VycmVudFNjZW5lKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g55u05o6l5L2/55SoIHF1ZXJ5LW5vZGUtdHJlZSDmnaXojrflj5blnLrmma/kv6Hmga/vvIjov5nkuKrmlrnms5Xlt7Lnu4/pqozor4Hlj6/nlKjvvIlcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0cmVlICYmIHRyZWUudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdHJlZS5uYW1lIHx8ICdDdXJyZW50IFNjZW5lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB0cmVlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHJlZS50eXBlIHx8ICdjYy5TY2VuZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiB0cmVlLmFjdGl2ZSAhPT0gdW5kZWZpbmVkID8gdHJlZS5hY3RpdmUgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVDb3VudDogdHJlZS5jaGlsZHJlbiA/IHRyZWUuY2hpbGRyZW4ubGVuZ3RoIDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gc2NlbmUgZGF0YSBhdmFpbGFibGUnIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5aSH55So5pa55qGI77ya5L2/55So5Zy65pmv6ISa5pysXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NvY29zLW1jcC1zZXJ2ZXInLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdnZXRDdXJyZW50U2NlbmVJbmZvJyxcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW11cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywgb3B0aW9ucykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRGlyZWN0IEFQSSBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9LCBTY2VuZSBzY3JpcHQgZmFpbGVkOiAke2VycjIubWVzc2FnZX1gIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0U2NlbmVMaXN0KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIGNvbnN0IHBhdHRlcm5zID0gWydkYjovL2Fzc2V0cy8qKi8qLnNjZW5lJywgJ2RiOi8vYXNzZXRzLyoqLyouZmlyZSddO1xuICAgICAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnF1ZXJ5U2NlbmVzVmlhTWVzc2FnZShwYXR0ZXJuKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSB0aGlzLm5vcm1hbGl6ZVNjZW5lUmVzdWx0cyhyZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjZW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBzY2VuZXMgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGBbTWVzc2FnZToke3BhdHRlcm59XSAke2Vycj8ubWVzc2FnZSB8fCBlcnJ9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFsbGJhY2tSZXN1bHRzID0gYXdhaXQgdGhpcy5xdWVyeVNjZW5lc1ZpYUFzc2V0REIocGF0dGVybik7XG4gICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrUmVzdWx0cykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZXMgPSB0aGlzLm5vcm1hbGl6ZVNjZW5lUmVzdWx0cyhmYWxsYmFja1Jlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NlbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHNjZW5lcyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goYFtBc3NldERCOiR7cGF0dGVybn1dICR7ZXJyPy5tZXNzYWdlIHx8IGVycn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JzLmpvaW4oJyB8ICcpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiBbXSxcbiAgICAgICAgICAgIHdhcm5pbmc6ICfmnKrlnKggYXNzZXRzIOebruW9leS4reaJvuWIsCAuc2NlbmUg5oiWIC5maXJlIOWcuuaZr+aWh+S7tidcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U2NlbmVzVmlhTWVzc2FnZShwYXR0ZXJuOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdIHwgbnVsbD4ge1xuICAgICAgICBpZiAoIUVkaXRvci5NZXNzYWdlIHx8ICFFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnLCB7IHBhdHRlcm4gfSk7XG4gICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHJlc3VsdHMpID8gcmVzdWx0cyA6IFtdO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTY2VuZXNWaWFBc3NldERCKHBhdHRlcm46IHN0cmluZyk6IFByb21pc2U8YW55W10gfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ZGIgPSAoRWRpdG9yIGFzIGFueSk/LmFzc2V0ZGI7XG4gICAgICAgIGlmICghYXNzZXRkYiB8fCB0eXBlb2YgYXNzZXRkYi5xdWVyeUFzc2V0cyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAnc2NlbmUnLCAoZXJyOiBFcnJvciwgcmVzdWx0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoQXJyYXkuaXNBcnJheShyZXN1bHRzKSA/IHJlc3VsdHMgOiBbXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBub3JtYWxpemVTY2VuZVJlc3VsdHMocmVzdWx0czogYW55W10pOiBTY2VuZUluZm9bXSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHRzKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHMubWFwKChhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBhc3NldC51cmwgfHwgYXNzZXQucGF0aCB8fCAnJztcbiAgICAgICAgICAgIGNvbnN0IG5hbWVGcm9tVXJsID0gdXJsLnNwbGl0KCcvJykucG9wKCkgfHwgJyc7XG4gICAgICAgICAgICBjb25zdCBjbGVhbk5hbWUgPSAoYXNzZXQubmFtZSB8fCBuYW1lRnJvbVVybCkucmVwbGFjZSgvXFwuKHNjZW5lfGZpcmUpJC9pLCAnJyk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogY2xlYW5OYW1lIHx8IGFzc2V0Lm5hbWUgfHwgJ1VubmFtZWQgU2NlbmUnLFxuICAgICAgICAgICAgICAgIHBhdGg6IHVybCxcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkIHx8IGFzc2V0LmZpbGVJZCB8fCBhc3NldC5maWxlaWQgfHwgJydcbiAgICAgICAgICAgIH0gYXMgU2NlbmVJbmZvO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIG9wZW5TY2VuZShzY2VuZVBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gT3BlbmluZyBzY2VuZTonLCBzY2VuZVBhdGgpO1xuXG4gICAgICAgICAgICAvLyBDb2NvcyBDcmVhdG9yIDIuNC54OiBVc2UgRWRpdG9yLmFzc2V0ZGIgdG8gcXVlcnkgVVVJRFxuICAgICAgICAgICAgY29uc3QgZWRpdG9yOiBhbnkgPSBFZGl0b3I7XG4gICAgICAgICAgICBjb25zdCBhc3NldGRiID0gZWRpdG9yLmFzc2V0ZGIgfHwgZWRpdG9yLnJlbW90ZT8uYXNzZXRkYjtcblxuICAgICAgICAgICAgaWYgKCFhc3NldGRiKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIEVkaXRvci5hc3NldGRiIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnQXNzZXQgZGF0YWJhc2Ugbm90IGF2YWlsYWJsZScgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBRdWVyeWluZyBVVUlEIGZvciBzY2VuZTonLCBzY2VuZVBhdGgpO1xuXG4gICAgICAgICAgICAvLyBNZXRob2QgMTogVHJ5IHVybFRvVXVpZCAoc3luY2hyb25vdXMgbWV0aG9kIGluIG1haW4gcHJvY2VzcylcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGFzc2V0ZGIudXJsVG9VdWlkKHNjZW5lUGF0aCk7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gR290IFVVSUQgdmlhIHVybFRvVXVpZDonLCB1dWlkKTtcblxuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIDIuNC54LCBvcGVuIHNjZW5lIGJ5IHNlbmRpbmcgJ3NjZW5lOm9wZW4tYnktdXVpZCcgbWVzc2FnZSB0byBtYWluIHByb2Nlc3NcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gT3BlbmluZyBzY2VuZSB3aXRoIFVVSUQgdmlhIHNjZW5lOm9wZW4tYnktdXVpZC4uLicpO1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb01haW4oJ3NjZW5lOm9wZW4tYnktdXVpZCcsIHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFdhaXQgYSBiaXQgZm9yIHRoZSBzY2VuZSB0byBvcGVuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gU2NlbmUgb3BlbmVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBTY2VuZSBvcGVuZWQ6ICR7c2NlbmVQYXRofWAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ1tzY2VuZS10b29sc10gdXJsVG9VdWlkIGZhaWxlZDonLCBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWV0aG9kIDI6IFRyeSBxdWVyeVV1aWRCeVVybCAoY2FsbGJhY2stYmFzZWQgbWV0aG9kKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gVHJ5aW5nIHF1ZXJ5VXVpZEJ5VXJsLi4uJyk7XG4gICAgICAgICAgICAgICAgYXNzZXRkYi5xdWVyeVV1aWRCeVVybChzY2VuZVBhdGgsIChlcnI6IEVycm9yIHwgbnVsbCwgdXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgfHwgIXV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBxdWVyeVV1aWRCeVVybCBmYWlsZWQ6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTY2VuZSBub3QgZm91bmQnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gR290IFVVSUQgdmlhIHF1ZXJ5VXVpZEJ5VXJsOicsIHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBPcGVuaW5nIHNjZW5lIHdpdGggVVVJRCB2aWEgc2NlbmU6b3Blbi1ieS11dWlkLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvTWFpbignc2NlbmU6b3Blbi1ieS11dWlkJywgdXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBTY2VuZSBvcGVuZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYFNjZW5lIG9wZW5lZDogJHtzY2VuZVBhdGh9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ldGhvZCAzOiBGYWxsYmFjayAtIHRyeSB0byBmaW5kIHNjZW5lIHVzaW5nIHF1ZXJ5QXNzZXRzXG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBUcnlpbmcgcXVlcnlBc3NldHMgYXMgZmFsbGJhY2suLi4nKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXNzZXRkYi5xdWVyeUFzc2V0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFzc2V0ZGIucXVlcnlBc3NldHMoJ2RiOi8vYXNzZXRzLyoqLyouZmlyZScsIFsnc2NlbmUnXSwgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gcXVlcnlBc3NldHMgZmFpbGVkOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIHF1ZXJ5QXNzZXRzIHJlc3VsdHM6JywgcmVzdWx0cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBtYXRjaGluZyBzY2VuZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZSA9IHJlc3VsdHMuZmluZCgoczogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgcy51cmwgPT09IHNjZW5lUGF0aCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcy5wYXRoID09PSBzY2VuZVBhdGggfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHMucGF0aD8uZW5kc1dpdGgoc2NlbmVQYXRoLnJlcGxhY2UoJ2RiOi8vYXNzZXRzLycsICcnKSlcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gU2NlbmUgbm90IGZvdW5kIGluIHF1ZXJ5QXNzZXRzIHJlc3VsdHMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTY2VuZSBub3QgZm91bmQnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gRm91bmQgc2NlbmU6Jywgc2NlbmUpO1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBPcGVuaW5nIHNjZW5lIHdpdGggVVVJRCB2aWEgc2NlbmU6b3Blbi1ieS11dWlkLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvTWFpbignc2NlbmU6b3Blbi1ieS11dWlkJywgc2NlbmUudXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBTY2VuZSBvcGVuZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYFNjZW5lIG9wZW5lZDogJHtzY2VuZVBhdGh9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBObyBhdmFpbGFibGUgbWV0aG9kIHRvIHF1ZXJ5IHNjZW5lIFVVSUQnKTtcbiAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhdmFpbGFibGUgbWV0aG9kIHRvIHF1ZXJ5IHNjZW5lIFVVSUQnIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZShzY2VuZVBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFNhdmluZyBzY2VuZTonLCBzY2VuZVBhdGggfHwgJ2N1cnJlbnQgc2NlbmUnKTtcblxuICAgICAgICAgICAgLy8gSW4gMi40LngsIHVzZSBzY2VuZSBwYW5lbCdzIHNhdmUtc2NlbmUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgZWRpdG9yOiBhbnkgPSBFZGl0b3I7XG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBzZW5kIHNhdmUtc2NlbmUgbWVzc2FnZSB0byBzY2VuZSBwYW5lbFxuICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9QYW5lbCgnc2NlbmUnLCAnc2NlbmU6c2F2ZS1zY2VuZScsIChlcnI6IEVycm9yIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIEZhaWxlZCB0byBzYXZlIHNjZW5lIHZpYSBwYW5lbDonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBTY2VuZSBzYXZlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdTY2VuZSBzYXZlZCBzdWNjZXNzZnVsbHknIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVNjZW5lKHNjZW5lTmFtZTogc3RyaW5nLCBzYXZlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSB0aGlzLm5vcm1hbGl6ZVNjZW5lU2F2ZVBhdGgoc2NlbmVOYW1lLCBzYXZlUGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVDb250ZW50ID0gdGhpcy5idWlsZENyZWF0b3IyNFNjZW5lQ29udGVudChzY2VuZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZW5kU2NlbmVEYXRhVG9Bc3NldERCKHRhcmdldFBhdGgsIHNjZW5lQ29udGVudCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRTY2VuZUxpc3QoKS50aGVuKChzY2VuZUxpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZWRTY2VuZSA9IHNjZW5lTGlzdC5kYXRhPy5maW5kKChzY2VuZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdD8udXVpZCAmJiBzY2VuZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY2VuZS51dWlkID09PSByZXN1bHQudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjZW5lLnBhdGggPT09IHRhcmdldFBhdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlc3VsdD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiByZXN1bHQ/LnVybCB8fCB0YXJnZXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzY2VuZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY2VuZSAnJHtzY2VuZU5hbWV9JyBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lVmVyaWZpZWQ6ICEhY3JlYXRlZFNjZW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25EYXRhOiBjcmVhdGVkU2NlbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogcmVzdWx0Py51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHJlc3VsdD8udXJsIHx8IHRhcmdldFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFNjZW5lICcke3NjZW5lTmFtZX0nIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5ICh2ZXJpZmljYXRpb24gZmFpbGVkKWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8IFN0cmluZyhlcnIpIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNhbml0aXplU2NlbmVOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSAobmFtZSB8fCAnTmV3IFNjZW5lJykudHJpbSgpO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gdHJpbW1lZC5yZXBsYWNlKC9cXC4oZmlyZXxzY2VuZSkkL2ksICcnKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQgfHwgJ05ldyBTY2VuZSc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbnN1cmVEYlVybChyYXdQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBsZXQgbm9ybWFsaXplZCA9IChyYXdQYXRoIHx8ICcnKS50cmltKCk7XG5cbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NjZW5lIHBhdGggaXMgcmVxdWlyZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblxuICAgICAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKCdkYjovLycpKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJ2Fzc2V0cy8nKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBkYjovLyR7bm9ybWFsaXplZH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGRiOi8vYXNzZXRzJHtub3JtYWxpemVkfWA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYGRiOi8vYXNzZXRzLyR7bm9ybWFsaXplZH1gO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplU2NlbmVTb3VyY2VQYXRoKHJhd1BhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBub3JtYWxpemVkID0gdGhpcy5lbnN1cmVEYlVybChyYXdQYXRoKTtcblxuICAgICAgICBpZiAobm9ybWFsaXplZC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkID0gbm9ybWFsaXplZC5zbGljZSgwLCAtMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb3dlciA9IG5vcm1hbGl6ZWQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGxvd2VyLmVuZHNXaXRoKCcuc2NlbmUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQuc2xpY2UoMCwgLTYpICsgJy5maXJlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbG93ZXIuZW5kc1dpdGgoJy5maXJlJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtub3JtYWxpemVkfS5maXJlYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIHByaXZhdGUgZXh0cmFjdFNjZW5lTmFtZUZyb21QYXRoKHNjZW5lUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCFzY2VuZVBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiAnTmV3IFNjZW5lJztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBzY2VuZVBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoJy8nKTtcbiAgICAgICAgY29uc3QgbGFzdCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdIHx8ICcnO1xuICAgICAgICBjb25zdCB3aXRob3V0RXh0ID0gbGFzdC5yZXBsYWNlKC9cXC4oZmlyZXxzY2VuZSkkL2ksICcnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVTY2VuZU5hbWUod2l0aG91dEV4dCB8fCAnTmV3IFNjZW5lJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ3VycmVudFNjZW5lU291cmNlKHNvdXJjZU92ZXJyaWRlPzogc3RyaW5nKTogUHJvbWlzZTx7IHBhdGg6IHN0cmluZzsgbmFtZTogc3RyaW5nIH0+IHtcbiAgICAgICAgaWYgKHNvdXJjZU92ZXJyaWRlKSB7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkU291cmNlID0gdGhpcy5ub3JtYWxpemVTY2VuZVNvdXJjZVBhdGgoc291cmNlT3ZlcnJpZGUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBub3JtYWxpemVkU291cmNlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuZXh0cmFjdFNjZW5lTmFtZUZyb21QYXRoKG5vcm1hbGl6ZWRTb3VyY2UpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNjZW5lSW5mbzogYW55ID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNjZW5lSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LWN1cnJlbnQtc2NlbmUnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihgW3NjZW5lLXRvb2xzXSBGYWlsZWQgdG8gcXVlcnkgY3VycmVudCBzY2VuZSBpbmZvOiAke2Vycn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByYXdQYXRoID0gc2NlbmVJbmZvPy51cmwgfHwgc2NlbmVJbmZvPy5wYXRoIHx8IHNjZW5lSW5mbz8uZmlsZTtcbiAgICAgICAgbGV0IHNjZW5lTmFtZSA9IHNjZW5lSW5mbz8ubmFtZSB8fCBzY2VuZUluZm8/LnNjZW5lTmFtZTtcblxuICAgICAgICBpZiAoKCFyYXdQYXRoIHx8IHR5cGVvZiByYXdQYXRoICE9PSAnc3RyaW5nJykgJiYgc2NlbmVJbmZvPy51dWlkKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB7IHV1aWQ6IHNjZW5lSW5mby51dWlkIH0pO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmF3UGF0aCA9IGFzc2V0SW5mby51cmwgfHwgYXNzZXRJbmZvLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHNjZW5lTmFtZSA9IHNjZW5lTmFtZSB8fCBhc3NldEluZm8ubmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChhc3NldEVycikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBbc2NlbmUtdG9vbHNdIEZhaWxlZCB0byBxdWVyeSBhc3NldCBpbmZvIGZvciBzY2VuZSB1dWlkICR7c2NlbmVJbmZvLnV1aWR9OiAke2Fzc2V0RXJyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyYXdQYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZXRlcm1pbmUgY3VycmVudCBzY2VuZSBwYXRoLiBQbGVhc2UgcHJvdmlkZSBzb3VyY2VQYXRoIGV4cGxpY2l0bHkuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub3JtYWxpemVkU291cmNlID0gdGhpcy5ub3JtYWxpemVTY2VuZVNvdXJjZVBhdGgocmF3UGF0aCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwYXRoOiBub3JtYWxpemVkU291cmNlLFxuICAgICAgICAgICAgbmFtZTogc2NlbmVOYW1lIHx8IHRoaXMuZXh0cmFjdFNjZW5lTmFtZUZyb21QYXRoKG5vcm1hbGl6ZWRTb3VyY2UpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtb3ZlU2NlbmVBc3NldChzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yOiBhbnkgPSBFZGl0b3I7XG5cbiAgICAgICAgICAgIGlmIChlZGl0b3I/LklwYz8uc2VuZFRvTWFpbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvTWFpbignYXNzZXQtZGI6bW92ZS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0LCAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoRWRpdG9yPy5NZXNzYWdlPy5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0KS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdBc3NldCBkYXRhYmFzZSBpbnRlcmZhY2UgaXMgbm90IGF2YWlsYWJsZScpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBub3JtYWxpemVTY2VuZVNhdmVQYXRoKHNjZW5lTmFtZTogc3RyaW5nLCByYXdTYXZlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgc2FuaXRpemVkTmFtZSA9IHRoaXMuc2FuaXRpemVTY2VuZU5hbWUoc2NlbmVOYW1lKTtcbiAgICAgICAgbGV0IG5vcm1hbGl6ZWQgPSAocmF3U2F2ZVBhdGggfHwgJycpLnRyaW0oKTtcblxuICAgICAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2F2ZVBhdGggaXMgcmVxdWlyZWQgdG8gY3JlYXRlIGEgc2NlbmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgY29uc3QgbG93ZXIgPSBub3JtYWxpemVkLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgaWYgKGxvd2VyLmVuZHNXaXRoKCcuc2NlbmUnKSkge1xuICAgICAgICAgICAgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQuc2xpY2UoMCwgLTYpICsgJy5maXJlJztcbiAgICAgICAgfSBlbHNlIGlmICghbG93ZXIuZW5kc1dpdGgoJy5maXJlJykpIHtcbiAgICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IG5vcm1hbGl6ZWQuZW5kc1dpdGgoJy8nKSA/ICcnIDogJy8nO1xuICAgICAgICAgICAgbm9ybWFsaXplZCA9IGAke25vcm1hbGl6ZWR9JHtzdWZmaXh9JHtzYW5pdGl6ZWROYW1lfS5maXJlYDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIHByaXZhdGUgYnVpbGRDcmVhdG9yMjRTY2VuZUNvbnRlbnQoc2NlbmVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBzYW5pdGl6ZWROYW1lID0gdGhpcy5zYW5pdGl6ZVNjZW5lTmFtZShzY2VuZU5hbWUpO1xuICAgICAgICBjb25zdCBzY2VuZVRlbXBsYXRlOiBhbnlbXSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlNjZW5lQXNzZXQnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiBzYW5pdGl6ZWROYW1lLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfbmF0aXZlOiAnJyxcbiAgICAgICAgICAgICAgICBzY2VuZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2NlbmUnLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiBudWxsLFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW10sXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcbiAgICAgICAgICAgICAgICBfb3BhY2l0eTogMjU1LFxuICAgICAgICAgICAgICAgIF9jb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMjU1LFxuICAgICAgICAgICAgICAgICAgICBnOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfY29udGVudFNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TaXplJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2FuY2hvclBvaW50OiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMicsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF90cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdUeXBlZEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgY3RvcjogJ0Zsb2F0NjRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGFycmF5OiBbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMSwgMSwgMV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9pczNETm9kZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIGF1dG9SZWxlYXNlQXNzZXRzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBfaWQ6ICczMjQyNDdlOC1jNTg0LTQ5NWQtODdiMy0wMTVhNjlmZWU0NDQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuTm9kZScsXG4gICAgICAgICAgICAgICAgX25hbWU6ICdDYW52YXMnLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiB7XG4gICAgICAgICAgICAgICAgICAgIF9faWRfXzogMVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9faWRfXzogM1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBfYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9jb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9faWRfXzogNVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDZcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcbiAgICAgICAgICAgICAgICBfb3BhY2l0eTogMjU1LFxuICAgICAgICAgICAgICAgIF9jb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMjU1LFxuICAgICAgICAgICAgICAgICAgICBnOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfY29udGVudFNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TaXplJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDk2MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hbmNob3JQb2ludDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzInLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAuNVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3Ryczoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ1R5cGVkQXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBjdG9yOiAnRmxvYXQ2NEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgYXJyYXk6IFs0ODAsIDMyMCwgMCwgMCwgMCwgMCwgMSwgMSwgMSwgMV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9ldWxlckFuZ2xlczoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzMnLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgICB6OiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfc2tld1g6IDAsXG4gICAgICAgICAgICAgICAgX3NrZXdZOiAwLFxuICAgICAgICAgICAgICAgIF9pczNETm9kZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgX2dyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBfaWQ6ICdhNWVzWnUrNDVMQTVtQnB2dHRzcFBEJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLk5vZGUnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnTWFpbiBDYW1lcmEnLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBfcGFyZW50OiB7XG4gICAgICAgICAgICAgICAgICAgIF9faWRfXzogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NoaWxkcmVuOiBbXSxcbiAgICAgICAgICAgICAgICBfYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9jb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9faWRfXzogNFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBfcHJlZmFiOiBudWxsLFxuICAgICAgICAgICAgICAgIF9vcGFjaXR5OiAyNTUsXG4gICAgICAgICAgICAgICAgX2NvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuQ29sb3InLFxuICAgICAgICAgICAgICAgICAgICByOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGc6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYjogMjU1LFxuICAgICAgICAgICAgICAgICAgICBhOiAyNTVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9jb250ZW50U2l6ZToge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlNpemUnLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogOTYwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDY0MFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2FuY2hvclBvaW50OiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMicsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAuNSxcbiAgICAgICAgICAgICAgICAgICAgeTogMC41XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfdHJzOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnVHlwZWRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGN0b3I6ICdGbG9hdDY0QXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBhcnJheTogWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZXVsZXJBbmdsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMzJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICAgICAgejogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3NrZXdYOiAwLFxuICAgICAgICAgICAgICAgIF9za2V3WTogMCxcbiAgICAgICAgICAgICAgICBfaXMzRE5vZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9ncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgX2lkOiAnZTFXb0ZyUTc5RzdyNFp1UUUzSGxOYidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5DYW1lcmEnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgbm9kZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9jdWxsaW5nTWFzazogNDI5NDk2NzI5NSxcbiAgICAgICAgICAgICAgICBfY2xlYXJGbGFnczogNyxcbiAgICAgICAgICAgICAgICBfYmFja2dyb3VuZENvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuQ29sb3InLFxuICAgICAgICAgICAgICAgICAgICByOiAwLFxuICAgICAgICAgICAgICAgICAgICBnOiAwLFxuICAgICAgICAgICAgICAgICAgICBiOiAwLFxuICAgICAgICAgICAgICAgICAgICBhOiAyNTVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9kZXB0aDogLTEsXG4gICAgICAgICAgICAgICAgX3pvb21SYXRpbzogMSxcbiAgICAgICAgICAgICAgICBfdGFyZ2V0VGV4dHVyZTogbnVsbCxcbiAgICAgICAgICAgICAgICBfZm92OiA2MCxcbiAgICAgICAgICAgICAgICBfb3J0aG9TaXplOiAxMCxcbiAgICAgICAgICAgICAgICBfbmVhckNsaXA6IDEsXG4gICAgICAgICAgICAgICAgX2ZhckNsaXA6IDQwOTYsXG4gICAgICAgICAgICAgICAgX29ydGhvOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9yZWN0OiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuUmVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAxLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9yZW5kZXJTdGFnZXM6IDEsXG4gICAgICAgICAgICAgICAgX2FsaWduV2l0aFNjcmVlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaWQ6ICc4MUdOM3VYSU5LVkxlVzQraUtTbGltJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNhbnZhcycsXG4gICAgICAgICAgICAgICAgX25hbWU6ICcnLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBub2RlOiB7XG4gICAgICAgICAgICAgICAgICAgIF9faWRfXzogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2Rlc2lnblJlc29sdXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TaXplJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDk2MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9maXRXaWR0aDogZmFsc2UsXG4gICAgICAgICAgICAgICAgX2ZpdEhlaWdodDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaWQ6ICc1OUNkMG92YmRGNGJ5dzVzYmpKRHg3J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLldpZGdldCcsXG4gICAgICAgICAgICAgICAgX25hbWU6ICcnLFxuICAgICAgICAgICAgICAgIF9vYmpGbGFnczogMCxcbiAgICAgICAgICAgICAgICBub2RlOiB7XG4gICAgICAgICAgICAgICAgICAgIF9faWRfXzogMlxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2VuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgYWxpZ25Nb2RlOiAxLFxuICAgICAgICAgICAgICAgIF90YXJnZXQ6IG51bGwsXG4gICAgICAgICAgICAgICAgX2FsaWduRmxhZ3M6IDQ1LFxuICAgICAgICAgICAgICAgIF9sZWZ0OiAwLFxuICAgICAgICAgICAgICAgIF9yaWdodDogMCxcbiAgICAgICAgICAgICAgICBfdG9wOiAwLFxuICAgICAgICAgICAgICAgIF9ib3R0b206IDAsXG4gICAgICAgICAgICAgICAgX3ZlcnRpY2FsQ2VudGVyOiAwLFxuICAgICAgICAgICAgICAgIF9ob3Jpem9udGFsQ2VudGVyOiAwLFxuICAgICAgICAgICAgICAgIF9pc0Fic0xlZnQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2lzQWJzUmlnaHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2lzQWJzVG9wOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic0JvdHRvbTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNIb3Jpem9udGFsQ2VudGVyOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1ZlcnRpY2FsQ2VudGVyOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9vcmlnaW5hbFdpZHRoOiAwLFxuICAgICAgICAgICAgICAgIF9vcmlnaW5hbEhlaWdodDogMCxcbiAgICAgICAgICAgICAgICBfaWQ6ICcyOXpYYm9pWEZCS29JVjRQUTJsaVRlJ1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzY2VuZVRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNlbmRTY2VuZURhdGFUb0Fzc2V0REIodGFyZ2V0UGF0aDogc3RyaW5nLCBzY2VuZUNvbnRlbnQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuXG4gICAgICAgIGlmIChlZGl0b3I/LklwYz8uc2VuZFRvTWFpbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb01haW4oJ2Fzc2V0LWRiOmNyZWF0ZS1hc3NldCcsIHRhcmdldFBhdGgsIHNjZW5lQ29udGVudCwgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWRpdG9yPy5NZXNzYWdlPy5yZXF1ZXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgdGFyZ2V0UGF0aCwgc2NlbmVDb250ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0Fzc2V0IGRhdGFiYXNlIGludGVyZmFjZSBpcyBub3QgYXZhaWxhYmxlJykpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0U2NlbmVIaWVyYXJjaHkoaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8g5LyY5YWI5bCd6K+V5L2/55SoIEVkaXRvciBBUEkg5p+l6K+i5Zy65pmv6IqC54K55qCRXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHJlZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSB0aGlzLmJ1aWxkSGllcmFyY2h5KHRyZWUsIGluY2x1ZGVDb21wb25lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogaGllcmFyY2h5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBzY2VuZSBoaWVyYXJjaHkgYXZhaWxhYmxlJyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIOWkh+eUqOaWueahiO+8muS9v+eUqOWcuuaZr+iEmuacrFxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1tY3Atc2VydmVyJyxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnZ2V0U2NlbmVIaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbaW5jbHVkZUNvbXBvbmVudHNdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIG9wdGlvbnMpLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyMjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYERpcmVjdCBBUEkgZmFpbGVkOiAke2Vyci5tZXNzYWdlfSwgU2NlbmUgc2NyaXB0IGZhaWxlZDogJHtlcnIyLm1lc3NhZ2V9YCB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkSGllcmFyY2h5KG5vZGU6IGFueSwgaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4pOiBhbnkge1xuICAgICAgICBjb25zdCBub2RlSW5mbzogYW55ID0ge1xuICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpbmNsdWRlQ29tcG9uZW50cyAmJiBub2RlLl9fY29tcHNfXykge1xuICAgICAgICAgICAgbm9kZUluZm8uY29tcG9uZW50cyA9IG5vZGUuX19jb21wc19fLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgIHR5cGU6IGNvbXAuX190eXBlX18gfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcC5lbmFibGVkIDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIG5vZGVJbmZvLmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IFxuICAgICAgICAgICAgICAgIHRoaXMuYnVpbGRIaWVyYXJjaHkoY2hpbGQsIGluY2x1ZGVDb21wb25lbnRzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlSW5mbztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTY2VuZUFzKHBhdGg6IHN0cmluZywgc291cmNlUGF0aD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGggfHwgdHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdwYXRoIGlzIHJlcXVpcmVkJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY2VuZSA9IGF3YWl0IHRoaXMucmVzb2x2ZUN1cnJlbnRTY2VuZVNvdXJjZShzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXRQYXRoID0gdGhpcy5ub3JtYWxpemVTY2VuZVNhdmVQYXRoKFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnN1cmVEYlVybChwYXRoKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0UGF0aCA9PT0gY3VycmVudFNjZW5lLnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NvdXJjZSBhbmQgZGVzdGluYXRpb24gcGF0aHMgYXJlIGlkZW50aWNhbCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm1vdmVTY2VuZUFzc2V0KGN1cnJlbnRTY2VuZS5wYXRoLCB0YXJnZXRQYXRoKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGN1cnJlbnRTY2VuZS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogdGFyZ2V0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY2VuZSBtb3ZlZCB0byAke3RhcmdldFBhdGh9YFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjbG9zZVNjZW5lKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2xvc2Utc2NlbmUnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1NjZW5lIGNsb3NlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==
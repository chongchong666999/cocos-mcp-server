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
        try {
            const tree = await this.requestSceneTreeData();
            const root = Array.isArray(tree) ? tree[0] : tree;
            if (root && root.uuid) {
                return {
                    success: true,
                    data: {
                        name: root.name || 'Current Scene',
                        uuid: root.uuid,
                        type: root.type || 'cc.Scene',
                        active: root.active !== undefined ? root.active : true,
                        nodeCount: root.children ? root.children.length : 0
                    }
                };
            }
        }
        catch (err) {
            logger_1.default.warn(`[scene-tools] requestSceneTreeData failed: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        try {
            const result = await this.callSceneScript('getCurrentSceneInfo');
            return result;
        }
        catch (err) {
            return {
                success: false,
                error: (err === null || err === void 0 ? void 0 : err.message) || String(err)
            };
        }
    }
    async getSceneList() {
        const patterns = ['db://assets/**/*.scene', 'db://assets/**/*.fire'];
        const errors = [];
        const assetdb = this.getAssetDB();
        if (!assetdb) {
            return {
                success: false,
                error: 'Asset database not available'
            };
        }
        for (const pattern of patterns) {
            try {
                const results = await this.queryScenesViaAssetDB(assetdb, pattern);
                if (results) {
                    const scenes = this.normalizeSceneResults(results);
                    if (scenes.length > 0) {
                        return { success: true, data: scenes };
                    }
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
    async queryScenesViaAssetDB(assetdb, pattern) {
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
        const assetdb = this.getAssetDB();
        if (!assetdb) {
            throw new Error('Asset database not available');
        }
        let sceneInfo = null;
        try {
            sceneInfo = await this.callSceneScript('getCurrentSceneInfo');
        }
        catch (err) {
            logger_1.default.warn(`[scene-tools] Failed to query current scene info via script: ${err}`);
        }
        const sceneData = (sceneInfo === null || sceneInfo === void 0 ? void 0 : sceneInfo.data) || sceneInfo;
        const sceneUuid = sceneData === null || sceneData === void 0 ? void 0 : sceneData.uuid;
        let sceneName = sceneData === null || sceneData === void 0 ? void 0 : sceneData.name;
        if (!sceneUuid) {
            throw new Error('Unable to determine current scene UUID. Please provide sourcePath explicitly.');
        }
        let rawPath = null;
        if (typeof assetdb.uuidToUrl === 'function') {
            try {
                rawPath = assetdb.uuidToUrl(sceneUuid);
            }
            catch (err) {
                logger_1.default.warn(`[scene-tools] uuidToUrl failed for ${sceneUuid}: ${err}`);
            }
        }
        if (!rawPath && typeof assetdb.queryInfoByUuid === 'function') {
            try {
                const info = await this.queryAssetInfoByUuid(assetdb, sceneUuid);
                rawPath = (info === null || info === void 0 ? void 0 : info.url) || (info === null || info === void 0 ? void 0 : info.path) || rawPath;
                sceneName = sceneName || (info === null || info === void 0 ? void 0 : info.name);
            }
            catch (assetErr) {
                logger_1.default.warn(`[scene-tools] Failed to query asset info for scene uuid ${sceneUuid}: ${assetErr}`);
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
            var _a;
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
        var _a;
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
        return Promise.reject(new Error('Asset database interface is not available'));
    }
    async getSceneHierarchy(includeComponents = false) {
        try {
            const tree = await this.requestSceneTreeData(includeComponents);
            if (!tree) {
                return { success: false, error: 'No scene hierarchy available' };
            }
            const rootNode = Array.isArray(tree)
                ? {
                    uuid: 'scene-root',
                    name: 'Scene',
                    type: 'cc.Scene',
                    active: true,
                    children: tree
                }
                : tree;
            const hierarchy = this.buildHierarchy(rootNode, includeComponents);
            return {
                success: true,
                data: hierarchy
            };
        }
        catch (err) {
            return {
                success: false,
                error: (err === null || err === void 0 ? void 0 : err.message) || String(err)
            };
        }
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
        try {
            await this.sendToScenePanel('scene:close-scene');
            return {
                success: true,
                message: 'Scene closed successfully'
            };
        }
        catch (err) {
            return {
                success: false,
                error: (err === null || err === void 0 ? void 0 : err.message) || String(err)
            };
        }
    }
    getAssetDB() {
        var _a;
        const editor = Editor;
        return (editor === null || editor === void 0 ? void 0 : editor.assetdb) || ((_a = editor === null || editor === void 0 ? void 0 : editor.remote) === null || _a === void 0 ? void 0 : _a.assetdb);
    }
    async queryAssetInfoByUuid(assetdb, uuid) {
        if (!assetdb || typeof assetdb.queryInfoByUuid !== 'function') {
            return null;
        }
        return new Promise((resolve, reject) => {
            assetdb.queryInfoByUuid(uuid, (err, info) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(info || null);
                }
            });
        });
    }
    async sendToScenePanel(message, ...args) {
        var _a;
        const editor = Editor;
        if (!((_a = editor === null || editor === void 0 ? void 0 : editor.Ipc) === null || _a === void 0 ? void 0 : _a.sendToPanel)) {
            throw new Error('Editor.Ipc.sendToPanel 不可用');
        }
        return new Promise((resolve, reject) => {
            const callback = (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            };
            try {
                editor.Ipc.sendToPanel('scene', message, ...args, callback);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async callSceneScript(method, args = []) {
        var _a;
        const editor = Editor;
        if (!((_a = editor === null || editor === void 0 ? void 0 : editor.Scene) === null || _a === void 0 ? void 0 : _a.callSceneScript)) {
            throw new Error('Editor.Scene.callSceneScript 不可用');
        }
        return new Promise((resolve, reject) => {
            try {
                editor.Scene.callSceneScript('cocos-mcp-server', method, ...args, (err, result) => {
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
    async requestSceneTreeData(includeComponents = false) {
        const errors = [];
        try {
            const tree = await this.sendToScenePanel('scene:query-hierarchy');
            if (tree) {
                if (!includeComponents || this.treeHasComponentData(tree)) {
                    return tree;
                }
            }
        }
        catch (err) {
            errors.push(`scene:query-hierarchy ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        try {
            const result = await this.callSceneScript('getSceneTreeData');
            if ((result === null || result === void 0 ? void 0 : result.success) && result.data) {
                return result.data;
            }
            return result;
        }
        catch (err) {
            errors.push(`getSceneTreeData ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        throw new Error(errors.join(' | ') || 'Failed to query scene tree');
    }
    treeHasComponentData(tree) {
        if (!tree) {
            return false;
        }
        const nodes = Array.isArray(tree) ? tree : [tree];
        const stack = [...nodes];
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) {
                continue;
            }
            if (node.__comps__ || node.components) {
                return true;
            }
            if (Array.isArray(node.children)) {
                stack.push(...node.children);
            }
        }
        return false;
    }
}
exports.SceneTools = SceneTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdG9vbHMvc2NlbmUtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsNkRBQXFDO0FBRXJDLE1BQWEsVUFBVTtJQUNuQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsRUFBRTtpQkFDakI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxZQUFZO2dCQUNsQixXQUFXLEVBQUUsc0JBQXNCO2dCQUNuQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFNBQVMsRUFBRTs0QkFDUCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUscUJBQXFCO3lCQUNyQztxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLG9CQUFvQjtnQkFDakMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxR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LElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNSLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBRXpCLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN0QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNSLFNBQVM7WUFDYixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7Q0FDSjtBQW5pQ0QsZ0NBbWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciwgU2NlbmVJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IGxvZ2dlciBmcm9tICcuLi91dGlscy9sb2dnZXInO1xuXG5leHBvcnQgY2xhc3MgU2NlbmVUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9jdXJyZW50X3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBjdXJyZW50IHNjZW5lIGluZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfc2NlbmVfbGlzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIHNjZW5lcyBpbiB0aGUgcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnb3Blbl9zY2VuZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcGVuIGEgc2NlbmUgYnkgcGF0aCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHNjZW5lIGZpbGUgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc2NlbmVQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzYXZlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY3JlYXRlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBzY2VuZSBhc3NldCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lTmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgbmV3IHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIHNhdmUgdGhlIHNjZW5lIChlLmcuLCBkYjovL2Fzc2V0cy9TY2VuZS9OZXdTY2VuZS5maXJlIG9yIGRiOi8vYXNzZXRzL1NjZW5lKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc2NlbmVOYW1lJywgJ3NhdmVQYXRoJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzYXZlX3NjZW5lX2FzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgc2NlbmUgYXMgbmV3IGZpbGUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIHNhdmUgdGhlIHNjZW5lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGV4cGxpY2l0IHBhdGggb2YgdGhlIGN1cnJlbnQgc2NlbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Nsb3NlX3NjZW5lJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Nsb3NlIGN1cnJlbnQgc2NlbmUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9zY2VuZV9oaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHRoZSBjb21wbGV0ZSBoaWVyYXJjaHkgb2YgY3VycmVudCBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVDb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjb21wb25lbnQgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfY3VycmVudF9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Q3VycmVudFNjZW5lKCk7XG4gICAgICAgICAgICBjYXNlICdnZXRfc2NlbmVfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0U2NlbmVMaXN0KCk7XG4gICAgICAgICAgICBjYXNlICdvcGVuX3NjZW5lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5vcGVuU2NlbmUoYXJncy5zY2VuZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lKGFyZ3Muc2NlbmVQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2NyZWF0ZV9zY2VuZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlU2NlbmUoYXJncy5zY2VuZU5hbWUsIGFyZ3Muc2F2ZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9zY2VuZV9hcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZVNjZW5lQXMoYXJncy5wYXRoLCBhcmdzLnNvdXJjZVBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnY2xvc2Vfc2NlbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNsb3NlU2NlbmUoKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9zY2VuZV9oaWVyYXJjaHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFNjZW5lSGllcmFyY2h5KGFyZ3MuaW5jbHVkZUNvbXBvbmVudHMpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q3VycmVudFNjZW5lKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0cmVlID0gYXdhaXQgdGhpcy5yZXF1ZXN0U2NlbmVUcmVlRGF0YSgpO1xuICAgICAgICAgICAgY29uc3Qgcm9vdCA9IEFycmF5LmlzQXJyYXkodHJlZSkgPyB0cmVlWzBdIDogdHJlZTtcblxuICAgICAgICAgICAgaWYgKHJvb3QgJiYgcm9vdC51dWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcm9vdC5uYW1lIHx8ICdDdXJyZW50IFNjZW5lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJvb3QudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHJvb3QudHlwZSB8fCAnY2MuU2NlbmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiByb290LmFjdGl2ZSAhPT0gdW5kZWZpbmVkID8gcm9vdC5hY3RpdmUgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiByb290LmNoaWxkcmVuID8gcm9vdC5jaGlsZHJlbi5sZW5ndGggOiAwXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgbG9nZ2VyLndhcm4oYFtzY2VuZS10b29sc10gcmVxdWVzdFNjZW5lVHJlZURhdGEgZmFpbGVkOiAke2Vycj8ubWVzc2FnZSB8fCBlcnJ9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldEN1cnJlbnRTY2VuZUluZm8nKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnI/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycilcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFNjZW5lTGlzdCgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IFsnZGI6Ly9hc3NldHMvKiovKi5zY2VuZScsICdkYjovL2Fzc2V0cy8qKi8qLmZpcmUnXTtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBhc3NldGRiID0gdGhpcy5nZXRBc3NldERCKCk7XG5cbiAgICAgICAgaWYgKCFhc3NldGRiKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiAnQXNzZXQgZGF0YWJhc2Ugbm90IGF2YWlsYWJsZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMucXVlcnlTY2VuZXNWaWFBc3NldERCKGFzc2V0ZGIsIHBhdHRlcm4pO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lcyA9IHRoaXMubm9ybWFsaXplU2NlbmVSZXN1bHRzKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NlbmVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHNjZW5lcyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgW0Fzc2V0REI6JHtwYXR0ZXJufV0gJHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcnMuam9pbignIHwgJylcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IFtdLFxuICAgICAgICAgICAgd2FybmluZzogJ+acquWcqCBhc3NldHMg55uu5b2V5Lit5om+5YiwIC5zY2VuZSDmiJYgLmZpcmUg5Zy65pmv5paH5Lu2J1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTY2VuZXNWaWFBc3NldERCKGFzc2V0ZGI6IGFueSwgcGF0dGVybjogc3RyaW5nKTogUHJvbWlzZTxhbnlbXSB8IG51bGw+IHtcbiAgICAgICAgaWYgKCFhc3NldGRiIHx8IHR5cGVvZiBhc3NldGRiLnF1ZXJ5QXNzZXRzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBhc3NldGRiLnF1ZXJ5QXNzZXRzKHBhdHRlcm4sICdzY2VuZScsIChlcnI6IEVycm9yLCByZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShBcnJheS5pc0FycmF5KHJlc3VsdHMpID8gcmVzdWx0cyA6IFtdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG5vcm1hbGl6ZVNjZW5lUmVzdWx0cyhyZXN1bHRzOiBhbnlbXSk6IFNjZW5lSW5mb1tdIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cy5tYXAoKGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGFzc2V0LnVybCB8fCBhc3NldC5wYXRoIHx8ICcnO1xuICAgICAgICAgICAgY29uc3QgbmFtZUZyb21VcmwgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKSB8fCAnJztcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuTmFtZSA9IChhc3NldC5uYW1lIHx8IG5hbWVGcm9tVXJsKS5yZXBsYWNlKC9cXC4oc2NlbmV8ZmlyZSkkL2ksICcnKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBjbGVhbk5hbWUgfHwgYXNzZXQubmFtZSB8fCAnVW5uYW1lZCBTY2VuZScsXG4gICAgICAgICAgICAgICAgcGF0aDogdXJsLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQgfHwgYXNzZXQuZmlsZUlkIHx8IGFzc2V0LmZpbGVpZCB8fCAnJ1xuICAgICAgICAgICAgfSBhcyBTY2VuZUluZm87XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgb3BlblNjZW5lKHNjZW5lUGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBPcGVuaW5nIHNjZW5lOicsIHNjZW5lUGF0aCk7XG5cbiAgICAgICAgICAgIC8vIENvY29zIENyZWF0b3IgMi40Lng6IFVzZSBFZGl0b3IuYXNzZXRkYiB0byBxdWVyeSBVVUlEXG4gICAgICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ZGIgPSBlZGl0b3IuYXNzZXRkYiB8fCBlZGl0b3IucmVtb3RlPy5hc3NldGRiO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0ZGIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gRWRpdG9yLmFzc2V0ZGIgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdBc3NldCBkYXRhYmFzZSBub3QgYXZhaWxhYmxlJyB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFF1ZXJ5aW5nIFVVSUQgZm9yIHNjZW5lOicsIHNjZW5lUGF0aCk7XG5cbiAgICAgICAgICAgIC8vIE1ldGhvZCAxOiBUcnkgdXJsVG9VdWlkIChzeW5jaHJvbm91cyBtZXRob2QgaW4gbWFpbiBwcm9jZXNzKVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXNzZXRkYi51cmxUb1V1aWQoc2NlbmVQYXRoKTtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBHb3QgVVVJRCB2aWEgdXJsVG9VdWlkOicsIHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi40LngsIG9wZW4gc2NlbmUgYnkgc2VuZGluZyAnc2NlbmU6b3Blbi1ieS11dWlkJyBtZXNzYWdlIHRvIG1haW4gcHJvY2Vzc1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBPcGVuaW5nIHNjZW5lIHdpdGggVVVJRCB2aWEgc2NlbmU6b3Blbi1ieS11dWlkLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvTWFpbignc2NlbmU6b3Blbi1ieS11dWlkJywgdXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV2FpdCBhIGJpdCBmb3IgdGhlIHNjZW5lIHRvIG9wZW5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBTY2VuZSBvcGVuZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYFNjZW5lIG9wZW5lZDogJHtzY2VuZVBhdGh9YCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignW3NjZW5lLXRvb2xzXSB1cmxUb1V1aWQgZmFpbGVkOicsIGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNZXRob2QgMjogVHJ5IHF1ZXJ5VXVpZEJ5VXJsIChjYWxsYmFjay1iYXNlZCBtZXRob2QpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzc2V0ZGIucXVlcnlVdWlkQnlVcmwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBUcnlpbmcgcXVlcnlVdWlkQnlVcmwuLi4nKTtcbiAgICAgICAgICAgICAgICBhc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsKHNjZW5lUGF0aCwgKGVycjogRXJyb3IgfCBudWxsLCB1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIHF1ZXJ5VXVpZEJ5VXJsIGZhaWxlZDonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NjZW5lIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBHb3QgVVVJRCB2aWEgcXVlcnlVdWlkQnlVcmw6JywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIE9wZW5pbmcgc2NlbmUgd2l0aCBVVUlEIHZpYSBzY2VuZTpvcGVuLWJ5LXV1aWQuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9NYWluKCdzY2VuZTpvcGVuLWJ5LXV1aWQnLCB1dWlkKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFNjZW5lIG9wZW5lZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgU2NlbmUgb3BlbmVkOiAke3NjZW5lUGF0aH1gIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWV0aG9kIDM6IEZhbGxiYWNrIC0gdHJ5IHRvIGZpbmQgc2NlbmUgdXNpbmcgcXVlcnlBc3NldHNcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFRyeWluZyBxdWVyeUFzc2V0cyBhcyBmYWxsYmFjay4uLicpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnF1ZXJ5QXNzZXRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXNzZXRkYi5xdWVyeUFzc2V0cygnZGI6Ly9hc3NldHMvKiovKi5maXJlJywgWydzY2VuZSddLCAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdHM6IGFueVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBxdWVyeUFzc2V0cyBmYWlsZWQ6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gcXVlcnlBc3NldHMgcmVzdWx0czonLCByZXN1bHRzKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIG1hdGNoaW5nIHNjZW5lXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gcmVzdWx0cy5maW5kKChzOiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBzLnVybCA9PT0gc2NlbmVQYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBzLnBhdGggPT09IHNjZW5lUGF0aCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcy5wYXRoPy5lbmRzV2l0aChzY2VuZVBhdGgucmVwbGFjZSgnZGI6Ly9hc3NldHMvJywgJycpKVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignW3NjZW5lLXRvb2xzXSBTY2VuZSBub3QgZm91bmQgaW4gcXVlcnlBc3NldHMgcmVzdWx0cycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1NjZW5lIG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3NjZW5lLXRvb2xzXSBGb3VuZCBzY2VuZTonLCBzY2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIE9wZW5pbmcgc2NlbmUgd2l0aCBVVUlEIHZpYSBzY2VuZTpvcGVuLWJ5LXV1aWQuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9NYWluKCdzY2VuZTpvcGVuLWJ5LXV1aWQnLCBzY2VuZS51dWlkKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFNjZW5lIG9wZW5lZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBgU2NlbmUgb3BlbmVkOiAke3NjZW5lUGF0aH1gIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdbc2NlbmUtdG9vbHNdIE5vIGF2YWlsYWJsZSBtZXRob2QgdG8gcXVlcnkgc2NlbmUgVVVJRCcpO1xuICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGF2YWlsYWJsZSBtZXRob2QgdG8gcXVlcnkgc2NlbmUgVVVJRCcgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZVNjZW5lKHNjZW5lUGF0aD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1tzY2VuZS10b29sc10gU2F2aW5nIHNjZW5lOicsIHNjZW5lUGF0aCB8fCAnY3VycmVudCBzY2VuZScpO1xuXG4gICAgICAgICAgICAvLyBJbiAyLjQueCwgdXNlIHNjZW5lIHBhbmVsJ3Mgc2F2ZS1zY2VuZSBtZXNzYWdlXG4gICAgICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcblxuICAgICAgICAgICAgLy8gVHJ5IHRvIHNlbmQgc2F2ZS1zY2VuZSBtZXNzYWdlIHRvIHNjZW5lIHBhbmVsXG4gICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsICdzY2VuZTpzYXZlLXNjZW5lJywgKGVycjogRXJyb3IgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1tzY2VuZS10b29sc10gRmFpbGVkIHRvIHNhdmUgc2NlbmUgdmlhIHBhbmVsOicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbc2NlbmUtdG9vbHNdIFNjZW5lIHNhdmVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ1NjZW5lIHNhdmVkIHN1Y2Nlc3NmdWxseScgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlU2NlbmUoc2NlbmVOYW1lOiBzdHJpbmcsIHNhdmVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHRoaXMubm9ybWFsaXplU2NlbmVTYXZlUGF0aChzY2VuZU5hbWUsIHNhdmVQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzY2VuZUNvbnRlbnQgPSB0aGlzLmJ1aWxkQ3JlYXRvcjI0U2NlbmVDb250ZW50KHNjZW5lTmFtZSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNlbmRTY2VuZURhdGFUb0Fzc2V0REIodGFyZ2V0UGF0aCwgc2NlbmVDb250ZW50KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFNjZW5lTGlzdCgpLnRoZW4oKHNjZW5lTGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlZFNjZW5lID0gc2NlbmVMaXN0LmRhdGE/LmZpbmQoKHNjZW5lOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py51dWlkICYmIHNjZW5lLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjZW5lLnV1aWQgPT09IHJlc3VsdC51dWlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NlbmUucGF0aCA9PT0gdGFyZ2V0UGF0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogcmVzdWx0Py51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHJlc3VsdD8udXJsIHx8IHRhcmdldFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNjZW5lTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFNjZW5lICcke3NjZW5lTmFtZX0nIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVWZXJpZmllZDogISFjcmVhdGVkU2NlbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbkRhdGE6IGNyZWF0ZWRTY2VuZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiByZXN1bHQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcmVzdWx0Py51cmwgfHwgdGFyZ2V0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU2NlbmUgJyR7c2NlbmVOYW1lfScgY3JlYXRlZCBzdWNjZXNzZnVsbHkgKHZlcmlmaWNhdGlvbiBmYWlsZWQpYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgU3RyaW5nKGVycikgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2FuaXRpemVTY2VuZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IChuYW1lIHx8ICdOZXcgU2NlbmUnKS50cmltKCk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSB0cmltbWVkLnJlcGxhY2UoL1xcLihmaXJlfHNjZW5lKSQvaSwgJycpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZCB8fCAnTmV3IFNjZW5lJztcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuc3VyZURiVXJsKHJhd1BhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBub3JtYWxpemVkID0gKHJhd1BhdGggfHwgJycpLnRyaW0oKTtcblxuICAgICAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU2NlbmUgcGF0aCBpcyByZXF1aXJlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gICAgICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJ2RiOi8vJykpIHtcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuc3RhcnRzV2l0aCgnYXNzZXRzLycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGRiOi8vJHtub3JtYWxpemVkfWA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgZGI6Ly9hc3NldHMke25vcm1hbGl6ZWR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBgZGI6Ly9hc3NldHMvJHtub3JtYWxpemVkfWA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBub3JtYWxpemVTY2VuZVNvdXJjZVBhdGgocmF3UGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IG5vcm1hbGl6ZWQgPSB0aGlzLmVuc3VyZURiVXJsKHJhd1BhdGgpO1xuXG4gICAgICAgIGlmIChub3JtYWxpemVkLmVuZHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxvd2VyID0gbm9ybWFsaXplZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAobG93ZXIuZW5kc1dpdGgoJy5zY2VuZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXplZC5zbGljZSgwLCAtNikgKyAnLmZpcmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFsb3dlci5lbmRzV2l0aCgnLmZpcmUnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke25vcm1hbGl6ZWR9LmZpcmVgO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHRyYWN0U2NlbmVOYW1lRnJvbVBhdGgoc2NlbmVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIXNjZW5lUGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuICdOZXcgU2NlbmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IHNjZW5lUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuICAgICAgICBjb25zdCBsYXN0ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gfHwgJyc7XG4gICAgICAgIGNvbnN0IHdpdGhvdXRFeHQgPSBsYXN0LnJlcGxhY2UoL1xcLihmaXJlfHNjZW5lKSQvaSwgJycpO1xuICAgICAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZVNjZW5lTmFtZSh3aXRob3V0RXh0IHx8ICdOZXcgU2NlbmUnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlc29sdmVDdXJyZW50U2NlbmVTb3VyY2Uoc291cmNlT3ZlcnJpZGU/OiBzdHJpbmcpOiBQcm9taXNlPHsgcGF0aDogc3RyaW5nOyBuYW1lOiBzdHJpbmcgfT4ge1xuICAgICAgICBpZiAoc291cmNlT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTb3VyY2UgPSB0aGlzLm5vcm1hbGl6ZVNjZW5lU291cmNlUGF0aChzb3VyY2VPdmVycmlkZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IG5vcm1hbGl6ZWRTb3VyY2UsXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5leHRyYWN0U2NlbmVOYW1lRnJvbVBhdGgobm9ybWFsaXplZFNvdXJjZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhc3NldGRiID0gdGhpcy5nZXRBc3NldERCKCk7XG4gICAgICAgIGlmICghYXNzZXRkYikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBc3NldCBkYXRhYmFzZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc2NlbmVJbmZvOiBhbnkgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2NlbmVJbmZvID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldEN1cnJlbnRTY2VuZUluZm8nKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2dnZXIud2FybihgW3NjZW5lLXRvb2xzXSBGYWlsZWQgdG8gcXVlcnkgY3VycmVudCBzY2VuZSBpbmZvIHZpYSBzY3JpcHQ6ICR7ZXJyfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NlbmVEYXRhID0gc2NlbmVJbmZvPy5kYXRhIHx8IHNjZW5lSW5mbztcbiAgICAgICAgY29uc3Qgc2NlbmVVdWlkID0gc2NlbmVEYXRhPy51dWlkO1xuICAgICAgICBsZXQgc2NlbmVOYW1lID0gc2NlbmVEYXRhPy5uYW1lO1xuXG4gICAgICAgIGlmICghc2NlbmVVdWlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZXRlcm1pbmUgY3VycmVudCBzY2VuZSBVVUlELiBQbGVhc2UgcHJvdmlkZSBzb3VyY2VQYXRoIGV4cGxpY2l0bHkuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmF3UGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnV1aWRUb1VybCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByYXdQYXRoID0gYXNzZXRkYi51dWlkVG9Vcmwoc2NlbmVVdWlkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBbc2NlbmUtdG9vbHNdIHV1aWRUb1VybCBmYWlsZWQgZm9yICR7c2NlbmVVdWlkfTogJHtlcnJ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJhd1BhdGggJiYgdHlwZW9mIGFzc2V0ZGIucXVlcnlJbmZvQnlVdWlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCB0aGlzLnF1ZXJ5QXNzZXRJbmZvQnlVdWlkKGFzc2V0ZGIsIHNjZW5lVXVpZCk7XG4gICAgICAgICAgICAgICAgcmF3UGF0aCA9IGluZm8/LnVybCB8fCBpbmZvPy5wYXRoIHx8IHJhd1BhdGg7XG4gICAgICAgICAgICAgICAgc2NlbmVOYW1lID0gc2NlbmVOYW1lIHx8IGluZm8/Lm5hbWU7XG4gICAgICAgICAgICB9IGNhdGNoIChhc3NldEVycikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGBbc2NlbmUtdG9vbHNdIEZhaWxlZCB0byBxdWVyeSBhc3NldCBpbmZvIGZvciBzY2VuZSB1dWlkICR7c2NlbmVVdWlkfTogJHthc3NldEVycn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmF3UGF0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZGV0ZXJtaW5lIGN1cnJlbnQgc2NlbmUgcGF0aC4gUGxlYXNlIHByb3ZpZGUgc291cmNlUGF0aCBleHBsaWNpdGx5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFNvdXJjZSA9IHRoaXMubm9ybWFsaXplU2NlbmVTb3VyY2VQYXRoKHJhd1BhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGF0aDogbm9ybWFsaXplZFNvdXJjZSxcbiAgICAgICAgICAgIG5hbWU6IHNjZW5lTmFtZSB8fCB0aGlzLmV4dHJhY3RTY2VuZU5hbWVGcm9tUGF0aChub3JtYWxpemVkU291cmNlKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgbW92ZVNjZW5lQXNzZXQoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuXG4gICAgICAgICAgICBpZiAoZWRpdG9yPy5JcGM/LnNlbmRUb01haW4pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb01haW4oJ2Fzc2V0LWRiOm1vdmUtYXNzZXQnLCBzb3VyY2UsIHRhcmdldCwgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignQXNzZXQgZGF0YWJhc2UgaW50ZXJmYWNlIGlzIG5vdCBhdmFpbGFibGUnKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgbm9ybWFsaXplU2NlbmVTYXZlUGF0aChzY2VuZU5hbWU6IHN0cmluZywgcmF3U2F2ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHNhbml0aXplZE5hbWUgPSB0aGlzLnNhbml0aXplU2NlbmVOYW1lKHNjZW5lTmFtZSk7XG4gICAgICAgIGxldCBub3JtYWxpemVkID0gKHJhd1NhdmVQYXRoIHx8ICcnKS50cmltKCk7XG5cbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NhdmVQYXRoIGlzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhIHNjZW5lJyk7XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgICAgIGNvbnN0IGxvd2VyID0gbm9ybWFsaXplZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChsb3dlci5lbmRzV2l0aCgnLnNjZW5lJykpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnNsaWNlKDAsIC02KSArICcuZmlyZSc7XG4gICAgICAgIH0gZWxzZSBpZiAoIWxvd2VyLmVuZHNXaXRoKCcuZmlyZScpKSB7XG4gICAgICAgICAgICBjb25zdCBzdWZmaXggPSBub3JtYWxpemVkLmVuZHNXaXRoKCcvJykgPyAnJyA6ICcvJztcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQgPSBgJHtub3JtYWxpemVkfSR7c3VmZml4fSR7c2FuaXRpemVkTmFtZX0uZmlyZWA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkQ3JlYXRvcjI0U2NlbmVDb250ZW50KHNjZW5lTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3Qgc2FuaXRpemVkTmFtZSA9IHRoaXMuc2FuaXRpemVTY2VuZU5hbWUoc2NlbmVOYW1lKTtcbiAgICAgICAgY29uc3Qgc2NlbmVUZW1wbGF0ZTogYW55W10gPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TY2VuZUFzc2V0JyxcbiAgICAgICAgICAgICAgICBfbmFtZTogc2FuaXRpemVkTmFtZSxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX25hdGl2ZTogJycsXG4gICAgICAgICAgICAgICAgc2NlbmU6IHtcbiAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlNjZW5lJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDogbnVsbCxcbiAgICAgICAgICAgICAgICBfY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAyXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF9hY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2NvbXBvbmVudHM6IFtdLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX29wYWNpdHk6IDI1NSxcbiAgICAgICAgICAgICAgICBfY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Db2xvcicsXG4gICAgICAgICAgICAgICAgICAgIHI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgZzogMjU1LFxuICAgICAgICAgICAgICAgICAgICBiOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGE6IDI1NVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NvbnRlbnRTaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAwLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hbmNob3JQb2ludDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzInLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfdHJzOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnVHlwZWRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGN0b3I6ICdGbG9hdDY0QXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBhcnJheTogWzAsIDAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfaXMzRE5vZGU6IHRydWUsXG4gICAgICAgICAgICAgICAgX2dyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBhdXRvUmVsZWFzZUFzc2V0czogZmFsc2UsXG4gICAgICAgICAgICAgICAgX2lkOiAnMzI0MjQ3ZTgtYzU4NC00OTVkLTg3YjMtMDE1YTY5ZmVlNDQ0J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLk5vZGUnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnQ2FudmFzJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDoge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDFcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDVcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgX19pZF9fOiA2XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF9wcmVmYWI6IG51bGwsXG4gICAgICAgICAgICAgICAgX29wYWNpdHk6IDI1NSxcbiAgICAgICAgICAgICAgICBfY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Db2xvcicsXG4gICAgICAgICAgICAgICAgICAgIHI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgZzogMjU1LFxuICAgICAgICAgICAgICAgICAgICBiOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGE6IDI1NVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2NvbnRlbnRTaXplOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA5NjAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjQwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfYW5jaG9yUG9pbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMyJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMC41LFxuICAgICAgICAgICAgICAgICAgICB5OiAwLjVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF90cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdUeXBlZEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgY3RvcjogJ0Zsb2F0NjRBcnJheScsXG4gICAgICAgICAgICAgICAgICAgIGFycmF5OiBbNDgwLCAzMjAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZXVsZXJBbmdsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5WZWMzJyxcbiAgICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICAgICAgejogMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3NrZXdYOiAwLFxuICAgICAgICAgICAgICAgIF9za2V3WTogMCxcbiAgICAgICAgICAgICAgICBfaXMzRE5vZGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9ncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXg6IDAsXG4gICAgICAgICAgICAgICAgX2lkOiAnYTVlc1p1KzQ1TEE1bUJwdnR0c3BQRCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5Ob2RlJyxcbiAgICAgICAgICAgICAgICBfbmFtZTogJ01haW4gQ2FtZXJhJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgX3BhcmVudDoge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9jaGlsZHJlbjogW10sXG4gICAgICAgICAgICAgICAgX2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfX2lkX186IDRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgX3ByZWZhYjogbnVsbCxcbiAgICAgICAgICAgICAgICBfb3BhY2l0eTogMjU1LFxuICAgICAgICAgICAgICAgIF9jb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMjU1LFxuICAgICAgICAgICAgICAgICAgICBnOiAyNTUsXG4gICAgICAgICAgICAgICAgICAgIGI6IDI1NSxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfY29udGVudFNpemU6IHtcbiAgICAgICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5TaXplJyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDk2MCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9hbmNob3JQb2ludDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlZlYzInLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAuNVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX3Ryczoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ1R5cGVkQXJyYXknLFxuICAgICAgICAgICAgICAgICAgICBjdG9yOiAnRmxvYXQ2NEFycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgYXJyYXk6IFswLCAwLCAwLCAwLCAwLCAwLCAxLCAxLCAxLCAxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgX2V1bGVyQW5nbGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuVmVjMycsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIHo6IDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9za2V3WDogMCxcbiAgICAgICAgICAgICAgICBfc2tld1k6IDAsXG4gICAgICAgICAgICAgICAgX2lzM0ROb2RlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBfZ3JvdXBJbmRleDogMCxcbiAgICAgICAgICAgICAgICBncm91cEluZGV4OiAwLFxuICAgICAgICAgICAgICAgIF9pZDogJ2UxV29GclE3OUc3cjRadVFFM0hsTmInXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuQ2FtZXJhJyxcbiAgICAgICAgICAgICAgICBfbmFtZTogJycsXG4gICAgICAgICAgICAgICAgX29iakZsYWdzOiAwLFxuICAgICAgICAgICAgICAgIG5vZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgX19pZF9fOiAzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfY3VsbGluZ01hc2s6IDQyOTQ5NjcyOTUsXG4gICAgICAgICAgICAgICAgX2NsZWFyRmxhZ3M6IDcsXG4gICAgICAgICAgICAgICAgX2JhY2tncm91bmRDb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLkNvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgcjogMCxcbiAgICAgICAgICAgICAgICAgICAgZzogMCxcbiAgICAgICAgICAgICAgICAgICAgYjogMCxcbiAgICAgICAgICAgICAgICAgICAgYTogMjU1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZGVwdGg6IC0xLFxuICAgICAgICAgICAgICAgIF96b29tUmF0aW86IDEsXG4gICAgICAgICAgICAgICAgX3RhcmdldFRleHR1cmU6IG51bGwsXG4gICAgICAgICAgICAgICAgX2ZvdjogNjAsXG4gICAgICAgICAgICAgICAgX29ydGhvU2l6ZTogMTAsXG4gICAgICAgICAgICAgICAgX25lYXJDbGlwOiAxLFxuICAgICAgICAgICAgICAgIF9mYXJDbGlwOiA0MDk2LFxuICAgICAgICAgICAgICAgIF9vcnRobzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfcmVjdDoge1xuICAgICAgICAgICAgICAgICAgICBfX3R5cGVfXzogJ2NjLlJlY3QnLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfcmVuZGVyU3RhZ2VzOiAxLFxuICAgICAgICAgICAgICAgIF9hbGlnbldpdGhTY3JlZW46IHRydWUsXG4gICAgICAgICAgICAgICAgX2lkOiAnODFHTjN1WElOS1ZMZVc0K2lLU2xpbSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5DYW52YXMnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgbm9kZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIF9kZXNpZ25SZXNvbHV0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIF9fdHlwZV9fOiAnY2MuU2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA5NjAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjQwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBfZml0V2lkdGg6IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9maXRIZWlnaHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgX2lkOiAnNTlDZDBvdmJkRjRieXc1c2JqSkR4NydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX190eXBlX186ICdjYy5XaWRnZXQnLFxuICAgICAgICAgICAgICAgIF9uYW1lOiAnJyxcbiAgICAgICAgICAgICAgICBfb2JqRmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgbm9kZToge1xuICAgICAgICAgICAgICAgICAgICBfX2lkX186IDJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF9lbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFsaWduTW9kZTogMSxcbiAgICAgICAgICAgICAgICBfdGFyZ2V0OiBudWxsLFxuICAgICAgICAgICAgICAgIF9hbGlnbkZsYWdzOiA0NSxcbiAgICAgICAgICAgICAgICBfbGVmdDogMCxcbiAgICAgICAgICAgICAgICBfcmlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgX3RvcDogMCxcbiAgICAgICAgICAgICAgICBfYm90dG9tOiAwLFxuICAgICAgICAgICAgICAgIF92ZXJ0aWNhbENlbnRlcjogMCxcbiAgICAgICAgICAgICAgICBfaG9yaXpvbnRhbENlbnRlcjogMCxcbiAgICAgICAgICAgICAgICBfaXNBYnNMZWZ0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1JpZ2h0OiB0cnVlLFxuICAgICAgICAgICAgICAgIF9pc0Fic1RvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNCb3R0b206IHRydWUsXG4gICAgICAgICAgICAgICAgX2lzQWJzSG9yaXpvbnRhbENlbnRlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfaXNBYnNWZXJ0aWNhbENlbnRlcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICBfb3JpZ2luYWxXaWR0aDogMCxcbiAgICAgICAgICAgICAgICBfb3JpZ2luYWxIZWlnaHQ6IDAsXG4gICAgICAgICAgICAgICAgX2lkOiAnMjl6WGJvaVhGQktvSVY0UFEybGlUZSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc2NlbmVUZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZW5kU2NlbmVEYXRhVG9Bc3NldERCKHRhcmdldFBhdGg6IHN0cmluZywgc2NlbmVDb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcblxuICAgICAgICBpZiAoZWRpdG9yPy5JcGM/LnNlbmRUb01haW4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9NYWluKCdhc3NldC1kYjpjcmVhdGUtYXNzZXQnLCB0YXJnZXRQYXRoLCBzY2VuZUNvbnRlbnQsIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignQXNzZXQgZGF0YWJhc2UgaW50ZXJmYWNlIGlzIG5vdCBhdmFpbGFibGUnKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRTY2VuZUhpZXJhcmNoeShpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCB0aGlzLnJlcXVlc3RTY2VuZVRyZWVEYXRhKGluY2x1ZGVDb21wb25lbnRzKTtcbiAgICAgICAgICAgIGlmICghdHJlZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIHNjZW5lIGhpZXJhcmNoeSBhdmFpbGFibGUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlID0gQXJyYXkuaXNBcnJheSh0cmVlKVxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiAnc2NlbmUtcm9vdCcsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdTY2VuZScsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5TY2VuZScsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHRyZWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgOiB0cmVlO1xuXG4gICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSB0aGlzLmJ1aWxkSGllcmFyY2h5KHJvb3ROb2RlLCBpbmNsdWRlQ29tcG9uZW50cyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaGllcmFyY2h5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyPy5tZXNzYWdlIHx8IFN0cmluZyhlcnIpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZEhpZXJhcmNoeShub2RlOiBhbnksIGluY2x1ZGVDb21wb25lbnRzOiBib29sZWFuKTogYW55IHtcbiAgICAgICAgY29uc3Qgbm9kZUluZm86IGFueSA9IHtcbiAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZSxcbiAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW5jbHVkZUNvbXBvbmVudHMgJiYgbm9kZS5fX2NvbXBzX18pIHtcbiAgICAgICAgICAgIG5vZGVJbmZvLmNvbXBvbmVudHMgPSBub2RlLl9fY29tcHNfXy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBjb21wLl9fdHlwZV9fIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXAuZW5hYmxlZCA6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBub2RlSW5mby5jaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBcbiAgICAgICAgICAgICAgICB0aGlzLmJ1aWxkSGllcmFyY2h5KGNoaWxkLCBpbmNsdWRlQ29tcG9uZW50cylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZUluZm87XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlU2NlbmVBcyhwYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoIHx8IHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAncGF0aCBpcyByZXF1aXJlZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2NlbmUgPSBhd2FpdCB0aGlzLnJlc29sdmVDdXJyZW50U2NlbmVTb3VyY2Uoc291cmNlUGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHRoaXMubm9ybWFsaXplU2NlbmVTYXZlUGF0aChcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFNjZW5lLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5zdXJlRGJVcmwocGF0aClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhdGggPT09IGN1cnJlbnRTY2VuZS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTb3VyY2UgYW5kIGRlc3RpbmF0aW9uIHBhdGhzIGFyZSBpZGVudGljYWwnIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5tb3ZlU2NlbmVBc3NldChjdXJyZW50U2NlbmUucGF0aCwgdGFyZ2V0UGF0aCk7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBjdXJyZW50U2NlbmUucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRhcmdldFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU2NlbmUgbW92ZWQgdG8gJHt0YXJnZXRQYXRofWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnI/Lm1lc3NhZ2UgfHwgU3RyaW5nKGVycikgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2xvc2VTY2VuZSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kVG9TY2VuZVBhbmVsKCdzY2VuZTpjbG9zZS1zY2VuZScpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTY2VuZSBjbG9zZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QXNzZXREQigpOiBhbnkge1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcbiAgICAgICAgcmV0dXJuIGVkaXRvcj8uYXNzZXRkYiB8fCBlZGl0b3I/LnJlbW90ZT8uYXNzZXRkYjtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5QXNzZXRJbmZvQnlVdWlkKGFzc2V0ZGI6IGFueSwgdXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFhc3NldGRiIHx8IHR5cGVvZiBhc3NldGRiLnF1ZXJ5SW5mb0J5VXVpZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgYXNzZXRkYi5xdWVyeUluZm9CeVV1aWQodXVpZCwgKGVycjogRXJyb3IgfCBudWxsLCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW5mbyB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZW5kVG9TY2VuZVBhbmVsKG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcbiAgICAgICAgaWYgKCFlZGl0b3I/LklwYz8uc2VuZFRvUGFuZWwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRWRpdG9yLklwYy5zZW5kVG9QYW5lbCDkuI3lj6/nlKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5JcGMuc2VuZFRvUGFuZWwoJ3NjZW5lJywgbWVzc2FnZSwgLi4uYXJncywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNhbGxTY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10gPSBbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuICAgICAgICBpZiAoIWVkaXRvcj8uU2NlbmU/LmNhbGxTY2VuZVNjcmlwdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0IOS4jeWPr+eUqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdChcbiAgICAgICAgICAgICAgICAgICAgJ2NvY29zLW1jcC1zZXJ2ZXInLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICAgICAgICAgIC4uLmFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXF1ZXN0U2NlbmVUcmVlRGF0YShpbmNsdWRlQ29tcG9uZW50czogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0cmVlID0gYXdhaXQgdGhpcy5zZW5kVG9TY2VuZVBhbmVsKCdzY2VuZTpxdWVyeS1oaWVyYXJjaHknKTtcbiAgICAgICAgICAgIGlmICh0cmVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmNsdWRlQ29tcG9uZW50cyB8fCB0aGlzLnRyZWVIYXNDb21wb25lbnREYXRhKHRyZWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBzY2VuZTpxdWVyeS1oaWVyYXJjaHkgJHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdnZXRTY2VuZVRyZWVEYXRhJyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0Py5zdWNjZXNzICYmIHJlc3VsdC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBnZXRTY2VuZVRyZWVEYXRhICR7ZXJyPy5tZXNzYWdlIHx8IGVycn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignIHwgJykgfHwgJ0ZhaWxlZCB0byBxdWVyeSBzY2VuZSB0cmVlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0cmVlSGFzQ29tcG9uZW50RGF0YSh0cmVlOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCF0cmVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlcyA9IEFycmF5LmlzQXJyYXkodHJlZSkgPyB0cmVlIDogW3RyZWVdO1xuICAgICAgICBjb25zdCBzdGFjayA9IFsuLi5ub2Rlc107XG5cbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobm9kZS5fX2NvbXBzX18gfHwgbm9kZS5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCguLi5ub2RlLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iXX0=
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
                return await this.saveSceneAs(args.path, args.sourcePath);
            case 'close_scene':
                return await this.closeScene();
            case 'get_scene_hierarchy':
                return await this.getSceneHierarchy(args.includeComponents);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getCurrentScene(): Promise<ToolResponse> {
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
        } catch (err: any) {
            logger.warn(`[scene-tools] requestSceneTreeData failed: ${err?.message || err}`);
        }

        try {
            const result = await this.callSceneScript('getCurrentSceneInfo');
            return result;
        } catch (err: any) {
            return {
                success: false,
                error: err?.message || String(err)
            };
        }
    }

    private async getSceneList(): Promise<ToolResponse> {
        const patterns = ['db://assets/**/*.scene', 'db://assets/**/*.fire'];
        const errors: string[] = [];
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

    private async queryScenesViaAssetDB(assetdb: any, pattern: string): Promise<any[] | null> {
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

    private ensureDbUrl(rawPath: string): string {
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

    private normalizeSceneSourcePath(rawPath: string): string {
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

    private extractSceneNameFromPath(scenePath: string): string {
        if (!scenePath) {
            return 'New Scene';
        }

        const normalized = scenePath.replace(/\\/g, '/');
        const segments = normalized.split('/');
        const last = segments[segments.length - 1] || '';
        const withoutExt = last.replace(/\.(fire|scene)$/i, '');
        return this.sanitizeSceneName(withoutExt || 'New Scene');
    }

    private async resolveCurrentSceneSource(sourceOverride?: string): Promise<{ path: string; name: string }> {
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

        let sceneInfo: any = null;
        try {
            sceneInfo = await this.callSceneScript('getCurrentSceneInfo');
        } catch (err) {
            logger.warn(`[scene-tools] Failed to query current scene info via script: ${err}`);
        }

        const sceneData = sceneInfo?.data || sceneInfo;
        const sceneUuid = sceneData?.uuid;
        let sceneName = sceneData?.name;

        if (!sceneUuid) {
            throw new Error('Unable to determine current scene UUID. Please provide sourcePath explicitly.');
        }

        let rawPath: string | null = null;

        if (typeof assetdb.uuidToUrl === 'function') {
            try {
                rawPath = assetdb.uuidToUrl(sceneUuid);
            } catch (err) {
                logger.warn(`[scene-tools] uuidToUrl failed for ${sceneUuid}: ${err}`);
            }
        }

        if (!rawPath && typeof assetdb.queryInfoByUuid === 'function') {
            try {
                const info = await this.queryAssetInfoByUuid(assetdb, sceneUuid);
                rawPath = info?.url || info?.path || rawPath;
                sceneName = sceneName || info?.name;
            } catch (assetErr) {
                logger.warn(`[scene-tools] Failed to query asset info for scene uuid ${sceneUuid}: ${assetErr}`);
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

    private moveSceneAsset(source: string, target: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const editor: any = Editor;

            if (editor?.Ipc?.sendToMain) {
                try {
                    editor.Ipc.sendToMain('asset-db:move-asset', source, target, (err: Error | null, result: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (error) {
                    reject(error);
                }
                return;
            }

            reject(new Error('Asset database interface is not available'));
        });
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

        return Promise.reject(new Error('Asset database interface is not available'));
    }

    private async getSceneHierarchy(includeComponents: boolean = false): Promise<ToolResponse> {
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
        } catch (err: any) {
            return {
                success: false,
                error: err?.message || String(err)
            };
        }
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

    private async saveSceneAs(path: string, sourcePath?: string): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                if (!path || typeof path !== 'string') {
                    resolve({ success: false, error: 'path is required' });
                    return;
                }

                const currentScene = await this.resolveCurrentSceneSource(sourcePath);
                const targetPath = this.normalizeSceneSavePath(
                    currentScene.name,
                    this.ensureDbUrl(path)
                );

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
            } catch (err: any) {
                resolve({ success: false, error: err?.message || String(err) });
            }
        });
    }

    private async closeScene(): Promise<ToolResponse> {
        try {
            await this.sendToScenePanel('scene:close-scene');
            return {
                success: true,
                message: 'Scene closed successfully'
            };
        } catch (err: any) {
            return {
                success: false,
                error: err?.message || String(err)
            };
        }
    }

    private getAssetDB(): any {
        const editor: any = Editor;
        return editor?.assetdb || editor?.remote?.assetdb;
    }

    private async queryAssetInfoByUuid(assetdb: any, uuid: string): Promise<any> {
        if (!assetdb || typeof assetdb.queryInfoByUuid !== 'function') {
            return null;
        }

        return new Promise((resolve, reject) => {
            assetdb.queryInfoByUuid(uuid, (err: Error | null, info: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info || null);
                }
            });
        });
    }

    private async sendToScenePanel(message: string, ...args: any[]): Promise<any> {
        const editor: any = Editor;
        if (!editor?.Ipc?.sendToPanel) {
            throw new Error('Editor.Ipc.sendToPanel 不可用');
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
                editor.Ipc.sendToPanel('scene', message, ...args, callback);
            } catch (error) {
                reject(error);
            }
        });
    }

    private async callSceneScript(method: string, args: any[] = []): Promise<any> {
        const editor: any = Editor;
        if (!editor?.Scene?.callSceneScript) {
            throw new Error('Editor.Scene.callSceneScript 不可用');
        }

        return new Promise((resolve, reject) => {
            try {
                editor.Scene.callSceneScript(
                    'cocos-mcp-server',
                    method,
                    ...args,
                    (err: Error | null, result: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    private async requestSceneTreeData(includeComponents: boolean = false): Promise<any> {
        const errors: string[] = [];

        try {
            const tree = await this.sendToScenePanel('scene:query-hierarchy');
            if (tree) {
                if (!includeComponents || this.treeHasComponentData(tree)) {
                    return tree;
                }
            }
        } catch (err: any) {
            errors.push(`scene:query-hierarchy ${err?.message || err}`);
        }

        try {
            const result = await this.callSceneScript('getSceneTreeData');
            if (result?.success && result.data) {
                return result.data;
            }
            return result;
        } catch (err: any) {
            errors.push(`getSceneTreeData ${err?.message || err}`);
        }

        throw new Error(errors.join(' | ') || 'Failed to query scene tree');
    }

    private treeHasComponentData(tree: any): boolean {
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

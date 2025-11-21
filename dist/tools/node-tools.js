"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTools = void 0;
const component_tools_1 = require("./component-tools");
class NodeTools {
    constructor() {
        this.componentTools = new component_tools_1.ComponentTools();
    }
    getTools() {
        return [
            {
                name: 'create_node',
                description: 'Create a new node in the scene. Supports creating empty nodes, nodes with components, or instantiating from assets (prefabs, etc.). IMPORTANT: You should always provide parentUuid to specify where to create the node.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Node name'
                        },
                        parentUuid: {
                            type: 'string',
                            description: 'Parent node UUID. STRONGLY RECOMMENDED: Always provide this parameter. Use get_current_scene or get_all_nodes to find parent UUIDs. If not provided, node will be created at scene root.'
                        },
                        nodeType: {
                            type: 'string',
                            description: 'Node type: Node, 2DNode, 3DNode',
                            enum: ['Node', '2DNode', '3DNode'],
                            default: 'Node'
                        },
                        siblingIndex: {
                            type: 'number',
                            description: 'Sibling index for ordering (-1 means append at end)',
                            default: -1
                        },
                        assetUuid: {
                            type: 'string',
                            description: 'Asset UUID to instantiate from (e.g., prefab UUID). When provided, creates a node instance from the asset instead of an empty node.'
                        },
                        assetPath: {
                            type: 'string',
                            description: 'Asset path to instantiate from (e.g., "db://assets/prefabs/MyPrefab.prefab"). Alternative to assetUuid.'
                        },
                        components: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of component type names to add to the new node (e.g., ["cc.Sprite", "cc.Button"])'
                        },
                        unlinkPrefab: {
                            type: 'boolean',
                            description: 'If true and creating from prefab, unlink from prefab to create a regular node',
                            default: false
                        },
                        keepWorldTransform: {
                            type: 'boolean',
                            description: 'Whether to keep world transform when creating the node',
                            default: false
                        },
                        initialTransform: {
                            type: 'object',
                            properties: {
                                position: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                rotation: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                },
                                scale: {
                                    type: 'object',
                                    properties: {
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        z: { type: 'number' }
                                    }
                                }
                            },
                            description: 'Initial transform to apply to the created node'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_node_info',
                description: 'Get node information by UUID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'find_nodes',
                description: 'Find nodes by name pattern',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'Name pattern to search'
                        },
                        exactMatch: {
                            type: 'boolean',
                            description: 'Exact match or partial match',
                            default: false
                        }
                    },
                    required: ['pattern']
                }
            },
            {
                name: 'find_node_by_name',
                description: 'Find first node by exact name',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Node name to find'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_all_nodes',
                description: 'Get all nodes in the scene with their UUIDs',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'set_node_property',
                description: 'Set node property value (prefer using set_node_transform for active/layer/mobility/position/rotation/scale)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        property: {
                            type: 'string',
                            description: 'Property name (e.g., active, name, layer)'
                        },
                        value: {
                            description: 'Property value'
                        }
                    },
                    required: ['uuid', 'property', 'value']
                }
            },
            {
                name: 'set_node_transform',
                description: 'Set node transform properties (position, rotation, scale) with unified interface. Automatically handles 2D/3D node differences.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        position: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z coordinate (ignored for 2D nodes)' }
                            },
                            description: 'Node position. For 2D nodes, only x,y are used; z is ignored. For 3D nodes, all coordinates are used.'
                        },
                        rotation: {
                            type: 'object',
                            properties: {
                                x: { type: 'number', description: 'X rotation (ignored for 2D nodes)' },
                                y: { type: 'number', description: 'Y rotation (ignored for 2D nodes)' },
                                z: { type: 'number', description: 'Z rotation (main rotation axis for 2D nodes)' }
                            },
                            description: 'Node rotation in euler angles. For 2D nodes, only z rotation is used. For 3D nodes, all axes are used.'
                        },
                        scale: {
                            type: 'object',
                            properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                z: { type: 'number', description: 'Z scale (usually 1 for 2D nodes)' }
                            },
                            description: 'Node scale. For 2D nodes, z is typically 1. For 3D nodes, all axes are used.'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'delete_node',
                description: 'Delete a node from scene',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to delete'
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'move_node',
                description: 'Move node to new parent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID to move'
                        },
                        newParentUuid: {
                            type: 'string',
                            description: 'New parent node UUID'
                        },
                        siblingIndex: {
                            type: 'number',
                            description: 'Sibling index in new parent',
                            default: -1
                        }
                    },
                    required: ['nodeUuid', 'newParentUuid']
                }
            },
            {
                name: 'duplicate_node',
                description: 'Duplicate a node',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to duplicate'
                        },
                        includeChildren: {
                            type: 'boolean',
                            description: 'Include children nodes',
                            default: true
                        }
                    },
                    required: ['uuid']
                }
            },
            {
                name: 'detect_node_type',
                description: 'Detect if a node is 2D or 3D based on its components and properties',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uuid: {
                            type: 'string',
                            description: 'Node UUID to analyze'
                        }
                    },
                    required: ['uuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'create_node':
                return await this.createNode(args);
            case 'get_node_info':
                return await this.getNodeInfo(args.uuid);
            case 'find_nodes':
                return await this.findNodes(args.pattern, args.exactMatch);
            case 'find_node_by_name':
                return await this.findNodeByName(args.name);
            case 'get_all_nodes':
                return await this.getAllNodes();
            case 'set_node_property':
                return await this.setNodeProperty(args.uuid, args.property, args.value);
            case 'set_node_transform':
                return await this.setNodeTransform(args);
            case 'delete_node':
                return await this.deleteNode(args.uuid);
            case 'move_node':
                return await this.moveNode(args.nodeUuid, args.newParentUuid, args.siblingIndex);
            case 'duplicate_node':
                return await this.duplicateNode(args.uuid, args.includeChildren);
            case 'detect_node_type':
                return await this.detectNodeType(args.uuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async createNode(args) {
        return new Promise(async (resolve) => {
            var _a;
            try {
                let targetParentUuid = args.parentUuid;
                // 如果没有提供父节点UUID，获取场景根节点
                if (!targetParentUuid) {
                    try {
                        const sceneInfo = await this.requestSceneTreeData();
                        const rootCandidate = Array.isArray(sceneInfo) ? sceneInfo[0] : sceneInfo;
                        if (rootCandidate && rootCandidate.uuid) {
                            targetParentUuid = rootCandidate.uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        }
                        else {
                            const currentScene = await this.callSceneScript('getCurrentSceneInfo');
                            if ((_a = currentScene === null || currentScene === void 0 ? void 0 : currentScene.data) === null || _a === void 0 ? void 0 : _a.uuid) {
                                targetParentUuid = currentScene.data.uuid;
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to get scene root, will use default behavior');
                    }
                }
                // 如果提供了assetPath，先解析为assetUuid
                let finalAssetUuid = args.assetUuid;
                if (args.assetPath && !finalAssetUuid) {
                    try {
                        finalAssetUuid = await this.resolveAssetUuid(args.assetPath);
                        if (!finalAssetUuid) {
                            resolve({
                                success: false,
                                error: `Asset not found at path: ${args.assetPath}`
                            });
                            return;
                        }
                        console.log(`Asset path '${args.assetPath}' resolved to UUID: ${finalAssetUuid}`);
                    }
                    catch (err) {
                        resolve({
                            success: false,
                            error: `Failed to resolve asset path '${args.assetPath}': ${err}`
                        });
                        return;
                    }
                }
                // 构建create-node选项
                const createNodeOptions = {
                    name: args.name
                };
                // 设置父节点
                if (targetParentUuid) {
                    createNodeOptions.parent = targetParentUuid;
                }
                // 从资源实例化
                if (finalAssetUuid) {
                    createNodeOptions.assetUuid = finalAssetUuid;
                    if (args.unlinkPrefab) {
                        createNodeOptions.unlinkPrefab = true;
                    }
                }
                // 添加组件
                if (args.components && args.components.length > 0) {
                    createNodeOptions.components = args.components;
                }
                else if (args.nodeType && args.nodeType !== 'Node' && !finalAssetUuid) {
                    // 只有在不从资源实例化时才添加nodeType组件
                    createNodeOptions.components = [args.nodeType];
                }
                // 保持世界变换
                if (args.keepWorldTransform) {
                    createNodeOptions.keepWorldTransform = true;
                }
                // 直接使用场景脚本创建节点（面板 API 在 2.x 中有问题）
                console.log('[node-tools] Creating node via scene script...');
                let uuid = null;
                try {
                    const scriptResult = await this.callSceneScript('createNode', [args.name, targetParentUuid]);
                    console.log('[node-tools] Scene script result:', scriptResult);
                    if (scriptResult && scriptResult.success && scriptResult.data && scriptResult.data.uuid) {
                        uuid = scriptResult.data.uuid;
                        console.log('[node-tools] ✅ Node created successfully:', uuid);
                    }
                    else {
                        console.error('[node-tools] Scene script returned invalid result:', scriptResult);
                        throw new Error('Scene script did not return a valid UUID');
                    }
                }
                catch (scriptErr) {
                    console.error('[node-tools] ❌ Scene script failed:', scriptErr);
                    throw new Error(`Failed to create node: ${scriptErr.message || scriptErr}`);
                }
                console.log('[node-tools] Node UUID:', uuid);
                if (!uuid) {
                    throw new Error('Failed to create node: no UUID returned');
                }
                // 处理兄弟索引
                if (args.siblingIndex !== undefined && args.siblingIndex >= 0 && targetParentUuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100)); // 等待内部状态更新
                        await this.reparentNodes([uuid], targetParentUuid, {
                            keepWorldTransform: args.keepWorldTransform || false,
                            siblingIndex: args.siblingIndex
                        });
                    }
                    catch (err) {
                        console.warn('Failed to set sibling index:', err);
                    }
                }
                // 添加组件（如果提供的话）
                if (args.components && args.components.length > 0 && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 100)); // 等待节点创建完成
                        for (const componentType of args.components) {
                            try {
                                const result = await this.componentTools.execute('add_component', {
                                    nodeUuid: uuid,
                                    componentType: componentType
                                });
                                if (result.success) {
                                    console.log(`Component ${componentType} added successfully`);
                                }
                                else {
                                    console.warn(`Failed to add component ${componentType}:`, result.error);
                                }
                            }
                            catch (err) {
                                console.warn(`Failed to add component ${componentType}:`, err);
                            }
                        }
                    }
                    catch (err) {
                        console.warn('Failed to add components:', err);
                    }
                }
                // 设置初始变换（如果提供的话）
                if (args.initialTransform && uuid) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 150)); // 等待节点和组件创建完成
                        await this.setNodeTransform({
                            uuid: uuid,
                            position: args.initialTransform.position,
                            rotation: args.initialTransform.rotation,
                            scale: args.initialTransform.scale
                        });
                        console.log('Initial transform applied successfully');
                    }
                    catch (err) {
                        console.warn('Failed to set initial transform:', err);
                    }
                }
                // 获取创建后的节点信息进行验证
                let verificationData = null;
                try {
                    const nodeInfo = await this.getNodeInfo(uuid);
                    if (nodeInfo.success) {
                        verificationData = {
                            nodeInfo: nodeInfo.data,
                            creationDetails: {
                                parentUuid: targetParentUuid,
                                nodeType: args.nodeType || 'Node',
                                fromAsset: !!finalAssetUuid,
                                assetUuid: finalAssetUuid,
                                assetPath: args.assetPath,
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                }
                catch (err) {
                    console.warn('Failed to get verification data:', err);
                }
                const successMessage = finalAssetUuid
                    ? `Node '${args.name}' instantiated from asset successfully`
                    : `Node '${args.name}' created successfully`;
                resolve({
                    success: true,
                    data: {
                        uuid: uuid,
                        name: args.name,
                        parentUuid: targetParentUuid,
                        nodeType: args.nodeType || 'Node',
                        fromAsset: !!finalAssetUuid,
                        assetUuid: finalAssetUuid,
                        message: successMessage
                    },
                    verificationData: verificationData
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to create node: ${err.message}. Args: ${JSON.stringify(args)}`
                });
            }
        });
    }
    async getNodeInfo(uuid) {
        return new Promise((resolve) => {
            this.fetchNodeDump(uuid).then((nodeData) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: 'Node not found or invalid response'
                    });
                    return;
                }
                // 根据实际返回的数据结构解析节点信息
                const info = {
                    uuid: ((_a = nodeData.uuid) === null || _a === void 0 ? void 0 : _a.value) || uuid,
                    name: ((_b = nodeData.name) === null || _b === void 0 ? void 0 : _b.value) || nodeData.name || 'Unknown',
                    active: ((_c = nodeData.active) === null || _c === void 0 ? void 0 : _c.value) !== undefined ? nodeData.active.value : true,
                    position: ((_d = nodeData.position) === null || _d === void 0 ? void 0 : _d.value) || { x: 0, y: 0, z: 0 },
                    rotation: ((_e = nodeData.rotation) === null || _e === void 0 ? void 0 : _e.value) || { x: 0, y: 0, z: 0 },
                    scale: ((_f = nodeData.scale) === null || _f === void 0 ? void 0 : _f.value) || { x: 1, y: 1, z: 1 },
                    parent: ((_h = (_g = nodeData.parent) === null || _g === void 0 ? void 0 : _g.value) === null || _h === void 0 ? void 0 : _h.uuid) || null,
                    children: nodeData.children || [],
                    components: (nodeData.__comps__ || nodeData.components || []).map((comp) => ({
                        type: comp.__type__ || comp.type || 'Unknown',
                        enabled: comp.enabled !== undefined ? comp.enabled : true
                    })),
                    layer: ((_j = nodeData.layer) === null || _j === void 0 ? void 0 : _j.value) || 1073741824,
                    mobility: ((_k = nodeData.mobility) === null || _k === void 0 ? void 0 : _k.value) || 0
                };
                resolve({ success: true, data: info });
            }).catch(async (err) => {
                console.warn('[node-tools] getNodeInfo direct query failed, fallback to scene script:', err);
                try {
                    const scriptResult = await this.callSceneScript('getNodeInfo', [uuid]);
                    resolve(scriptResult);
                }
                catch (err2) {
                    resolve({ success: false, error: err2.message || err2 });
                }
            });
        });
    }
    async findNodes(pattern, exactMatch = false) {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree) => {
                const nodes = [];
                const searchTree = (node, parentPath = '') => {
                    const nodeName = node.name || 'Unknown';
                    const currentPath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
                    const matches = exactMatch ?
                        nodeName === pattern :
                        nodeName.toLowerCase().includes(pattern.toLowerCase());
                    if (matches) {
                        nodes.push({
                            uuid: node.uuid,
                            name: nodeName,
                            path: currentPath
                        });
                    }
                    if (node.children && Array.isArray(node.children)) {
                        for (const child of node.children) {
                            searchTree(child, currentPath);
                        }
                    }
                };
                if (tree) {
                    searchTree(tree);
                }
                resolve({ success: true, data: nodes });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async findNodeByName(name) {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree) => {
                let foundNodeData = null;
                const searchTree = (node, parentPath = '') => {
                    const nodeName = node.name || 'Unknown';
                    const currentPath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
                    if (nodeName === name) {
                        foundNodeData = {
                            uuid: node.uuid,
                            name: nodeName,
                            path: currentPath
                        };
                        return true;
                    }
                    if (node.children && Array.isArray(node.children)) {
                        for (const child of node.children) {
                            if (searchTree(child, currentPath)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                searchTree(tree);
                if (foundNodeData) {
                    resolve({
                        success: true,
                        data: foundNodeData
                    });
                }
                else {
                    resolve({ success: false, error: `Node '${name}' not found` });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    searchNodeInTree(node, targetName) {
        if (node.name === targetName) {
            return node;
        }
        if (node.children) {
            for (const child of node.children) {
                const found = this.searchNodeInTree(child, targetName);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    async getAllNodes() {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree) => {
                const nodes = [];
                const traverseTree = (node, parentPath = '') => {
                    // 构建当前节点的路径
                    const nodeName = node.name || 'Unknown';
                    const currentPath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
                    nodes.push({
                        uuid: node.uuid,
                        name: nodeName,
                        type: node.type,
                        active: node.active,
                        path: currentPath
                    });
                    if (node.children && Array.isArray(node.children)) {
                        for (const child of node.children) {
                            traverseTree(child, currentPath);
                        }
                    }
                };
                if (tree) {
                    traverseTree(tree);
                }
                resolve({
                    success: true,
                    data: {
                        totalNodes: nodes.length,
                        nodes: nodes
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    getNodePath(node) {
        // 这个方法保留用于其他地方，但不再用于 getAllNodes
        if (!node || !node.name) {
            return '';
        }
        const path = [node.name];
        let current = node.parent;
        while (current && typeof current === 'object' && current.name && current.name !== 'Canvas') {
            path.unshift(current.name);
            current = current.parent;
        }
        return path.join('/');
    }
    async setNodeProperty(uuid, property, value) {
        return new Promise((resolve) => {
            this.updateNodePropertyViaScene(uuid, property, value).then(() => {
                // Get comprehensive verification data including updated node info
                this.getNodeInfo(uuid).then((nodeInfo) => {
                    resolve({
                        success: true,
                        message: `Property '${property}' updated successfully`,
                        data: {
                            nodeUuid: uuid,
                            property: property,
                            newValue: value
                        },
                        verificationData: {
                            nodeInfo: nodeInfo.data,
                            changeDetails: {
                                property: property,
                                value: value,
                                timestamp: new Date().toISOString()
                            }
                        }
                    });
                }).catch(() => {
                    resolve({
                        success: true,
                        message: `Property '${property}' updated successfully (verification failed)`
                    });
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async setNodeTransform(args) {
        return new Promise(async (resolve) => {
            const { uuid, position, rotation, scale } = args;
            const updatePromises = [];
            const updates = [];
            const warnings = [];
            try {
                // First get node info to determine if it's 2D or 3D
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2DNode = this.is2DNode(nodeInfo);
                if (position) {
                    const normalizedPosition = this.normalizeTransformValue(position, 'position', is2DNode);
                    if (normalizedPosition.warning) {
                        warnings.push(normalizedPosition.warning);
                    }
                    updatePromises.push(this.updateNodePropertyViaScene(uuid, 'position', normalizedPosition.value));
                    updates.push('position');
                }
                if (rotation) {
                    const normalizedRotation = this.normalizeTransformValue(rotation, 'rotation', is2DNode);
                    if (normalizedRotation.warning) {
                        warnings.push(normalizedRotation.warning);
                    }
                    updatePromises.push(this.updateNodePropertyViaScene(uuid, 'rotation', normalizedRotation.value));
                    updates.push('rotation');
                }
                if (scale) {
                    const normalizedScale = this.normalizeTransformValue(scale, 'scale', is2DNode);
                    if (normalizedScale.warning) {
                        warnings.push(normalizedScale.warning);
                    }
                    updatePromises.push(this.updateNodePropertyViaScene(uuid, 'scale', normalizedScale.value));
                    updates.push('scale');
                }
                if (updatePromises.length === 0) {
                    resolve({ success: false, error: 'No transform properties specified' });
                    return;
                }
                await Promise.all(updatePromises);
                // Verify the changes by getting updated node info
                const updatedNodeInfo = await this.getNodeInfo(uuid);
                const response = {
                    success: true,
                    message: `Transform properties updated: ${updates.join(', ')} ${is2DNode ? '(2D node)' : '(3D node)'}`,
                    updatedProperties: updates,
                    data: {
                        nodeUuid: uuid,
                        nodeType: is2DNode ? '2D' : '3D',
                        appliedChanges: updates,
                        transformConstraints: {
                            position: is2DNode ? 'x, y only (z ignored)' : 'x, y, z all used',
                            rotation: is2DNode ? 'z only (x, y ignored)' : 'x, y, z all used',
                            scale: is2DNode ? 'x, y main, z typically 1' : 'x, y, z all used'
                        }
                    },
                    verificationData: {
                        nodeInfo: updatedNodeInfo.data,
                        transformDetails: {
                            originalNodeType: is2DNode ? '2D' : '3D',
                            appliedTransforms: updates,
                            timestamp: new Date().toISOString()
                        },
                        beforeAfterComparison: {
                            before: nodeInfo,
                            after: updatedNodeInfo.data
                        }
                    }
                };
                if (warnings.length > 0) {
                    response.warning = warnings.join('; ');
                }
                resolve(response);
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to update transform: ${err.message}`
                });
            }
        });
    }
    is2DNode(nodeInfo) {
        // Check if node has 2D-specific components or is under Canvas
        const components = nodeInfo.components || [];
        // Check for common 2D components
        const has2DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
            comp.type.includes('cc.Label') ||
            comp.type.includes('cc.Button') ||
            comp.type.includes('cc.Layout') ||
            comp.type.includes('cc.Widget') ||
            comp.type.includes('cc.Mask') ||
            comp.type.includes('cc.Graphics')));
        if (has2DComponents) {
            return true;
        }
        // Check for 3D-specific components  
        const has3DComponents = components.some((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
            comp.type.includes('cc.Camera') ||
            comp.type.includes('cc.Light') ||
            comp.type.includes('cc.DirectionalLight') ||
            comp.type.includes('cc.PointLight') ||
            comp.type.includes('cc.SpotLight')));
        if (has3DComponents) {
            return false;
        }
        // Default heuristic: if z position is 0 and hasn't been changed, likely 2D
        const position = nodeInfo.position;
        if (position && Math.abs(position.z) < 0.001) {
            return true;
        }
        // Default to 3D if uncertain
        return false;
    }
    normalizeTransformValue(value, type, is2D) {
        const result = Object.assign({}, value);
        let warning;
        if (is2D) {
            switch (type) {
                case 'position':
                    if (value.z !== undefined && Math.abs(value.z) > 0.001) {
                        warning = `2D node: z position (${value.z}) ignored, set to 0`;
                        result.z = 0;
                    }
                    else if (value.z === undefined) {
                        result.z = 0;
                    }
                    break;
                case 'rotation':
                    if ((value.x !== undefined && Math.abs(value.x) > 0.001) ||
                        (value.y !== undefined && Math.abs(value.y) > 0.001)) {
                        warning = `2D node: x,y rotations ignored, only z rotation applied`;
                        result.x = 0;
                        result.y = 0;
                    }
                    else {
                        result.x = result.x || 0;
                        result.y = result.y || 0;
                    }
                    result.z = result.z || 0;
                    break;
                case 'scale':
                    if (value.z === undefined) {
                        result.z = 1; // Default scale for 2D
                    }
                    break;
            }
        }
        else {
            // 3D node - ensure all axes are defined
            result.x = result.x !== undefined ? result.x : (type === 'scale' ? 1 : 0);
            result.y = result.y !== undefined ? result.y : (type === 'scale' ? 1 : 0);
            result.z = result.z !== undefined ? result.z : (type === 'scale' ? 1 : 0);
        }
        return { value: result, warning };
    }
    async deleteNode(uuid) {
        return new Promise((resolve) => {
            this.deleteNodes([uuid]).then(() => {
                resolve({
                    success: true,
                    message: 'Node deleted successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async moveNode(nodeUuid, newParentUuid, siblingIndex = -1) {
        return new Promise((resolve) => {
            this.reparentNodes([nodeUuid], newParentUuid, {
                keepWorldTransform: false,
                siblingIndex: siblingIndex >= 0 ? siblingIndex : undefined
            }).then(() => {
                resolve({
                    success: true,
                    message: 'Node moved successfully'
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async duplicateNode(uuid, includeChildren = true) {
        return new Promise((resolve) => {
            this.duplicateNodes([uuid], includeChildren).then((result) => {
                const duplicatedUuid = this.extractUuidFromPanelResult(result);
                resolve({
                    success: true,
                    data: {
                        newUuid: duplicatedUuid,
                        message: 'Node duplicated successfully'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async detectNodeType(uuid) {
        return new Promise(async (resolve) => {
            try {
                const nodeInfoResponse = await this.getNodeInfo(uuid);
                if (!nodeInfoResponse.success || !nodeInfoResponse.data) {
                    resolve({ success: false, error: 'Failed to get node information' });
                    return;
                }
                const nodeInfo = nodeInfoResponse.data;
                const is2D = this.is2DNode(nodeInfo);
                const components = nodeInfo.components || [];
                // Collect detection reasons
                const detectionReasons = [];
                // Check for 2D components
                const twoDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.Sprite') ||
                    comp.type.includes('cc.Label') ||
                    comp.type.includes('cc.Button') ||
                    comp.type.includes('cc.Layout') ||
                    comp.type.includes('cc.Widget') ||
                    comp.type.includes('cc.Mask') ||
                    comp.type.includes('cc.Graphics')));
                // Check for 3D components
                const threeDComponents = components.filter((comp) => comp.type && (comp.type.includes('cc.MeshRenderer') ||
                    comp.type.includes('cc.Camera') ||
                    comp.type.includes('cc.Light') ||
                    comp.type.includes('cc.DirectionalLight') ||
                    comp.type.includes('cc.PointLight') ||
                    comp.type.includes('cc.SpotLight')));
                if (twoDComponents.length > 0) {
                    detectionReasons.push(`Has 2D components: ${twoDComponents.map((c) => c.type).join(', ')}`);
                }
                if (threeDComponents.length > 0) {
                    detectionReasons.push(`Has 3D components: ${threeDComponents.map((c) => c.type).join(', ')}`);
                }
                // Check position for heuristic
                const position = nodeInfo.position;
                if (position && Math.abs(position.z) < 0.001) {
                    detectionReasons.push('Z position is ~0 (likely 2D)');
                }
                else if (position && Math.abs(position.z) > 0.001) {
                    detectionReasons.push(`Z position is ${position.z} (likely 3D)`);
                }
                if (detectionReasons.length === 0) {
                    detectionReasons.push('No specific indicators found, defaulting based on heuristics');
                }
                resolve({
                    success: true,
                    data: {
                        nodeUuid: uuid,
                        nodeName: nodeInfo.name,
                        nodeType: is2D ? '2D' : '3D',
                        detectionReasons: detectionReasons,
                        components: components.map((comp) => ({
                            type: comp.type,
                            category: this.getComponentCategory(comp.type)
                        })),
                        position: nodeInfo.position,
                        transformConstraints: {
                            position: is2D ? 'x, y only (z ignored)' : 'x, y, z all used',
                            rotation: is2D ? 'z only (x, y ignored)' : 'x, y, z all used',
                            scale: is2D ? 'x, y main, z typically 1' : 'x, y, z all used'
                        }
                    }
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to detect node type: ${err.message}`
                });
            }
        });
    }
    getComponentCategory(componentType) {
        if (!componentType)
            return 'unknown';
        if (componentType.includes('cc.Sprite') || componentType.includes('cc.Label') ||
            componentType.includes('cc.Button') || componentType.includes('cc.Layout') ||
            componentType.includes('cc.Widget') || componentType.includes('cc.Mask') ||
            componentType.includes('cc.Graphics')) {
            return '2D';
        }
        if (componentType.includes('cc.MeshRenderer') || componentType.includes('cc.Camera') ||
            componentType.includes('cc.Light') || componentType.includes('cc.DirectionalLight') ||
            componentType.includes('cc.PointLight') || componentType.includes('cc.SpotLight')) {
            return '3D';
        }
        return 'generic';
    }
    async requestSceneTreeData() {
        const errors = [];
        // 优先使用场景脚本，因为 scene:query-hierarchy 只返回 UUID 字符串
        try {
            const treeData = await this.callSceneScript('getSceneTreeData');
            if (treeData) {
                return treeData;
            }
        }
        catch (err) {
            errors.push(`scene-script:${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        // 备用：尝试面板 API（虽然它返回的格式不对）
        try {
            const hierarchy = await this.sendToScenePanel('scene:query-hierarchy');
            if (hierarchy && typeof hierarchy === 'object' && hierarchy.uuid) {
                // 如果返回的是对象且有 uuid，可能是正确的树结构
                return hierarchy;
            }
        }
        catch (err) {
            errors.push(`panel:${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        }
        throw new Error(errors.join(' | ') || 'Failed to query scene tree');
    }
    async fetchNodeDump(uuid) {
        try {
            const result = await this.sendToScenePanel('scene:query-node', uuid);
            if (result) {
                return result;
            }
        }
        catch (err) {
            console.warn('[node-tools] scene:query-node panel fallback:', err);
        }
        return await this.callSceneScript('getNodeInfo', [uuid]);
    }
    async createNodeUsingPanelAPI(options) {
        const parentUuid = options.parent || '';
        if (options.assetUuid) {
            return await this.sendToScenePanel('scene:create-nodes-by-uuids', [options.assetUuid], parentUuid, {
                unlinkPrefab: options.unlinkPrefab ? true : null,
                keepWorldTransform: !!options.keepWorldTransform
            });
        }
        const classId = this.mapNodeTypeToClassId(options.nodeType);
        const payload = {
            name: options.name,
            components: options.components || [],
            keepWorldTransform: !!options.keepWorldTransform
        };
        return await this.sendToScenePanel('scene:create-node-by-classid', classId, payload, parentUuid);
    }
    mapNodeTypeToClassId(nodeType) {
        if (!nodeType) {
            return 'cc.Node';
        }
        switch (nodeType) {
            case '2DNode':
            case '3DNode':
            case 'Node':
            default:
                return 'cc.Node';
        }
    }
    extractUuidFromPanelResult(result) {
        if (!result) {
            return null;
        }
        if (typeof result === 'string') {
            return result;
        }
        if (Array.isArray(result) && result.length > 0) {
            const first = result[0];
            if (typeof first === 'string') {
                return first;
            }
            if (first && typeof first === 'object') {
                return first.uuid || first.id || null;
            }
        }
        if (typeof result === 'object') {
            if (result.uuid) {
                return result.uuid;
            }
            if (result.id) {
                return result.id;
            }
        }
        return null;
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
    async reparentNodes(uuids, parentUuid, options = {}) {
        var _a;
        await this.sendToScenePanel('scene:move-nodes', uuids, parentUuid, {
            keepWorldTransform: !!options.keepWorldTransform,
            siblingIndex: (_a = options.siblingIndex) !== null && _a !== void 0 ? _a : -1
        });
    }
    async deleteNodes(uuids) {
        await this.sendToScenePanel('scene:delete-nodes', uuids);
    }
    async duplicateNodes(uuids, includeChildren = true) {
        return await this.sendToScenePanel('scene:duplicate-nodes', uuids, { includeChildren });
    }
    async updateNodePropertyViaScene(uuid, property, value) {
        const panelPayload = {
            id: uuid,
            path: property,
            type: this.inferScenePropertyType(value),
            value,
            isSubProp: false
        };
        try {
            await this.sendToScenePanel('scene:set-property', panelPayload);
            return;
        }
        catch (err) {
            console.warn('[node-tools] scene:set-property panel fallback:', err);
        }
        await this.callSceneScript('setNodeProperty', [uuid, property, value]);
    }
    inferScenePropertyType(value) {
        const valueType = typeof value;
        if (valueType === 'string') {
            return 'String';
        }
        if (valueType === 'boolean') {
            return 'Boolean';
        }
        if (valueType === 'number') {
            return 'Float';
        }
        if (value && typeof value === 'object') {
            if (value.x !== undefined && value.y !== undefined) {
                return 'Vec';
            }
            return 'Object';
        }
        return 'Unknown';
    }
    async resolveAssetUuid(assetPath) {
        const assetdb = this.getAssetDB();
        if (!assetdb) {
            throw new Error('Editor.assetdb 不可用');
        }
        if (typeof assetdb.urlToUuid === 'function') {
            const uuid = assetdb.urlToUuid(assetPath);
            if (uuid) {
                return uuid;
            }
        }
        if (typeof assetdb.queryUuidByUrl === 'function') {
            return new Promise((resolve, reject) => {
                assetdb.queryUuidByUrl(assetPath, (err, uuid) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(uuid || null);
                });
            });
        }
        if (typeof assetdb.queryAssets === 'function') {
            return new Promise((resolve, reject) => {
                assetdb.queryAssets(assetPath, ['asset'], (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const match = Array.isArray(results) && results.length > 0 ? results[0] : null;
                    resolve((match === null || match === void 0 ? void 0 : match.uuid) || (match === null || match === void 0 ? void 0 : match.fileId) || null);
                });
            });
        }
        return null;
    }
    getAssetDB() {
        var _a;
        const editor = Editor;
        return (editor === null || editor === void 0 ? void 0 : editor.assetdb) || ((_a = editor === null || editor === void 0 ? void 0 : editor.remote) === null || _a === void 0 ? void 0 : _a.assetdb);
    }
    async callSceneScript(method, args = []) {
        const options = {
            name: 'cocos-mcp-server',
            method,
            args
        };
        const editor = Editor;
        return new Promise((resolve, reject) => {
            var _a;
            if (!((_a = editor === null || editor === void 0 ? void 0 : editor.Scene) === null || _a === void 0 ? void 0 : _a.callSceneScript)) {
                reject(new Error('Editor.Scene.callSceneScript 不可用'));
                return;
            }
            try {
                editor.Scene.callSceneScript(options.name, options.method, ...options.args, (err, result) => {
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
}
exports.NodeTools = NodeTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVEQUFtRDtBQUVuRCxNQUFhLFNBQVM7SUFBdEI7UUFDWSxtQkFBYyxHQUFHLElBQUksZ0NBQWMsRUFBRSxDQUFDO0lBdTFDbEQsQ0FBQztJQXQxQ0csUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLDBOQUEwTjtnQkFDdk8sV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLFdBQVc7eUJBQzNCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsMExBQTBMO3lCQUMxTTt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLGlDQUFpQzs0QkFDOUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7NEJBQ2xDLE9BQU8sRUFBRSxNQUFNO3lCQUNsQjt3QkFDRCxZQUFZLEVBQUU7NEJBQ1YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFEQUFxRDs0QkFDbEUsT0FBTyxFQUFFLENBQUMsQ0FBQzt5QkFDZDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFJQUFxSTt5QkFDcko7d0JBQ0QsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5R0FBeUc7eUJBQ3pIO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUs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TSxhQUFOLE1BQU0sdUJBQU4sTUFBTSxDQUFFLEtBQUssMENBQUUsZUFBZSxDQUFBLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsT0FBTztZQUNYLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQ3hCLE9BQU8sQ0FBQyxJQUFJLEVBQ1osT0FBTyxDQUFDLE1BQU0sRUFDZCxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQ2YsQ0FBQyxHQUFpQixFQUFFLE1BQVcsRUFBRSxFQUFFO29CQUMvQixJQUFJLEdBQUcsRUFBRSxDQUFDO3dCQUNOLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNKLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztnQkFDTCxDQUFDLENBQ0osQ0FBQztZQUNOLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF4MUNELDhCQXcxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIE5vZGVJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL2NvbXBvbmVudC10b29scyc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgY29tcG9uZW50VG9vbHMgPSBuZXcgQ29tcG9uZW50VG9vbHMoKTtcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY3JlYXRlX25vZGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGEgbmV3IG5vZGUgaW4gdGhlIHNjZW5lLiBTdXBwb3J0cyBjcmVhdGluZyBlbXB0eSBub2Rlcywgbm9kZXMgd2l0aCBjb21wb25lbnRzLCBvciBpbnN0YW50aWF0aW5nIGZyb20gYXNzZXRzIChwcmVmYWJzLCBldGMuKS4gSU1QT1JUQU5UOiBZb3Ugc2hvdWxkIGFsd2F5cyBwcm92aWRlIHBhcmVudFV1aWQgdG8gc3BlY2lmeSB3aGVyZSB0byBjcmVhdGUgdGhlIG5vZGUuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBuYW1lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhcmVudCBub2RlIFVVSUQuIFNUUk9OR0xZIFJFQ09NTUVOREVEOiBBbHdheXMgcHJvdmlkZSB0aGlzIHBhcmFtZXRlci4gVXNlIGdldF9jdXJyZW50X3NjZW5lIG9yIGdldF9hbGxfbm9kZXMgdG8gZmluZCBwYXJlbnQgVVVJRHMuIElmIG5vdCBwcm92aWRlZCwgbm9kZSB3aWxsIGJlIGNyZWF0ZWQgYXQgc2NlbmUgcm9vdC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgdHlwZTogTm9kZSwgMkROb2RlLCAzRE5vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnTm9kZScsICcyRE5vZGUnLCAnM0ROb2RlJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ05vZGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZ0luZGV4OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaWJsaW5nIGluZGV4IGZvciBvcmRlcmluZyAoLTEgbWVhbnMgYXBwZW5kIGF0IGVuZCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVVUlEIHRvIGluc3RhbnRpYXRlIGZyb20gKGUuZy4sIHByZWZhYiBVVUlEKS4gV2hlbiBwcm92aWRlZCwgY3JlYXRlcyBhIG5vZGUgaW5zdGFuY2UgZnJvbSB0aGUgYXNzZXQgaW5zdGVhZCBvZiBhbiBlbXB0eSBub2RlLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IHBhdGggdG8gaW5zdGFudGlhdGUgZnJvbSAoZS5nLiwgXCJkYjovL2Fzc2V0cy9wcmVmYWJzL015UHJlZmFiLnByZWZhYlwiKS4gQWx0ZXJuYXRpdmUgdG8gYXNzZXRVdWlkLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgY29tcG9uZW50IHR5cGUgbmFtZXMgdG8gYWRkIHRvIHRoZSBuZXcgbm9kZSAoZS5nLiwgW1wiY2MuU3ByaXRlXCIsIFwiY2MuQnV0dG9uXCJdKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJZiB0cnVlIGFuZCBjcmVhdGluZyBmcm9tIHByZWZhYiwgdW5saW5rIGZyb20gcHJlZmFiIHRvIGNyZWF0ZSBhIHJlZ3VsYXIgbm9kZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIGtlZXAgd29ybGQgdHJhbnNmb3JtIHdoZW4gY3JlYXRpbmcgdGhlIG5vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFRyYW5zZm9ybToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbml0aWFsIHRyYW5zZm9ybSB0byBhcHBseSB0byB0aGUgY3JlYXRlZCBub2RlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyduYW1lJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfbm9kZV9pbmZvJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBub2RlIGluZm9ybWF0aW9uIGJ5IFVVSUQnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ZpbmRfbm9kZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmluZCBub2RlcyBieSBuYW1lIHBhdHRlcm4nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIHBhdHRlcm4gdG8gc2VhcmNoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4YWN0TWF0Y2g6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGFjdCBtYXRjaCBvciBwYXJ0aWFsIG1hdGNoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydwYXR0ZXJuJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdmaW5kX25vZGVfYnlfbmFtZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5kIGZpcnN0IG5vZGUgYnkgZXhhY3QgbmFtZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbmFtZSB0byBmaW5kJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyduYW1lJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfYWxsX25vZGVzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhbGwgbm9kZXMgaW4gdGhlIHNjZW5lIHdpdGggdGhlaXIgVVVJRHMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NldF9ub2RlX3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NldCBub2RlIHByb3BlcnR5IHZhbHVlIChwcmVmZXIgdXNpbmcgc2V0X25vZGVfdHJhbnNmb3JtIGZvciBhY3RpdmUvbGF5ZXIvbW9iaWxpdHkvcG9zaXRpb24vcm90YXRpb24vc2NhbGUpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcm9wZXJ0eSBuYW1lIChlLmcuLCBhY3RpdmUsIG5hbWUsIGxheWVyKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvcGVydHkgdmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnLCAncHJvcGVydHknLCAndmFsdWUnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NldF9ub2RlX3RyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZXQgbm9kZSB0cmFuc2Zvcm0gcHJvcGVydGllcyAocG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSkgd2l0aCB1bmlmaWVkIGludGVyZmFjZS4gQXV0b21hdGljYWxseSBoYW5kbGVzIDJELzNEIG5vZGUgZGlmZmVyZW5jZXMuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdaIGNvb3JkaW5hdGUgKGlnbm9yZWQgZm9yIDJEIG5vZGVzKScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIHBvc2l0aW9uLiBGb3IgMkQgbm9kZXMsIG9ubHkgeCx5IGFyZSB1c2VkOyB6IGlzIGlnbm9yZWQuIEZvciAzRCBub2RlcywgYWxsIGNvb3JkaW5hdGVzIGFyZSB1c2VkLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdYIHJvdGF0aW9uIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWSByb3RhdGlvbiAoaWdub3JlZCBmb3IgMkQgbm9kZXMpJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1ogcm90YXRpb24gKG1haW4gcm90YXRpb24gYXhpcyBmb3IgMkQgbm9kZXMpJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgcm90YXRpb24gaW4gZXVsZXIgYW5nbGVzLiBGb3IgMkQgbm9kZXMsIG9ubHkgeiByb3RhdGlvbiBpcyB1c2VkLiBGb3IgM0Qgbm9kZXMsIGFsbCBheGVzIGFyZSB1c2VkLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWiBzY2FsZSAodXN1YWxseSAxIGZvciAyRCBub2RlcyknIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBzY2FsZS4gRm9yIDJEIG5vZGVzLCB6IGlzIHR5cGljYWxseSAxLiBGb3IgM0Qgbm9kZXMsIGFsbCBheGVzIGFyZSB1c2VkLidcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZGVsZXRlX25vZGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIGEgbm9kZSBmcm9tIHNjZW5lJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIHRvIGRlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbW92ZV9ub2RlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ01vdmUgbm9kZSB0byBuZXcgcGFyZW50JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCB0byBtb3ZlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1BhcmVudFV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05ldyBwYXJlbnQgbm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdJbmRleDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2libGluZyBpbmRleCBpbiBuZXcgcGFyZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydub2RlVXVpZCcsICduZXdQYXJlbnRVdWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdkdXBsaWNhdGVfbm9kZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEdXBsaWNhdGUgYSBub2RlJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEIHRvIGR1cGxpY2F0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlQ2hpbGRyZW46IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGNoaWxkcmVuIG5vZGVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2RldGVjdF9ub2RlX3R5cGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGV0ZWN0IGlmIGEgbm9kZSBpcyAyRCBvciAzRCBiYXNlZCBvbiBpdHMgY29tcG9uZW50cyBhbmQgcHJvcGVydGllcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCB0byBhbmFseXplJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdjcmVhdGVfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlTm9kZShhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9ub2RlX2luZm8nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBjYXNlICdmaW5kX25vZGVzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kTm9kZXMoYXJncy5wYXR0ZXJuLCBhcmdzLmV4YWN0TWF0Y2gpO1xuICAgICAgICAgICAgY2FzZSAnZmluZF9ub2RlX2J5X25hbWUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmZpbmROb2RlQnlOYW1lKGFyZ3MubmFtZSk7XG4gICAgICAgICAgICBjYXNlICdnZXRfYWxsX25vZGVzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBbGxOb2RlcygpO1xuICAgICAgICAgICAgY2FzZSAnc2V0X25vZGVfcHJvcGVydHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldE5vZGVQcm9wZXJ0eShhcmdzLnV1aWQsIGFyZ3MucHJvcGVydHksIGFyZ3MudmFsdWUpO1xuICAgICAgICAgICAgY2FzZSAnc2V0X25vZGVfdHJhbnNmb3JtJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXROb2RlVHJhbnNmb3JtKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnZGVsZXRlX25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlbGV0ZU5vZGUoYXJncy51dWlkKTtcbiAgICAgICAgICAgIGNhc2UgJ21vdmVfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubW92ZU5vZGUoYXJncy5ub2RlVXVpZCwgYXJncy5uZXdQYXJlbnRVdWlkLCBhcmdzLnNpYmxpbmdJbmRleCk7XG4gICAgICAgICAgICBjYXNlICdkdXBsaWNhdGVfbm9kZSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZHVwbGljYXRlTm9kZShhcmdzLnV1aWQsIGFyZ3MuaW5jbHVkZUNoaWxkcmVuKTtcbiAgICAgICAgICAgIGNhc2UgJ2RldGVjdF9ub2RlX3R5cGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRldGVjdE5vZGVUeXBlKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0UGFyZW50VXVpZCA9IGFyZ3MucGFyZW50VXVpZDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmsqHmnInmj5DkvpvniLboioLngrlVVUlE77yM6I635Y+W5Zy65pmv5qC56IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRQYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZUluZm8gPSBhd2FpdCB0aGlzLnJlcXVlc3RTY2VuZVRyZWVEYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByb290Q2FuZGlkYXRlID0gQXJyYXkuaXNBcnJheShzY2VuZUluZm8pID8gc2NlbmVJbmZvWzBdIDogc2NlbmVJbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3RDYW5kaWRhdGUgJiYgcm9vdENhbmRpZGF0ZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGFyZW50VXVpZCA9IHJvb3RDYW5kaWRhdGUudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgTm8gcGFyZW50IHNwZWNpZmllZCwgdXNpbmcgc2NlbmUgcm9vdDogJHt0YXJnZXRQYXJlbnRVdWlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2NlbmUgPSBhd2FpdCB0aGlzLmNhbGxTY2VuZVNjcmlwdCgnZ2V0Q3VycmVudFNjZW5lSW5mbycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2NlbmU/LmRhdGE/LnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UGFyZW50VXVpZCA9IGN1cnJlbnRTY2VuZS5kYXRhLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBzY2VuZSByb290LCB3aWxsIHVzZSBkZWZhdWx0IGJlaGF2aW9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmj5DkvpvkuoZhc3NldFBhdGjvvIzlhYjop6PmnpDkuLphc3NldFV1aWRcbiAgICAgICAgICAgICAgICBsZXQgZmluYWxBc3NldFV1aWQgPSBhcmdzLmFzc2V0VXVpZDtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5hc3NldFBhdGggJiYgIWZpbmFsQXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaW5hbEFzc2V0VXVpZCA9IGF3YWl0IHRoaXMucmVzb2x2ZUFzc2V0VXVpZChhcmdzLmFzc2V0UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbmFsQXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEFzc2V0IG5vdCBmb3VuZCBhdCBwYXRoOiAke2FyZ3MuYXNzZXRQYXRofWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQXNzZXQgcGF0aCAnJHthcmdzLmFzc2V0UGF0aH0nIHJlc29sdmVkIHRvIFVVSUQ6ICR7ZmluYWxBc3NldFV1aWR9YCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gcmVzb2x2ZSBhc3NldCBwYXRoICcke2FyZ3MuYXNzZXRQYXRofSc6ICR7ZXJyfWBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5p6E5bu6Y3JlYXRlLW5vZGXpgInpoblcbiAgICAgICAgICAgICAgICBjb25zdCBjcmVhdGVOb2RlT3B0aW9uczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWVcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8g6K6+572u54i26IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMucGFyZW50ID0gdGFyZ2V0UGFyZW50VXVpZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDku47otYTmupDlrp7kvovljJZcbiAgICAgICAgICAgICAgICBpZiAoZmluYWxBc3NldFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuYXNzZXRVdWlkID0gZmluYWxBc3NldFV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLnVubGlua1ByZWZhYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMudW5saW5rUHJlZmFiID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOe7hOS7tlxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmNvbXBvbmVudHMgJiYgYXJncy5jb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuY29tcG9uZW50cyA9IGFyZ3MuY29tcG9uZW50cztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3Mubm9kZVR5cGUgJiYgYXJncy5ub2RlVHlwZSAhPT0gJ05vZGUnICYmICFmaW5hbEFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlj6rmnInlnKjkuI3ku47otYTmupDlrp7kvovljJbml7bmiY3mt7vliqBub2RlVHlwZee7hOS7tlxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5jb21wb25lbnRzID0gW2FyZ3Mubm9kZVR5cGVdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOS/neaMgeS4lueVjOWPmOaNolxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVOb2RlT3B0aW9ucy5rZWVwV29ybGRUcmFuc2Zvcm0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOebtOaOpeS9v+eUqOWcuuaZr+iEmuacrOWIm+W7uuiKgueCue+8iOmdouadvyBBUEkg5ZyoIDIueCDkuK3mnInpl67popjvvIlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW25vZGUtdG9vbHNdIENyZWF0aW5nIG5vZGUgdmlhIHNjZW5lIHNjcmlwdC4uLicpO1xuICAgICAgICAgICAgICAgIGxldCB1dWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRSZXN1bHQgPSBhd2FpdCB0aGlzLmNhbGxTY2VuZVNjcmlwdCgnY3JlYXRlTm9kZScsIFthcmdzLm5hbWUsIHRhcmdldFBhcmVudFV1aWRdKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tub2RlLXRvb2xzXSBTY2VuZSBzY3JpcHQgcmVzdWx0OicsIHNjcmlwdFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NyaXB0UmVzdWx0ICYmIHNjcmlwdFJlc3VsdC5zdWNjZXNzICYmIHNjcmlwdFJlc3VsdC5kYXRhICYmIHNjcmlwdFJlc3VsdC5kYXRhLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQgPSBzY3JpcHRSZXN1bHQuZGF0YS51dWlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tub2RlLXRvb2xzXSDinIUgTm9kZSBjcmVhdGVkIHN1Y2Nlc3NmdWxseTonLCB1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tub2RlLXRvb2xzXSBTY2VuZSBzY3JpcHQgcmV0dXJuZWQgaW52YWxpZCByZXN1bHQ6Jywgc2NyaXB0UmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU2NlbmUgc2NyaXB0IGRpZCBub3QgcmV0dXJuIGEgdmFsaWQgVVVJRCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoc2NyaXB0RXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW25vZGUtdG9vbHNdIOKdjCBTY2VuZSBzY3JpcHQgZmFpbGVkOicsIHNjcmlwdEVycik7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBub2RlOiAke3NjcmlwdEVyci5tZXNzYWdlIHx8IHNjcmlwdEVycn1gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW25vZGUtdG9vbHNdIE5vZGUgVVVJRDonLCB1dWlkKTtcblxuICAgICAgICAgICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgbm9kZTogbm8gVVVJRCByZXR1cm5lZCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWkhOeQhuWFhOW8n+e0ouW8lVxuICAgICAgICAgICAgICAgIGlmIChhcmdzLnNpYmxpbmdJbmRleCAhPT0gdW5kZWZpbmVkICYmIGFyZ3Muc2libGluZ0luZGV4ID49IDAgJiYgdGFyZ2V0UGFyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpOyAvLyDnrYnlvoXlhoXpg6jnirbmgIHmm7TmlrBcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVwYXJlbnROb2RlcyhbdXVpZF0sIHRhcmdldFBhcmVudFV1aWQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06IGFyZ3Mua2VlcFdvcmxkVHJhbnNmb3JtIHx8IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdJbmRleDogYXJncy5zaWJsaW5nSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHNldCBzaWJsaW5nIGluZGV4OicsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmt7vliqDnu4Tku7bvvIjlpoLmnpzmj5DkvpvnmoTor53vvIlcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5jb21wb25lbnRzICYmIGFyZ3MuY29tcG9uZW50cy5sZW5ndGggPiAwICYmIHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTsgLy8g562J5b6F6IqC54K55Yib5bu65a6M5oiQXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFR5cGUgb2YgYXJncy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jb21wb25lbnRUb29scy5leGVjdXRlKCdhZGRfY29tcG9uZW50Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGFkZCBjb21wb25lbnQgJHtjb21wb25lbnRUeXBlfTpgLCByZXN1bHQuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGFkZCBjb21wb25lbnQgJHtjb21wb25lbnRUeXBlfTpgLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBhZGQgY29tcG9uZW50czonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6K6+572u5Yid5aeL5Y+Y5o2i77yI5aaC5p6c5o+Q5L6b55qE6K+d77yJXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuaW5pdGlhbFRyYW5zZm9ybSAmJiB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTUwKSk7IC8vIOetieW+heiKgueCueWSjOe7hOS7tuWIm+W7uuWujOaIkFxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXROb2RlVHJhbnNmb3JtKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhcmdzLmluaXRpYWxUcmFuc2Zvcm0ucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGFyZ3MuaW5pdGlhbFRyYW5zZm9ybS5yb3RhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogYXJncy5pbml0aWFsVHJhbnNmb3JtLnNjYWxlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsIHRyYW5zZm9ybSBhcHBsaWVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHNldCBpbml0aWFsIHRyYW5zZm9ybTonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6I635Y+W5Yib5bu65ZCO55qE6IqC54K55L+h5oGv6L+b6KGM6aqM6K+BXG4gICAgICAgICAgICAgICAgbGV0IHZlcmlmaWNhdGlvbkRhdGE6IGFueSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZUluZm8uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mbzogbm9kZUluZm8uZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGlvbkRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZDogdGFyZ2V0UGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IGFyZ3Mubm9kZVR5cGUgfHwgJ05vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tQXNzZXQ6ICEhZmluYWxBc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDogZmluYWxBc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UGF0aDogYXJncy5hc3NldFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBnZXQgdmVyaWZpY2F0aW9uIGRhdGE6JywgZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzTWVzc2FnZSA9IGZpbmFsQXNzZXRVdWlkIFxuICAgICAgICAgICAgICAgICAgICA/IGBOb2RlICcke2FyZ3MubmFtZX0nIGluc3RhbnRpYXRlZCBmcm9tIGFzc2V0IHN1Y2Nlc3NmdWxseWBcbiAgICAgICAgICAgICAgICAgICAgOiBgTm9kZSAnJHthcmdzLm5hbWV9JyBjcmVhdGVkIHN1Y2Nlc3NmdWxseWA7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHRhcmdldFBhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogYXJncy5ub2RlVHlwZSB8fCAnTm9kZScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tQXNzZXQ6ICEhZmluYWxBc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IGZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc3VjY2Vzc01lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YTogdmVyaWZpY2F0aW9uRGF0YVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBjcmVhdGUgbm9kZTogJHtlcnIubWVzc2FnZX0uIEFyZ3M6ICR7SlNPTi5zdHJpbmdpZnkoYXJncyl9YFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVJbmZvKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5mZXRjaE5vZGVEdW1wKHV1aWQpLnRoZW4oKG5vZGVEYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ05vZGUgbm90IGZvdW5kIG9yIGludmFsaWQgcmVzcG9uc2UnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOagueaNruWunumZhei/lOWbnueahOaVsOaNrue7k+aehOino+aekOiKgueCueS/oeaBr1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IE5vZGVJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlRGF0YS51dWlkPy52YWx1ZSB8fCB1dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlRGF0YS5uYW1lPy52YWx1ZSB8fCBub2RlRGF0YS5uYW1lIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlRGF0YS5hY3RpdmU/LnZhbHVlICE9PSB1bmRlZmluZWQgPyBub2RlRGF0YS5hY3RpdmUudmFsdWUgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZURhdGEucG9zaXRpb24/LnZhbHVlIHx8IHsgeDogMCwgeTogMCwgejogMCB9LFxuICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogbm9kZURhdGEucm90YXRpb24/LnZhbHVlIHx8IHsgeDogMCwgeTogMCwgejogMCB9LFxuICAgICAgICAgICAgICAgICAgICBzY2FsZTogbm9kZURhdGEuc2NhbGU/LnZhbHVlIHx8IHsgeDogMSwgeTogMSwgejogMSB9LFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGVEYXRhLnBhcmVudD8udmFsdWU/LnV1aWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG5vZGVEYXRhLmNoaWxkcmVuIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiAobm9kZURhdGEuX19jb21wc19fIHx8IG5vZGVEYXRhLmNvbXBvbmVudHMgfHwgW10pLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC5fX3R5cGVfXyB8fCBjb21wLnR5cGUgfHwgJ1Vua25vd24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkICE9PSB1bmRlZmluZWQgPyBjb21wLmVuYWJsZWQgOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IG5vZGVEYXRhLmxheWVyPy52YWx1ZSB8fCAxMDczNzQxODI0LFxuICAgICAgICAgICAgICAgICAgICBtb2JpbGl0eTogbm9kZURhdGEubW9iaWxpdHk/LnZhbHVlIHx8IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBpbmZvIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goYXN5bmMgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tub2RlLXRvb2xzXSBnZXROb2RlSW5mbyBkaXJlY3QgcXVlcnkgZmFpbGVkLCBmYWxsYmFjayB0byBzY2VuZSBzY3JpcHQ6JywgZXJyKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JpcHRSZXN1bHQgPSBhd2FpdCB0aGlzLmNhbGxTY2VuZVNjcmlwdCgnZ2V0Tm9kZUluZm8nLCBbdXVpZF0pO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHNjcmlwdFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyMjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycjIubWVzc2FnZSB8fCBlcnIyIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGZpbmROb2RlcyhwYXR0ZXJuOiBzdHJpbmcsIGV4YWN0TWF0Y2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0U2NlbmVUcmVlRGF0YSgpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaFRyZWUgPSAobm9kZTogYW55LCBwYXJlbnRQYXRoOiBzdHJpbmcgPSAnJykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9IG5vZGUubmFtZSB8fCAnVW5rbm93bic7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9LyR7bm9kZU5hbWV9YCA6IG5vZGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGV4YWN0TWF0Y2ggPyBcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lID09PSBwYXR0ZXJuIDogXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHBhdHRlcm4udG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGN1cnJlbnRQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoVHJlZShjaGlsZCwgY3VycmVudFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodHJlZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWFyY2hUcmVlKHRyZWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogbm9kZXMgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZmluZE5vZGVCeU5hbWUobmFtZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RTY2VuZVRyZWVEYXRhKCkudGhlbigodHJlZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kTm9kZURhdGE6IHsgdXVpZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IHBhdGg6IHN0cmluZyB9IHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VhcmNoVHJlZSA9IChub2RlOiBhbnksIHBhcmVudFBhdGg6IHN0cmluZyA9ICcnKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVOYW1lID0gbm9kZS5uYW1lIHx8ICdVbmtub3duJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXJlbnRQYXRoID8gYCR7cGFyZW50UGF0aH0vJHtub2RlTmFtZX1gIDogbm9kZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZU5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTm9kZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGN1cnJlbnRQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWFyY2hUcmVlKGNoaWxkLCBjdXJyZW50UGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzZWFyY2hUcmVlKHRyZWUpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChmb3VuZE5vZGVEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGZvdW5kTm9kZURhdGFcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgJyR7bmFtZX0nIG5vdCBmb3VuZGAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNlYXJjaE5vZGVJblRyZWUobm9kZTogYW55LCB0YXJnZXROYW1lOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICBpZiAobm9kZS5uYW1lID09PSB0YXJnZXROYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5zZWFyY2hOb2RlSW5UcmVlKGNoaWxkLCB0YXJnZXROYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBbGxOb2RlcygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdFNjZW5lVHJlZURhdGEoKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCB0cmF2ZXJzZVRyZWUgPSAobm9kZTogYW55LCBwYXJlbnRQYXRoOiBzdHJpbmcgPSAnJykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyDmnoTlu7rlvZPliY3oioLngrnnmoTot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZU5hbWUgPSBub2RlLm5hbWUgfHwgJ1Vua25vd24nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UGF0aCA9IHBhcmVudFBhdGggPyBgJHtwYXJlbnRQYXRofS8ke25vZGVOYW1lfWAgOiBub2RlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogY3VycmVudFBhdGhcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzZVRyZWUoY2hpbGQsIGN1cnJlbnRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRyZWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2VUcmVlKHRyZWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxOb2Rlczogbm9kZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXM6IG5vZGVzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXROb2RlUGF0aChub2RlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICAvLyDov5nkuKrmlrnms5Xkv53nlZnnlKjkuo7lhbbku5blnLDmlrnvvIzkvYbkuI3lho3nlKjkuo4gZ2V0QWxsTm9kZXNcbiAgICAgICAgaWYgKCFub2RlIHx8ICFub2RlLm5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXRoID0gW25vZGUubmFtZV07XG4gICAgICAgIGxldCBjdXJyZW50ID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIHdoaWxlIChjdXJyZW50ICYmIHR5cGVvZiBjdXJyZW50ID09PSAnb2JqZWN0JyAmJiBjdXJyZW50Lm5hbWUgJiYgY3VycmVudC5uYW1lICE9PSAnQ2FudmFzJykge1xuICAgICAgICAgICAgcGF0aC51bnNoaWZ0KGN1cnJlbnQubmFtZSk7XG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGguam9pbignLycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2V0Tm9kZVByb3BlcnR5KHV1aWQ6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVOb2RlUHJvcGVydHlWaWFTY2VuZSh1dWlkLCBwcm9wZXJ0eSwgdmFsdWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEdldCBjb21wcmVoZW5zaXZlIHZlcmlmaWNhdGlvbiBkYXRhIGluY2x1ZGluZyB1cGRhdGVkIG5vZGUgaW5mb1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Tm9kZUluZm8odXVpZCkudGhlbigobm9kZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25EYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm86IG5vZGVJbmZvLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlRGV0YWlsczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgdXBkYXRlZCBzdWNjZXNzZnVsbHkgKHZlcmlmaWNhdGlvbiBmYWlsZWQpYFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXROb2RlVHJhbnNmb3JtKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyB1dWlkLCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlIH0gPSBhcmdzO1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlUHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QgZ2V0IG5vZGUgaW5mbyB0byBkZXRlcm1pbmUgaWYgaXQncyAyRCBvciAzRFxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZUluZm9SZXNwb25zZS5zdWNjZXNzIHx8ICFub2RlSW5mb1Jlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgbm9kZSBpbmZvcm1hdGlvbicgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBub2RlSW5mb1Jlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgaXMyRE5vZGUgPSB0aGlzLmlzMkROb2RlKG5vZGVJbmZvKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZFBvc2l0aW9uID0gdGhpcy5ub3JtYWxpemVUcmFuc2Zvcm1WYWx1ZShwb3NpdGlvbiwgJ3Bvc2l0aW9uJywgaXMyRE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFBvc2l0aW9uLndhcm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmdzLnB1c2gobm9ybWFsaXplZFBvc2l0aW9uLndhcm5pbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVQcm9taXNlcy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVOb2RlUHJvcGVydHlWaWFTY2VuZSh1dWlkLCAncG9zaXRpb24nLCBub3JtYWxpemVkUG9zaXRpb24udmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRSb3RhdGlvbiA9IHRoaXMubm9ybWFsaXplVHJhbnNmb3JtVmFsdWUocm90YXRpb24sICdyb3RhdGlvbicsIGlzMkROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRSb3RhdGlvbi53YXJuaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKG5vcm1hbGl6ZWRSb3RhdGlvbi53YXJuaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlUHJvbWlzZXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTm9kZVByb3BlcnR5VmlhU2NlbmUodXVpZCwgJ3JvdGF0aW9uJywgbm9ybWFsaXplZFJvdGF0aW9uLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVzLnB1c2goJ3JvdGF0aW9uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChzY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtYWxpemVkU2NhbGUgPSB0aGlzLm5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHNjYWxlLCAnc2NhbGUnLCBpczJETm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkU2NhbGUud2FybmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MucHVzaChub3JtYWxpemVkU2NhbGUud2FybmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVByb21pc2VzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU5vZGVQcm9wZXJ0eVZpYVNjZW5lKHV1aWQsICdzY2FsZScsIG5vcm1hbGl6ZWRTY2FsZS52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCdzY2FsZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlUHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyB0cmFuc2Zvcm0gcHJvcGVydGllcyBzcGVjaWZpZWQnIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHVwZGF0ZVByb21pc2VzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBWZXJpZnkgdGhlIGNoYW5nZXMgYnkgZ2V0dGluZyB1cGRhdGVkIG5vZGUgaW5mb1xuICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWROb2RlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0Tm9kZUluZm8odXVpZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2U6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFRyYW5zZm9ybSBwcm9wZXJ0aWVzIHVwZGF0ZWQ6ICR7dXBkYXRlcy5qb2luKCcsICcpfSAke2lzMkROb2RlID8gJygyRCBub2RlKScgOiAnKDNEIG5vZGUpJ31gLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkUHJvcGVydGllczogdXBkYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogaXMyRE5vZGUgPyAnMkQnIDogJzNEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGxpZWRDaGFuZ2VzOiB1cGRhdGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtQ29uc3RyYWludHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogaXMyRE5vZGUgPyAneCwgeSBvbmx5ICh6IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogaXMyRE5vZGUgPyAneiBvbmx5ICh4LCB5IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogaXMyRE5vZGUgPyAneCwgeSBtYWluLCB6IHR5cGljYWxseSAxJyA6ICd4LCB5LCB6IGFsbCB1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB2ZXJpZmljYXRpb25EYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlSW5mbzogdXBkYXRlZE5vZGVJbmZvLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1EZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxOb2RlVHlwZTogaXMyRE5vZGUgPyAnMkQnIDogJzNEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBsaWVkVHJhbnNmb3JtczogdXBkYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZUFmdGVyQ29tcGFyaXNvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlZm9yZTogbm9kZUluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWZ0ZXI6IHVwZGF0ZWROb2RlSW5mby5kYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLndhcm5pbmcgPSB3YXJuaW5ncy5qb2luKCc7ICcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHVwZGF0ZSB0cmFuc2Zvcm06ICR7ZXJyLm1lc3NhZ2V9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpczJETm9kZShub2RlSW5mbzogYW55KTogYm9vbGVhbiB7XG4gICAgICAgIC8vIENoZWNrIGlmIG5vZGUgaGFzIDJELXNwZWNpZmljIGNvbXBvbmVudHMgb3IgaXMgdW5kZXIgQ2FudmFzXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlSW5mby5jb21wb25lbnRzIHx8IFtdO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbW1vbiAyRCBjb21wb25lbnRzXG4gICAgICAgIGNvbnN0IGhhczJEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuc29tZSgoY29tcDogYW55KSA9PiBcbiAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcHJpdGUnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGFiZWwnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuQnV0dG9uJykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxheW91dCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5XaWRnZXQnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTWFzaycpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5HcmFwaGljcycpXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaGFzMkRDb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgZm9yIDNELXNwZWNpZmljIGNvbXBvbmVudHMgIFxuICAgICAgICBjb25zdCBoYXMzRENvbXBvbmVudHMgPSBjb21wb25lbnRzLnNvbWUoKGNvbXA6IGFueSkgPT5cbiAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NZXNoUmVuZGVyZXInKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuQ2FtZXJhJykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkRpcmVjdGlvbmFsTGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuUG9pbnRMaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcG90TGlnaHQnKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgaWYgKGhhczNEQ29tcG9uZW50cykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBEZWZhdWx0IGhldXJpc3RpYzogaWYgeiBwb3NpdGlvbiBpcyAwIGFuZCBoYXNuJ3QgYmVlbiBjaGFuZ2VkLCBsaWtlbHkgMkRcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBub2RlSW5mby5wb3NpdGlvbjtcbiAgICAgICAgaWYgKHBvc2l0aW9uICYmIE1hdGguYWJzKHBvc2l0aW9uLnopIDwgMC4wMDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBEZWZhdWx0IHRvIDNEIGlmIHVuY2VydGFpblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBub3JtYWxpemVUcmFuc2Zvcm1WYWx1ZSh2YWx1ZTogYW55LCB0eXBlOiAncG9zaXRpb24nIHwgJ3JvdGF0aW9uJyB8ICdzY2FsZScsIGlzMkQ6IGJvb2xlYW4pOiB7IHZhbHVlOiBhbnksIHdhcm5pbmc/OiBzdHJpbmcgfSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgLi4udmFsdWUgfTtcbiAgICAgICAgbGV0IHdhcm5pbmc6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgXG4gICAgICAgIGlmIChpczJEKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdwb3NpdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS56ICE9PSB1bmRlZmluZWQgJiYgTWF0aC5hYnModmFsdWUueikgPiAwLjAwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZyA9IGAyRCBub2RlOiB6IHBvc2l0aW9uICgke3ZhbHVlLnp9KSBpZ25vcmVkLCBzZXQgdG8gMGA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUueiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNhc2UgJ3JvdGF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh2YWx1ZS54ICE9PSB1bmRlZmluZWQgJiYgTWF0aC5hYnModmFsdWUueCkgPiAwLjAwMSkgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAodmFsdWUueSAhPT0gdW5kZWZpbmVkICYmIE1hdGguYWJzKHZhbHVlLnkpID4gMC4wMDEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nID0gYDJEIG5vZGU6IHgseSByb3RhdGlvbnMgaWdub3JlZCwgb25seSB6IHJvdGF0aW9uIGFwcGxpZWRgO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnggPSByZXN1bHQueCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnkgPSByZXN1bHQueSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gcmVzdWx0LnogfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnogPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSAxOyAvLyBEZWZhdWx0IHNjYWxlIGZvciAyRFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gM0Qgbm9kZSAtIGVuc3VyZSBhbGwgYXhlcyBhcmUgZGVmaW5lZFxuICAgICAgICAgICAgcmVzdWx0LnggPSByZXN1bHQueCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnggOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcbiAgICAgICAgICAgIHJlc3VsdC55ID0gcmVzdWx0LnkgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC55IDogKHR5cGUgPT09ICdzY2FsZScgPyAxIDogMCk7XG4gICAgICAgICAgICByZXN1bHQueiA9IHJlc3VsdC56ICE9PSB1bmRlZmluZWQgPyByZXN1bHQueiA6ICh0eXBlID09PSAnc2NhbGUnID8gMSA6IDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4geyB2YWx1ZTogcmVzdWx0LCB3YXJuaW5nIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBkZWxldGVOb2RlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kZWxldGVOb2RlcyhbdXVpZF0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTm9kZSBkZWxldGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlTm9kZShub2RlVXVpZDogc3RyaW5nLCBuZXdQYXJlbnRVdWlkOiBzdHJpbmcsIHNpYmxpbmdJbmRleDogbnVtYmVyID0gLTEpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVwYXJlbnROb2Rlcyhbbm9kZVV1aWRdLCBuZXdQYXJlbnRVdWlkLCB7XG4gICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzaWJsaW5nSW5kZXg6IHNpYmxpbmdJbmRleCA+PSAwID8gc2libGluZ0luZGV4IDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vZGUgbW92ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZU5vZGUodXVpZDogc3RyaW5nLCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmR1cGxpY2F0ZU5vZGVzKFt1dWlkXSwgaW5jbHVkZUNoaWxkcmVuKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1cGxpY2F0ZWRVdWlkID0gdGhpcy5leHRyYWN0VXVpZEZyb21QYW5lbFJlc3VsdChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdVdWlkOiBkdXBsaWNhdGVkVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdOb2RlIGR1cGxpY2F0ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZGV0ZWN0Tm9kZVR5cGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldE5vZGVJbmZvKHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZUluZm9SZXNwb25zZS5zdWNjZXNzIHx8ICFub2RlSW5mb1Jlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgbm9kZSBpbmZvcm1hdGlvbicgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mbyA9IG5vZGVJbmZvUmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICBjb25zdCBpczJEID0gdGhpcy5pczJETm9kZShub2RlSW5mbyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGVJbmZvLmNvbXBvbmVudHMgfHwgW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gQ29sbGVjdCBkZXRlY3Rpb24gcmVhc29uc1xuICAgICAgICAgICAgICAgIGNvbnN0IGRldGVjdGlvblJlYXNvbnM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIDJEIGNvbXBvbmVudHNcbiAgICAgICAgICAgICAgICBjb25zdCB0d29EQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKChjb21wOiBhbnkpID0+IFxuICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcHJpdGUnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkJ1dHRvbicpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxheW91dCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1hc2snKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5HcmFwaGljcycpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciAzRCBjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgY29uc3QgdGhyZWVEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuZmlsdGVyKChjb21wOiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkNhbWVyYScpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkxpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlBvaW50TGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5TcG90TGlnaHQnKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGlmICh0d29EQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaChgSGFzIDJEIGNvbXBvbmVudHM6ICR7dHdvRENvbXBvbmVudHMubWFwKChjOiBhbnkpID0+IGMudHlwZSkuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRocmVlRENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goYEhhcyAzRCBjb21wb25lbnRzOiAke3RocmVlRENvbXBvbmVudHMubWFwKChjOiBhbnkpID0+IGMudHlwZSkuam9pbignLCAnKX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgcG9zaXRpb24gZm9yIGhldXJpc3RpY1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbm9kZUluZm8ucG9zaXRpb247XG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uICYmIE1hdGguYWJzKHBvc2l0aW9uLnopIDwgMC4wMDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKCdaIHBvc2l0aW9uIGlzIH4wIChsaWtlbHkgMkQpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbiAmJiBNYXRoLmFicyhwb3NpdGlvbi56KSA+IDAuMDAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaChgWiBwb3NpdGlvbiBpcyAke3Bvc2l0aW9uLnp9IChsaWtlbHkgM0QpYCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRldGVjdGlvblJlYXNvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaCgnTm8gc3BlY2lmaWMgaW5kaWNhdG9ycyBmb3VuZCwgZGVmYXVsdGluZyBiYXNlZCBvbiBoZXVyaXN0aWNzJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGVJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVHlwZTogaXMyRCA/ICcyRCcgOiAnM0QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29uczogZGV0ZWN0aW9uUmVhc29ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHMubWFwKChjb21wOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0aGlzLmdldENvbXBvbmVudENhdGVnb3J5KGNvbXAudHlwZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlSW5mby5wb3NpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUNvbnN0cmFpbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGlzMkQgPyAneCwgeSBvbmx5ICh6IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjogaXMyRCA/ICd6IG9ubHkgKHgsIHkgaWdub3JlZCknIDogJ3gsIHksIHogYWxsIHVzZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlOiBpczJEID8gJ3gsIHkgbWFpbiwgeiB0eXBpY2FsbHkgMScgOiAneCwgeSwgeiBhbGwgdXNlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZGV0ZWN0IG5vZGUgdHlwZTogJHtlcnIubWVzc2FnZX1gIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbXBvbmVudENhdGVnb3J5KGNvbXBvbmVudFR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICghY29tcG9uZW50VHlwZSkgcmV0dXJuICd1bmtub3duJztcbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5TcHJpdGUnKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8IFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuQnV0dG9uJykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTGF5b3V0JykgfHxcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLk1hc2snKSB8fFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuR3JhcGhpY3MnKSkge1xuICAgICAgICAgICAgcmV0dXJuICcyRCc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5NZXNoUmVuZGVyZXInKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5DYW1lcmEnKSB8fFxuICAgICAgICAgICAgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTGlnaHQnKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5EaXJlY3Rpb25hbExpZ2h0JykgfHxcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLlBvaW50TGlnaHQnKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5TcG90TGlnaHQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICczRCc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAnZ2VuZXJpYyc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXF1ZXN0U2NlbmVUcmVlRGF0YSgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgLy8g5LyY5YWI5L2/55So5Zy65pmv6ISa5pys77yM5Zug5Li6IHNjZW5lOnF1ZXJ5LWhpZXJhcmNoeSDlj6rov5Tlm54gVVVJRCDlrZfnrKbkuLJcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRyZWVEYXRhID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldFNjZW5lVHJlZURhdGEnKTtcbiAgICAgICAgICAgIGlmICh0cmVlRGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGBzY2VuZS1zY3JpcHQ6JHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aSH55So77ya5bCd6K+V6Z2i5p2/IEFQSe+8iOiZveeEtuWug+i/lOWbnueahOagvOW8j+S4jeWvue+8iVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaGllcmFyY2h5ID0gYXdhaXQgdGhpcy5zZW5kVG9TY2VuZVBhbmVsKCdzY2VuZTpxdWVyeS1oaWVyYXJjaHknKTtcbiAgICAgICAgICAgIGlmIChoaWVyYXJjaHkgJiYgdHlwZW9mIGhpZXJhcmNoeSA9PT0gJ29iamVjdCcgJiYgaGllcmFyY2h5LnV1aWQpIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzov5Tlm57nmoTmmK/lr7nosaHkuJTmnIkgdXVpZO+8jOWPr+iDveaYr+ato+ehrueahOagkee7k+aehFxuICAgICAgICAgICAgICAgIHJldHVybiBoaWVyYXJjaHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgcGFuZWw6JHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCcgfCAnKSB8fCAnRmFpbGVkIHRvIHF1ZXJ5IHNjZW5lIHRyZWUnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGZldGNoTm9kZUR1bXAodXVpZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6cXVlcnktbm9kZScsIHV1aWQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbbm9kZS10b29sc10gc2NlbmU6cXVlcnktbm9kZSBwYW5lbCBmYWxsYmFjazonLCBlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdnZXROb2RlSW5mbycsIFt1dWlkXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOb2RlVXNpbmdQYW5lbEFQSShvcHRpb25zOiB7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAgcGFyZW50Pzogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgbm9kZVR5cGU6IHN0cmluZztcbiAgICAgICAgYXNzZXRVdWlkPzogc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgY29tcG9uZW50cz86IHN0cmluZ1tdO1xuICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm0/OiBib29sZWFuO1xuICAgICAgICB1bmxpbmtQcmVmYWI/OiBib29sZWFuO1xuICAgIH0pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwYXJlbnRVdWlkID0gb3B0aW9ucy5wYXJlbnQgfHwgJyc7XG4gICAgICAgIGlmIChvcHRpb25zLmFzc2V0VXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbChcbiAgICAgICAgICAgICAgICAnc2NlbmU6Y3JlYXRlLW5vZGVzLWJ5LXV1aWRzJyxcbiAgICAgICAgICAgICAgICBbb3B0aW9ucy5hc3NldFV1aWRdLFxuICAgICAgICAgICAgICAgIHBhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB1bmxpbmtQcmVmYWI6IG9wdGlvbnMudW5saW5rUHJlZmFiID8gdHJ1ZSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogISFvcHRpb25zLmtlZXBXb3JsZFRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGFzc0lkID0gdGhpcy5tYXBOb2RlVHlwZVRvQ2xhc3NJZChvcHRpb25zLm5vZGVUeXBlKTtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IG9wdGlvbnMuY29tcG9uZW50cyB8fCBbXSxcbiAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybTogISFvcHRpb25zLmtlZXBXb3JsZFRyYW5zZm9ybVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNlbmRUb1NjZW5lUGFuZWwoJ3NjZW5lOmNyZWF0ZS1ub2RlLWJ5LWNsYXNzaWQnLCBjbGFzc0lkLCBwYXlsb2FkLCBwYXJlbnRVdWlkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG1hcE5vZGVUeXBlVG9DbGFzc0lkKG5vZGVUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIW5vZGVUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2NjLk5vZGUnO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChub2RlVHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnMkROb2RlJzpcbiAgICAgICAgICAgIGNhc2UgJzNETm9kZSc6XG4gICAgICAgICAgICBjYXNlICdOb2RlJzpcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjYy5Ob2RlJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZXh0cmFjdFV1aWRGcm9tUGFuZWxSZXN1bHQocmVzdWx0OiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0KSAmJiByZXN1bHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZmlyc3QgPSByZXN1bHRbMF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpcnN0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaXJzdCAmJiB0eXBlb2YgZmlyc3QgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0LnV1aWQgfHwgZmlyc3QuaWQgfHwgbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC51dWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC51dWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc3VsdC5pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNlbmRUb1NjZW5lUGFuZWwobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuICAgICAgICBpZiAoIWVkaXRvcj8uSXBjPy5zZW5kVG9QYW5lbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFZGl0b3IuSXBjLnNlbmRUb1BhbmVsIOS4jeWPr+eUqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLklwYy5zZW5kVG9QYW5lbCgnc2NlbmUnLCBtZXNzYWdlLCAuLi5hcmdzLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVwYXJlbnROb2RlcyhcbiAgICAgICAgdXVpZHM6IHN0cmluZ1tdLFxuICAgICAgICBwYXJlbnRVdWlkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IHsga2VlcFdvcmxkVHJhbnNmb3JtPzogYm9vbGVhbjsgc2libGluZ0luZGV4PzogbnVtYmVyIH0gPSB7fVxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLnNlbmRUb1NjZW5lUGFuZWwoJ3NjZW5lOm1vdmUtbm9kZXMnLCB1dWlkcywgcGFyZW50VXVpZCwge1xuICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiAhIW9wdGlvbnMua2VlcFdvcmxkVHJhbnNmb3JtLFxuICAgICAgICAgICAgc2libGluZ0luZGV4OiBvcHRpb25zLnNpYmxpbmdJbmRleCA/PyAtMVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRlbGV0ZU5vZGVzKHV1aWRzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLnNlbmRUb1NjZW5lUGFuZWwoJ3NjZW5lOmRlbGV0ZS1ub2RlcycsIHV1aWRzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZU5vZGVzKHV1aWRzOiBzdHJpbmdbXSwgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNlbmRUb1NjZW5lUGFuZWwoJ3NjZW5lOmR1cGxpY2F0ZS1ub2RlcycsIHV1aWRzLCB7IGluY2x1ZGVDaGlsZHJlbiB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZU5vZGVQcm9wZXJ0eVZpYVNjZW5lKHV1aWQ6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwYW5lbFBheWxvYWQgPSB7XG4gICAgICAgICAgICBpZDogdXVpZCxcbiAgICAgICAgICAgIHBhdGg6IHByb3BlcnR5LFxuICAgICAgICAgICAgdHlwZTogdGhpcy5pbmZlclNjZW5lUHJvcGVydHlUeXBlKHZhbHVlKSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgaXNTdWJQcm9wOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRUb1NjZW5lUGFuZWwoJ3NjZW5lOnNldC1wcm9wZXJ0eScsIHBhbmVsUGF5bG9hZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbbm9kZS10b29sc10gc2NlbmU6c2V0LXByb3BlcnR5IHBhbmVsIGZhbGxiYWNrOicsIGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLmNhbGxTY2VuZVNjcmlwdCgnc2V0Tm9kZVByb3BlcnR5JywgW3V1aWQsIHByb3BlcnR5LCB2YWx1ZV0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5mZXJTY2VuZVByb3BlcnR5VHlwZSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdmFsdWVUeXBlID0gdHlwZW9mIHZhbHVlO1xuICAgICAgICBpZiAodmFsdWVUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuICdTdHJpbmcnO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZVR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgcmV0dXJuICdCb29sZWFuJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWVUeXBlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmV0dXJuICdGbG9hdCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS54ICE9PSB1bmRlZmluZWQgJiYgdmFsdWUueSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdWZWMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICdPYmplY3QnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnVW5rbm93bic7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQXNzZXRVdWlkKGFzc2V0UGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ZGIgPSB0aGlzLmdldEFzc2V0REIoKTtcbiAgICAgICAgaWYgKCFhc3NldGRiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VkaXRvci5hc3NldGRiIOS4jeWPr+eUqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnVybFRvVXVpZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGFzc2V0ZGIudXJsVG9VdWlkKGFzc2V0UGF0aCk7XG4gICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1dWlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2V0ZGIucXVlcnlVdWlkQnlVcmwoYXNzZXRQYXRoLCAoZXJyOiBFcnJvciB8IG51bGwsIHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHV1aWQgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgYXNzZXRkYi5xdWVyeUFzc2V0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NldGRiLnF1ZXJ5QXNzZXRzKGFzc2V0UGF0aCwgWydhc3NldCddLCAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdHM6IGFueVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gQXJyYXkuaXNBcnJheShyZXN1bHRzKSAmJiByZXN1bHRzLmxlbmd0aCA+IDAgPyByZXN1bHRzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShtYXRjaD8udXVpZCB8fCBtYXRjaD8uZmlsZUlkIHx8IG51bGwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFzc2V0REIoKTogYW55IHtcbiAgICAgICAgY29uc3QgZWRpdG9yOiBhbnkgPSBFZGl0b3I7XG4gICAgICAgIHJldHVybiBlZGl0b3I/LmFzc2V0ZGIgfHwgZWRpdG9yPy5yZW1vdGU/LmFzc2V0ZGI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjYWxsU2NlbmVTY3JpcHQobWV0aG9kOiBzdHJpbmcsIGFyZ3M6IGFueVtdID0gW10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgbmFtZTogJ2NvY29zLW1jcC1zZXJ2ZXInLFxuICAgICAgICAgICAgbWV0aG9kLFxuICAgICAgICAgICAgYXJnc1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghZWRpdG9yPy5TY2VuZT8uY2FsbFNjZW5lU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignRWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdCDkuI3lj6/nlKgnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5TY2VuZS5jYWxsU2NlbmVTY3JpcHQoXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5tZXRob2QsXG4gICAgICAgICAgICAgICAgICAgIC4uLm9wdGlvbnMuYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=
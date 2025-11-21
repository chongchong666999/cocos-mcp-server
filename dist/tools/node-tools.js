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
        try {
            const { uuid, position, rotation, scale } = args;
            const transform = {};
            if (position)
                transform.position = position;
            if (rotation)
                transform.rotation = rotation;
            if (scale)
                transform.scale = scale;
            const result = await this.callSceneScript('setNodeTransform', [uuid, transform]);
            return result;
        }
        catch (err) {
            return {
                success: false,
                error: `Failed to update transform: ${err.message || err}`
            };
        }
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
        try {
            const result = await this.callSceneScript('deleteNode', [uuid]);
            return result;
        }
        catch (err) {
            return { success: false, error: err.message || err };
        }
    }
    async moveNode(nodeUuid, newParentUuid, siblingIndex = -1) {
        try {
            const result = await this.callSceneScript('moveNode', [
                nodeUuid,
                newParentUuid,
                siblingIndex >= 0 ? siblingIndex : undefined
            ]);
            return result;
        }
        catch (err) {
            return { success: false, error: err.message || err };
        }
    }
    async duplicateNode(uuid, includeChildren = true) {
        try {
            const result = await this.callSceneScript('duplicateNode', [uuid, includeChildren]);
            return result;
        }
        catch (err) {
            return { success: false, error: err.message || err };
        }
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
        // 直接使用场景脚本，避免 scene:query-node 在 2.4.13 中的问题
        try {
            return await this.callSceneScript('getNodeInfo', [uuid]);
        }
        catch (err) {
            console.error('[node-tools] Failed to fetch node dump:', err);
            throw err;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90b29scy9ub2RlLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVEQUFtRDtBQUVuRCxNQUFhLFNBQVM7SUFBdEI7UUFDWSxtQkFBYyxHQUFHLElBQUksZ0NBQWMsRUFBRSxDQUFDO0lBOHVDbEQsQ0FBQztJQTd1Q0csUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFLDBOQUEwTjtnQkFDdk8sV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLFdBQVc7eUJBQzNCO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsMExBQTBMO3lCQUMxTTt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLGlDQUFpQzs0QkFDOUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7NEJBQ2xDLE9BQU8sRUFBRSxNQUFNO3lCQUNsQjt3QkFDRCxZQUFZLEVBQUU7NEJBQ1YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFEQUFxRDs0QkFDbEUsT0FBTyxFQUFFLENBQUMsQ0FBQzt5QkFDZDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHFJQUFxSTt5QkFDcko7d0JBQ0QsU0FBUyxFQUFFOzRCQUNQLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5R0FBeUc7eUJBQ3pIO3dCQUNELFVBQVUsRUFBRTs0QkFDUixJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUs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QUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBL3VDRCw4QkErdUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yLCBOb2RlSW5mbyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IENvbXBvbmVudFRvb2xzIH0gZnJvbSAnLi9jb21wb25lbnQtdG9vbHMnO1xuXG5leHBvcnQgY2xhc3MgTm9kZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIGNvbXBvbmVudFRvb2xzID0gbmV3IENvbXBvbmVudFRvb2xzKCk7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NyZWF0ZV9ub2RlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhIG5ldyBub2RlIGluIHRoZSBzY2VuZS4gU3VwcG9ydHMgY3JlYXRpbmcgZW1wdHkgbm9kZXMsIG5vZGVzIHdpdGggY29tcG9uZW50cywgb3IgaW5zdGFudGlhdGluZyBmcm9tIGFzc2V0cyAocHJlZmFicywgZXRjLikuIElNUE9SVEFOVDogWW91IHNob3VsZCBhbHdheXMgcHJvdmlkZSBwYXJlbnRVdWlkIHRvIHNwZWNpZnkgd2hlcmUgdG8gY3JlYXRlIHRoZSBub2RlLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgbmFtZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXJlbnQgbm9kZSBVVUlELiBTVFJPTkdMWSBSRUNPTU1FTkRFRDogQWx3YXlzIHByb3ZpZGUgdGhpcyBwYXJhbWV0ZXIuIFVzZSBnZXRfY3VycmVudF9zY2VuZSBvciBnZXRfYWxsX25vZGVzIHRvIGZpbmQgcGFyZW50IFVVSURzLiBJZiBub3QgcHJvdmlkZWQsIG5vZGUgd2lsbCBiZSBjcmVhdGVkIGF0IHNjZW5lIHJvb3QuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIHR5cGU6IE5vZGUsIDJETm9kZSwgM0ROb2RlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ05vZGUnLCAnMkROb2RlJywgJzNETm9kZSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdOb2RlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdJbmRleDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2libGluZyBpbmRleCBmb3Igb3JkZXJpbmcgKC0xIG1lYW5zIGFwcGVuZCBhdCBlbmQpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVVJRCB0byBpbnN0YW50aWF0ZSBmcm9tIChlLmcuLCBwcmVmYWIgVVVJRCkuIFdoZW4gcHJvdmlkZWQsIGNyZWF0ZXMgYSBub2RlIGluc3RhbmNlIGZyb20gdGhlIGFzc2V0IGluc3RlYWQgb2YgYW4gZW1wdHkgbm9kZS4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBwYXRoIHRvIGluc3RhbnRpYXRlIGZyb20gKGUuZy4sIFwiZGI6Ly9hc3NldHMvcHJlZmFicy9NeVByZWZhYi5wcmVmYWJcIikuIEFsdGVybmF0aXZlIHRvIGFzc2V0VXVpZC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FycmF5IG9mIGNvbXBvbmVudCB0eXBlIG5hbWVzIHRvIGFkZCB0byB0aGUgbmV3IG5vZGUgKGUuZy4sIFtcImNjLlNwcml0ZVwiLCBcImNjLkJ1dHRvblwiXSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSWYgdHJ1ZSBhbmQgY3JlYXRpbmcgZnJvbSBwcmVmYWIsIHVubGluayBmcm9tIHByZWZhYiB0byBjcmVhdGUgYSByZWd1bGFyIG5vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byBrZWVwIHdvcmxkIHRyYW5zZm9ybSB3aGVuIGNyZWF0aW5nIHRoZSBub2RlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxUcmFuc2Zvcm06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5pdGlhbCB0cmFuc2Zvcm0gdG8gYXBwbHkgdG8gdGhlIGNyZWF0ZWQgbm9kZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X25vZGVfaW5mbycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgbm9kZSBpbmZvcm1hdGlvbiBieSBVVUlEJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdmaW5kX25vZGVzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbmQgbm9kZXMgYnkgbmFtZSBwYXR0ZXJuJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBwYXR0ZXJuIHRvIHNlYXJjaCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGFjdE1hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhhY3QgbWF0Y2ggb3IgcGFydGlhbCBtYXRjaCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsncGF0dGVybiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZmluZF9ub2RlX2J5X25hbWUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmluZCBmaXJzdCBub2RlIGJ5IGV4YWN0IG5hbWUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIG5hbWUgdG8gZmluZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X2FsbF9ub2RlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgYWxsIG5vZGVzIGluIHRoZSBzY2VuZSB3aXRoIHRoZWlyIFVVSURzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzZXRfbm9kZV9wcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSAocHJlZmVyIHVzaW5nIHNldF9ub2RlX3RyYW5zZm9ybSBmb3IgYWN0aXZlL2xheWVyL21vYmlsaXR5L3Bvc2l0aW9uL3JvdGF0aW9uL3NjYWxlKScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvcGVydHkgbmFtZSAoZS5nLiwgYWN0aXZlLCBuYW1lLCBsYXllciknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3BlcnR5IHZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJywgJ3Byb3BlcnR5JywgJ3ZhbHVlJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzZXRfbm9kZV90cmFuc2Zvcm0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0IG5vZGUgdHJhbnNmb3JtIHByb3BlcnRpZXMgKHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUpIHdpdGggdW5pZmllZCBpbnRlcmZhY2UuIEF1dG9tYXRpY2FsbHkgaGFuZGxlcyAyRC8zRCBub2RlIGRpZmZlcmVuY2VzLicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHo6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWiBjb29yZGluYXRlIChpZ25vcmVkIGZvciAyRCBub2RlcyknIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBwb3NpdGlvbi4gRm9yIDJEIG5vZGVzLCBvbmx5IHgseSBhcmUgdXNlZDsgeiBpcyBpZ25vcmVkLiBGb3IgM0Qgbm9kZXMsIGFsbCBjb29yZGluYXRlcyBhcmUgdXNlZC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnWCByb3RhdGlvbiAoaWdub3JlZCBmb3IgMkQgbm9kZXMpJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1kgcm90YXRpb24gKGlnbm9yZWQgZm9yIDJEIG5vZGVzKScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdaIHJvdGF0aW9uIChtYWluIHJvdGF0aW9uIGF4aXMgZm9yIDJEIG5vZGVzKScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIHJvdGF0aW9uIGluIGV1bGVyIGFuZ2xlcy4gRm9yIDJEIG5vZGVzLCBvbmx5IHogcm90YXRpb24gaXMgdXNlZC4gRm9yIDNEIG5vZGVzLCBhbGwgYXhlcyBhcmUgdXNlZC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1ogc2NhbGUgKHVzdWFsbHkgMSBmb3IgMkQgbm9kZXMpJyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgc2NhbGUuIEZvciAyRCBub2RlcywgeiBpcyB0eXBpY2FsbHkgMS4gRm9yIDNEIG5vZGVzLCBhbGwgYXhlcyBhcmUgdXNlZC4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2RlbGV0ZV9ub2RlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RlbGV0ZSBhIG5vZGUgZnJvbSBzY2VuZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCB0byBkZWxldGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3V1aWQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21vdmVfbm9kZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNb3ZlIG5vZGUgdG8gbmV3IHBhcmVudCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gbW92ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdQYXJlbnRVdWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOZXcgcGFyZW50IG5vZGUgVVVJRCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nSW5kZXg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NpYmxpbmcgaW5kZXggaW4gbmV3IHBhcmVudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbm9kZVV1aWQnLCAnbmV3UGFyZW50VXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZHVwbGljYXRlX25vZGUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRHVwbGljYXRlIGEgbm9kZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCB0byBkdXBsaWNhdGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUNoaWxkcmVuOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBjaGlsZHJlbiBub2RlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1dWlkJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdkZXRlY3Rfbm9kZV90eXBlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RldGVjdCBpZiBhIG5vZGUgaXMgMkQgb3IgM0QgYmFzZWQgb24gaXRzIGNvbXBvbmVudHMgYW5kIHByb3BlcnRpZXMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgdG8gYW5hbHl6ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXVpZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlX25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZU5vZGUoYXJncyk7XG4gICAgICAgICAgICBjYXNlICdnZXRfbm9kZV9pbmZvJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyhhcmdzLnV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnZmluZF9ub2Rlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmluZE5vZGVzKGFyZ3MucGF0dGVybiwgYXJncy5leGFjdE1hdGNoKTtcbiAgICAgICAgICAgIGNhc2UgJ2ZpbmRfbm9kZV9ieV9uYW1lJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maW5kTm9kZUJ5TmFtZShhcmdzLm5hbWUpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X2FsbF9ub2Rlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QWxsTm9kZXMoKTtcbiAgICAgICAgICAgIGNhc2UgJ3NldF9ub2RlX3Byb3BlcnR5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXROb2RlUHJvcGVydHkoYXJncy51dWlkLCBhcmdzLnByb3BlcnR5LCBhcmdzLnZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ3NldF9ub2RlX3RyYW5zZm9ybSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0Tm9kZVRyYW5zZm9ybShhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZV9ub2RlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWxldGVOb2RlKGFyZ3MudXVpZCk7XG4gICAgICAgICAgICBjYXNlICdtb3ZlX25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vdmVOb2RlKGFyZ3Mubm9kZVV1aWQsIGFyZ3MubmV3UGFyZW50VXVpZCwgYXJncy5zaWJsaW5nSW5kZXgpO1xuICAgICAgICAgICAgY2FzZSAnZHVwbGljYXRlX25vZGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmR1cGxpY2F0ZU5vZGUoYXJncy51dWlkLCBhcmdzLmluY2x1ZGVDaGlsZHJlbik7XG4gICAgICAgICAgICBjYXNlICdkZXRlY3Rfbm9kZV90eXBlJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZXRlY3ROb2RlVHlwZShhcmdzLnV1aWQpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlTm9kZShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldFBhcmVudFV1aWQgPSBhcmdzLnBhcmVudFV1aWQ7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5o+Q5L6b54i26IqC54K5VVVJRO+8jOiOt+WPluWcuuaZr+agueiKgueCuVxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0UGFyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NlbmVJbmZvID0gYXdhaXQgdGhpcy5yZXF1ZXN0U2NlbmVUcmVlRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdENhbmRpZGF0ZSA9IEFycmF5LmlzQXJyYXkoc2NlbmVJbmZvKSA/IHNjZW5lSW5mb1swXSA6IHNjZW5lSW5mbztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb290Q2FuZGlkYXRlICYmIHJvb3RDYW5kaWRhdGUudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFBhcmVudFV1aWQgPSByb290Q2FuZGlkYXRlLnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYE5vIHBhcmVudCBzcGVjaWZpZWQsIHVzaW5nIHNjZW5lIHJvb3Q6ICR7dGFyZ2V0UGFyZW50VXVpZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFNjZW5lID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldEN1cnJlbnRTY2VuZUluZm8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNjZW5lPy5kYXRhPy51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFBhcmVudFV1aWQgPSBjdXJyZW50U2NlbmUuZGF0YS51dWlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBnZXQgc2NlbmUgcm9vdCwgd2lsbCB1c2UgZGVmYXVsdCBiZWhhdmlvcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5o+Q5L6b5LqGYXNzZXRQYXRo77yM5YWI6Kej5p6Q5Li6YXNzZXRVdWlkXG4gICAgICAgICAgICAgICAgbGV0IGZpbmFsQXNzZXRVdWlkID0gYXJncy5hc3NldFV1aWQ7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuYXNzZXRQYXRoICYmICFmaW5hbEFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxBc3NldFV1aWQgPSBhd2FpdCB0aGlzLnJlc29sdmVBc3NldFV1aWQoYXJncy5hc3NldFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaW5hbEFzc2V0VXVpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBBc3NldCBub3QgZm91bmQgYXQgcGF0aDogJHthcmdzLmFzc2V0UGF0aH1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFzc2V0IHBhdGggJyR7YXJncy5hc3NldFBhdGh9JyByZXNvbHZlZCB0byBVVUlEOiAke2ZpbmFsQXNzZXRVdWlkfWApO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHJlc29sdmUgYXNzZXQgcGF0aCAnJHthcmdzLmFzc2V0UGF0aH0nOiAke2Vycn1gXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOaehOW7umNyZWF0ZS1ub2Rl6YCJ6aG5XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlTm9kZU9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIOiuvue9rueItuiKgueCuVxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRQYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLnBhcmVudCA9IHRhcmdldFBhcmVudFV1aWQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5LuO6LWE5rqQ5a6e5L6L5YyWXG4gICAgICAgICAgICAgICAgaWYgKGZpbmFsQXNzZXRVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLmFzc2V0VXVpZCA9IGZpbmFsQXNzZXRVdWlkO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy51bmxpbmtQcmVmYWIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLnVubGlua1ByZWZhYiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmt7vliqDnu4Tku7ZcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5jb21wb25lbnRzICYmIGFyZ3MuY29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZU5vZGVPcHRpb25zLmNvbXBvbmVudHMgPSBhcmdzLmNvbXBvbmVudHM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmdzLm5vZGVUeXBlICYmIGFyZ3Mubm9kZVR5cGUgIT09ICdOb2RlJyAmJiAhZmluYWxBc3NldFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Y+q5pyJ5Zyo5LiN5LuO6LWE5rqQ5a6e5L6L5YyW5pe25omN5re75Yqgbm9kZVR5cGXnu4Tku7ZcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMuY29tcG9uZW50cyA9IFthcmdzLm5vZGVUeXBlXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDkv53mjIHkuJbnlYzlj5jmjaJcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5rZWVwV29ybGRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTm9kZU9wdGlvbnMua2VlcFdvcmxkVHJhbnNmb3JtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnm7TmjqXkvb/nlKjlnLrmma/ohJrmnKzliJvlu7roioLngrnvvIjpnaLmnb8gQVBJIOWcqCAyLngg5Lit5pyJ6Zeu6aKY77yJXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tub2RlLXRvb2xzXSBDcmVhdGluZyBub2RlIHZpYSBzY2VuZSBzY3JpcHQuLi4nKTtcbiAgICAgICAgICAgICAgICBsZXQgdXVpZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0UmVzdWx0ID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2NyZWF0ZU5vZGUnLCBbYXJncy5uYW1lLCB0YXJnZXRQYXJlbnRVdWlkXSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbbm9kZS10b29sc10gU2NlbmUgc2NyaXB0IHJlc3VsdDonLCBzY3JpcHRSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjcmlwdFJlc3VsdCAmJiBzY3JpcHRSZXN1bHQuc3VjY2VzcyAmJiBzY3JpcHRSZXN1bHQuZGF0YSAmJiBzY3JpcHRSZXN1bHQuZGF0YS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkID0gc2NyaXB0UmVzdWx0LmRhdGEudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbbm9kZS10b29sc10g4pyFIE5vZGUgY3JlYXRlZCBzdWNjZXNzZnVsbHk6JywgdXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbbm9kZS10b29sc10gU2NlbmUgc2NyaXB0IHJldHVybmVkIGludmFsaWQgcmVzdWx0OicsIHNjcmlwdFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NjZW5lIHNjcmlwdCBkaWQgbm90IHJldHVybiBhIHZhbGlkIFVVSUQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHNjcmlwdEVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tub2RlLXRvb2xzXSDinYwgU2NlbmUgc2NyaXB0IGZhaWxlZDonLCBzY3JpcHRFcnIpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgbm9kZTogJHtzY3JpcHRFcnIubWVzc2FnZSB8fCBzY3JpcHRFcnJ9YCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tub2RlLXRvb2xzXSBOb2RlIFVVSUQ6JywgdXVpZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIG5vZGU6IG5vIFVVSUQgcmV0dXJuZWQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlpITnkIblhYTlvJ/ntKLlvJVcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5zaWJsaW5nSW5kZXggIT09IHVuZGVmaW5lZCAmJiBhcmdzLnNpYmxpbmdJbmRleCA+PSAwICYmIHRhcmdldFBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTsgLy8g562J5b6F5YaF6YOo54q25oCB5pu05pawXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlcGFyZW50Tm9kZXMoW3V1aWRdLCB0YXJnZXRQYXJlbnRVdWlkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiBhcmdzLmtlZXBXb3JsZFRyYW5zZm9ybSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nSW5kZXg6IGFyZ3Muc2libGluZ0luZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBzZXQgc2libGluZyBpbmRleDonLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5re75Yqg57uE5Lu277yI5aaC5p6c5o+Q5L6b55qE6K+d77yJXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuY29tcG9uZW50cyAmJiBhcmdzLmNvbXBvbmVudHMubGVuZ3RoID4gMCAmJiB1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7IC8vIOetieW+heiKgueCueWIm+W7uuWujOaIkFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRUeXBlIG9mIGFyZ3MuY29tcG9uZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY29tcG9uZW50VG9vbHMuZXhlY3V0ZSgnYWRkX2NvbXBvbmVudCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX0gYWRkZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBhZGQgY29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX06YCwgcmVzdWx0LmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBhZGQgY29tcG9uZW50ICR7Y29tcG9uZW50VHlwZX06YCwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gYWRkIGNvbXBvbmVudHM6JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOiuvue9ruWIneWni+WPmOaNou+8iOWmguaenOaPkOS+m+eahOivne+8iVxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmluaXRpYWxUcmFuc2Zvcm0gJiYgdXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDE1MCkpOyAvLyDnrYnlvoXoioLngrnlkoznu4Tku7bliJvlu7rlrozmiJBcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0Tm9kZVRyYW5zZm9ybSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXJncy5pbml0aWFsVHJhbnNmb3JtLnBvc2l0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBhcmdzLmluaXRpYWxUcmFuc2Zvcm0ucm90YXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGFyZ3MuaW5pdGlhbFRyYW5zZm9ybS5zY2FsZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSW5pdGlhbCB0cmFuc2Zvcm0gYXBwbGllZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBzZXQgaW5pdGlhbCB0cmFuc2Zvcm06JywgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOiOt+WPluWIm+W7uuWQjueahOiKgueCueS/oeaBr+i/m+ihjOmqjOivgVxuICAgICAgICAgICAgICAgIGxldCB2ZXJpZmljYXRpb25EYXRhOiBhbnkgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmZvID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVJbmZvLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUluZm86IG5vZGVJbmZvLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25EZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQ6IHRhcmdldFBhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVUeXBlOiBhcmdzLm5vZGVUeXBlIHx8ICdOb2RlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUFzc2V0OiAhIWZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQ6IGZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGg6IGFyZ3MuYXNzZXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gZ2V0IHZlcmlmaWNhdGlvbiBkYXRhOicsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc01lc3NhZ2UgPSBmaW5hbEFzc2V0VXVpZCBcbiAgICAgICAgICAgICAgICAgICAgPyBgTm9kZSAnJHthcmdzLm5hbWV9JyBpbnN0YW50aWF0ZWQgZnJvbSBhc3NldCBzdWNjZXNzZnVsbHlgXG4gICAgICAgICAgICAgICAgICAgIDogYE5vZGUgJyR7YXJncy5uYW1lfScgY3JlYXRlZCBzdWNjZXNzZnVsbHlgO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkOiB0YXJnZXRQYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IGFyZ3Mubm9kZVR5cGUgfHwgJ05vZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUFzc2V0OiAhIWZpbmFsQXNzZXRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRVdWlkOiBmaW5hbEFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1Y2Nlc3NNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHZlcmlmaWNhdGlvbkRhdGE6IHZlcmlmaWNhdGlvbkRhdGFcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gY3JlYXRlIG5vZGU6ICR7ZXJyLm1lc3NhZ2V9LiBBcmdzOiAke0pTT04uc3RyaW5naWZ5KGFyZ3MpfWBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXROb2RlSW5mbyh1dWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hOb2RlRHVtcCh1dWlkKS50aGVuKChub2RlRGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdOb2RlIG5vdCBmb3VuZCBvciBpbnZhbGlkIHJlc3BvbnNlJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmoLnmja7lrp7pmYXov5Tlm57nmoTmlbDmja7nu5PmnoTop6PmnpDoioLngrnkv6Hmga9cbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBOb2RlSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZURhdGEudXVpZD8udmFsdWUgfHwgdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZURhdGEubmFtZT8udmFsdWUgfHwgbm9kZURhdGEubmFtZSB8fCAnVW5rbm93bicsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZURhdGEuYWN0aXZlPy52YWx1ZSAhPT0gdW5kZWZpbmVkID8gbm9kZURhdGEuYWN0aXZlLnZhbHVlIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGVEYXRhLnBvc2l0aW9uPy52YWx1ZSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IG5vZGVEYXRhLnJvdGF0aW9uPy52YWx1ZSB8fCB7IHg6IDAsIHk6IDAsIHo6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGU6IG5vZGVEYXRhLnNjYWxlPy52YWx1ZSB8fCB7IHg6IDEsIHk6IDEsIHo6IDEgfSxcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBub2RlRGF0YS5wYXJlbnQ/LnZhbHVlPy51dWlkIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBub2RlRGF0YS5jaGlsZHJlbiB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogKG5vZGVEYXRhLl9fY29tcHNfXyB8fCBub2RlRGF0YS5jb21wb25lbnRzIHx8IFtdKS5tYXAoKGNvbXA6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNvbXAuX190eXBlX18gfHwgY29tcC50eXBlIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXAuZW5hYmxlZCAhPT0gdW5kZWZpbmVkID8gY29tcC5lbmFibGVkIDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KSksXG4gICAgICAgICAgICAgICAgICAgIGxheWVyOiBub2RlRGF0YS5sYXllcj8udmFsdWUgfHwgMTA3Mzc0MTgyNCxcbiAgICAgICAgICAgICAgICAgICAgbW9iaWxpdHk6IG5vZGVEYXRhLm1vYmlsaXR5Py52YWx1ZSB8fCAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogaW5mbyB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGFzeW5jIChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdbbm9kZS10b29sc10gZ2V0Tm9kZUluZm8gZGlyZWN0IHF1ZXJ5IGZhaWxlZCwgZmFsbGJhY2sgdG8gc2NlbmUgc2NyaXB0OicsIGVycik7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NyaXB0UmVzdWx0ID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldE5vZGVJbmZvJywgW3V1aWRdKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzY3JpcHRSZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIyLm1lc3NhZ2UgfHwgZXJyMiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBmaW5kTm9kZXMocGF0dGVybjogc3RyaW5nLCBleGFjdE1hdGNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdFNjZW5lVHJlZURhdGEoKS50aGVuKCh0cmVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2hUcmVlID0gKG5vZGU6IGFueSwgcGFyZW50UGF0aDogc3RyaW5nID0gJycpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZU5hbWUgPSBub2RlLm5hbWUgfHwgJ1Vua25vd24nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50UGF0aCA9IHBhcmVudFBhdGggPyBgJHtwYXJlbnRQYXRofS8ke25vZGVOYW1lfWAgOiBub2RlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSBleGFjdE1hdGNoID8gXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlTmFtZSA9PT0gcGF0dGVybiA6IFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhwYXR0ZXJuLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBjdXJyZW50UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkobm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaFRyZWUoY2hpbGQsIGN1cnJlbnRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHRyZWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoVHJlZSh0cmVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5vZGVzIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGZpbmROb2RlQnlOYW1lKG5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0U2NlbmVUcmVlRGF0YSgpLnRoZW4oKHRyZWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBmb3VuZE5vZGVEYXRhOiB7IHV1aWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyBwYXRoOiBzdHJpbmcgfSB8IG51bGwgPSBudWxsO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHNlYXJjaFRyZWUgPSAobm9kZTogYW55LCBwYXJlbnRQYXRoOiBzdHJpbmcgPSAnJyk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlTmFtZSA9IG5vZGUubmFtZSB8fCAnVW5rbm93bic7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGFyZW50UGF0aCA/IGAke3BhcmVudFBhdGh9LyR7bm9kZU5hbWV9YCA6IG5vZGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVOYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZE5vZGVEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBjdXJyZW50UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VhcmNoVHJlZShjaGlsZCwgY3VycmVudFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VhcmNoVHJlZSh0cmVlKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoZm91bmROb2RlRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBmb3VuZE5vZGVEYXRhXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlICcke25hbWV9JyBub3QgZm91bmRgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZWFyY2hOb2RlSW5UcmVlKG5vZGU6IGFueSwgdGFyZ2V0TmFtZTogc3RyaW5nKTogYW55IHtcbiAgICAgICAgaWYgKG5vZGUubmFtZSA9PT0gdGFyZ2V0TmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuc2VhcmNoTm9kZUluVHJlZShjaGlsZCwgdGFyZ2V0TmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QWxsTm9kZXMoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RTY2VuZVRyZWVEYXRhKCkudGhlbigodHJlZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgdHJhdmVyc2VUcmVlID0gKG5vZGU6IGFueSwgcGFyZW50UGF0aDogc3RyaW5nID0gJycpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5p6E5bu65b2T5YmN6IqC54K555qE6Lev5b6EXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVOYW1lID0gbm9kZS5uYW1lIHx8ICdVbmtub3duJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXJlbnRQYXRoID8gYCR7cGFyZW50UGF0aH0vJHtub2RlTmFtZX1gIDogbm9kZU5hbWU7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGN1cnJlbnRQYXRoXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW4gJiYgQXJyYXkuaXNBcnJheShub2RlLmNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2VUcmVlKGNoaWxkLCBjdXJyZW50UGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0cmVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlVHJlZSh0cmVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsTm9kZXM6IG5vZGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVzOiBub2Rlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0Tm9kZVBhdGgobm9kZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgLy8g6L+Z5Liq5pa55rOV5L+d55WZ55So5LqO5YW25LuW5Zyw5pa577yM5L2G5LiN5YaN55So5LqOIGdldEFsbE5vZGVzXG4gICAgICAgIGlmICghbm9kZSB8fCAhbm9kZS5uYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGF0aCA9IFtub2RlLm5hbWVdO1xuICAgICAgICBsZXQgY3VycmVudCA9IG5vZGUucGFyZW50O1xuICAgICAgICB3aGlsZSAoY3VycmVudCAmJiB0eXBlb2YgY3VycmVudCA9PT0gJ29iamVjdCcgJiYgY3VycmVudC5uYW1lICYmIGN1cnJlbnQubmFtZSAhPT0gJ0NhbnZhcycpIHtcbiAgICAgICAgICAgIHBhdGgudW5zaGlmdChjdXJyZW50Lm5hbWUpO1xuICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oJy8nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNldE5vZGVQcm9wZXJ0eSh1dWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTm9kZVByb3BlcnR5VmlhU2NlbmUodXVpZCwgcHJvcGVydHksIHZhbHVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgY29tcHJlaGVuc2l2ZSB2ZXJpZmljYXRpb24gZGF0YSBpbmNsdWRpbmcgdXBkYXRlZCBub2RlIGluZm9cbiAgICAgICAgICAgICAgICB0aGlzLmdldE5vZGVJbmZvKHV1aWQpLnRoZW4oKG5vZGVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWU6IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyaWZpY2F0aW9uRGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVJbmZvOiBub2RlSW5mby5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZURldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6IHByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5ICh2ZXJpZmljYXRpb24gZmFpbGVkKWBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2V0Tm9kZVRyYW5zZm9ybShhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyB1dWlkLCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlIH0gPSBhcmdzO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtOiBhbnkgPSB7fTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uKSB0cmFuc2Zvcm0ucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgICAgIGlmIChyb3RhdGlvbikgdHJhbnNmb3JtLnJvdGF0aW9uID0gcm90YXRpb247XG4gICAgICAgICAgICBpZiAoc2NhbGUpIHRyYW5zZm9ybS5zY2FsZSA9IHNjYWxlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmNhbGxTY2VuZVNjcmlwdCgnc2V0Tm9kZVRyYW5zZm9ybScsIFt1dWlkLCB0cmFuc2Zvcm1dKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gdXBkYXRlIHRyYW5zZm9ybTogJHtlcnIubWVzc2FnZSB8fCBlcnJ9YCBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlzMkROb2RlKG5vZGVJbmZvOiBhbnkpOiBib29sZWFuIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgbm9kZSBoYXMgMkQtc3BlY2lmaWMgY29tcG9uZW50cyBvciBpcyB1bmRlciBDYW52YXNcbiAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGVJbmZvLmNvbXBvbmVudHMgfHwgW107XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBmb3IgY29tbW9uIDJEIGNvbXBvbmVudHNcbiAgICAgICAgY29uc3QgaGFzMkRDb21wb25lbnRzID0gY29tcG9uZW50cy5zb21lKChjb21wOiBhbnkpID0+IFxuICAgICAgICAgICAgY29tcC50eXBlICYmIChcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlNwcml0ZScpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYWJlbCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5CdXR0b24nKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGF5b3V0JykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLldpZGdldCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NYXNrJykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkdyYXBoaWNzJylcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChoYXMyRENvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBmb3IgM0Qtc3BlY2lmaWMgY29tcG9uZW50cyAgXG4gICAgICAgIGNvbnN0IGhhczNEQ29tcG9uZW50cyA9IGNvbXBvbmVudHMuc29tZSgoY29tcDogYW55KSA9PlxuICAgICAgICAgICAgY29tcC50eXBlICYmIChcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLk1lc2hSZW5kZXJlcicpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5DYW1lcmEnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5Qb2ludExpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLlNwb3RMaWdodCcpXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaGFzM0RDb21wb25lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIERlZmF1bHQgaGV1cmlzdGljOiBpZiB6IHBvc2l0aW9uIGlzIDAgYW5kIGhhc24ndCBiZWVuIGNoYW5nZWQsIGxpa2VseSAyRFxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG5vZGVJbmZvLnBvc2l0aW9uO1xuICAgICAgICBpZiAocG9zaXRpb24gJiYgTWF0aC5hYnMocG9zaXRpb24ueikgPCAwLjAwMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIERlZmF1bHQgdG8gM0QgaWYgdW5jZXJ0YWluXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG5vcm1hbGl6ZVRyYW5zZm9ybVZhbHVlKHZhbHVlOiBhbnksIHR5cGU6ICdwb3NpdGlvbicgfCAncm90YXRpb24nIHwgJ3NjYWxlJywgaXMyRDogYm9vbGVhbik6IHsgdmFsdWU6IGFueSwgd2FybmluZz86IHN0cmluZyB9IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyAuLi52YWx1ZSB9O1xuICAgICAgICBsZXQgd2FybmluZzogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICBcbiAgICAgICAgaWYgKGlzMkQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Bvc2l0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnogIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS56KSA+IDAuMDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YXJuaW5nID0gYDJEIG5vZGU6IHogcG9zaXRpb24gKCR7dmFsdWUuen0pIGlnbm9yZWQsIHNldCB0byAwYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZS56ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC56ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FzZSAncm90YXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBpZiAoKHZhbHVlLnggIT09IHVuZGVmaW5lZCAmJiBNYXRoLmFicyh2YWx1ZS54KSA+IDAuMDAxKSB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICh2YWx1ZS55ICE9PSB1bmRlZmluZWQgJiYgTWF0aC5hYnModmFsdWUueSkgPiAwLjAwMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhcm5pbmcgPSBgMkQgbm9kZTogeCx5IHJvdGF0aW9ucyBpZ25vcmVkLCBvbmx5IHogcm90YXRpb24gYXBwbGllZGA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueCA9IHJlc3VsdC54IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueSA9IHJlc3VsdC55IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnogPSByZXN1bHQueiB8fCAwO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FzZSAnc2NhbGUnOlxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUueiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQueiA9IDE7IC8vIERlZmF1bHQgc2NhbGUgZm9yIDJEXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAzRCBub2RlIC0gZW5zdXJlIGFsbCBheGVzIGFyZSBkZWZpbmVkXG4gICAgICAgICAgICByZXN1bHQueCA9IHJlc3VsdC54ICE9PSB1bmRlZmluZWQgPyByZXN1bHQueCA6ICh0eXBlID09PSAnc2NhbGUnID8gMSA6IDApO1xuICAgICAgICAgICAgcmVzdWx0LnkgPSByZXN1bHQueSAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LnkgOiAodHlwZSA9PT0gJ3NjYWxlJyA/IDEgOiAwKTtcbiAgICAgICAgICAgIHJlc3VsdC56ID0gcmVzdWx0LnogIT09IHVuZGVmaW5lZCA/IHJlc3VsdC56IDogKHR5cGUgPT09ICdzY2FsZScgPyAxIDogMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIHdhcm5pbmcgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRlbGV0ZU5vZGUodXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdkZWxldGVOb2RlJywgW3V1aWRdKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIHx8IGVyciB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlTm9kZShub2RlVXVpZDogc3RyaW5nLCBuZXdQYXJlbnRVdWlkOiBzdHJpbmcsIHNpYmxpbmdJbmRleDogbnVtYmVyID0gLTEpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ21vdmVOb2RlJywgW1xuICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgIG5ld1BhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgc2libGluZ0luZGV4ID49IDAgPyBzaWJsaW5nSW5kZXggOiB1bmRlZmluZWRcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgZXJyIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGR1cGxpY2F0ZU5vZGUodXVpZDogc3RyaW5nLCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdkdXBsaWNhdGVOb2RlJywgW3V1aWQsIGluY2x1ZGVDaGlsZHJlbl0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfHwgZXJyIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRldGVjdE5vZGVUeXBlKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5mb1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXROb2RlSW5mbyh1dWlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGVJbmZvUmVzcG9uc2Uuc3VjY2VzcyB8fCAhbm9kZUluZm9SZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IG5vZGUgaW5mb3JtYXRpb24nIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZm8gPSBub2RlSW5mb1Jlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgaXMyRCA9IHRoaXMuaXMyRE5vZGUobm9kZUluZm8pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBub2RlSW5mby5jb21wb25lbnRzIHx8IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIENvbGxlY3QgZGV0ZWN0aW9uIHJlYXNvbnNcbiAgICAgICAgICAgICAgICBjb25zdCBkZXRlY3Rpb25SZWFzb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciAyRCBjb21wb25lbnRzXG4gICAgICAgICAgICAgICAgY29uc3QgdHdvRENvbXBvbmVudHMgPSBjb21wb25lbnRzLmZpbHRlcigoY29tcDogYW55KSA9PiBcbiAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuU3ByaXRlJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuTGFiZWwnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5CdXR0b24nKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MYXlvdXQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5XaWRnZXQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NYXNrJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuR3JhcGhpY3MnKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgM0QgY29tcG9uZW50c1xuICAgICAgICAgICAgICAgIGNvbnN0IHRocmVlRENvbXBvbmVudHMgPSBjb21wb25lbnRzLmZpbHRlcigoY29tcDogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5NZXNoUmVuZGVyZXInKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5DYW1lcmEnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5MaWdodCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wLnR5cGUuaW5jbHVkZXMoJ2NjLkRpcmVjdGlvbmFsTGlnaHQnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcC50eXBlLmluY2x1ZGVzKCdjYy5Qb2ludExpZ2h0JykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXAudHlwZS5pbmNsdWRlcygnY2MuU3BvdExpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHdvRENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goYEhhcyAyRCBjb21wb25lbnRzOiAke3R3b0RDb21wb25lbnRzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpLmpvaW4oJywgJyl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICh0aHJlZURDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0ZWN0aW9uUmVhc29ucy5wdXNoKGBIYXMgM0QgY29tcG9uZW50czogJHt0aHJlZURDb21wb25lbnRzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpLmpvaW4oJywgJyl9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHBvc2l0aW9uIGZvciBoZXVyaXN0aWNcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG5vZGVJbmZvLnBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiAmJiBNYXRoLmFicyhwb3NpdGlvbi56KSA8IDAuMDAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnMucHVzaCgnWiBwb3NpdGlvbiBpcyB+MCAobGlrZWx5IDJEKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24gJiYgTWF0aC5hYnMocG9zaXRpb24ueikgPiAwLjAwMSkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goYFogcG9zaXRpb24gaXMgJHtwb3NpdGlvbi56fSAobGlrZWx5IDNEKWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChkZXRlY3Rpb25SZWFzb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkZXRlY3Rpb25SZWFzb25zLnB1c2goJ05vIHNwZWNpZmljIGluZGljYXRvcnMgZm91bmQsIGRlZmF1bHRpbmcgYmFzZWQgb24gaGV1cmlzdGljcycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogdXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVOYW1lOiBub2RlSW5mby5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVR5cGU6IGlzMkQgPyAnMkQnIDogJzNEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGVjdGlvblJlYXNvbnM6IGRldGVjdGlvblJlYXNvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzOiBjb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNvbXAudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogdGhpcy5nZXRDb21wb25lbnRDYXRlZ29yeShjb21wLnR5cGUpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSksXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZUluZm8ucG9zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Db25zdHJhaW50czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBpczJEID8gJ3gsIHkgb25seSAoeiBpZ25vcmVkKScgOiAneCwgeSwgeiBhbGwgdXNlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRpb246IGlzMkQgPyAneiBvbmx5ICh4LCB5IGlnbm9yZWQpJyA6ICd4LCB5LCB6IGFsbCB1c2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogaXMyRCA/ICd4LCB5IG1haW4sIHogdHlwaWNhbGx5IDEnIDogJ3gsIHksIHogYWxsIHVzZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGRldGVjdCBub2RlIHR5cGU6ICR7ZXJyLm1lc3NhZ2V9YCBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRDYXRlZ29yeShjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIWNvbXBvbmVudFR5cGUpIHJldHVybiAndW5rbm93bic7XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuU3ByaXRlJykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTGFiZWwnKSB8fCBcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkJ1dHRvbicpIHx8IGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkxheW91dCcpIHx8XG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5XaWRnZXQnKSB8fCBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5NYXNrJykgfHxcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkdyYXBoaWNzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnMkQnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuTWVzaFJlbmRlcmVyJykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuQ2FtZXJhJykgfHxcbiAgICAgICAgICAgIGNvbXBvbmVudFR5cGUuaW5jbHVkZXMoJ2NjLkxpZ2h0JykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuRGlyZWN0aW9uYWxMaWdodCcpIHx8XG4gICAgICAgICAgICBjb21wb25lbnRUeXBlLmluY2x1ZGVzKCdjYy5Qb2ludExpZ2h0JykgfHwgY29tcG9uZW50VHlwZS5pbmNsdWRlcygnY2MuU3BvdExpZ2h0JykpIHtcbiAgICAgICAgICAgIHJldHVybiAnM0QnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gJ2dlbmVyaWMnO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcmVxdWVzdFNjZW5lVHJlZURhdGEoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIC8vIOS8mOWFiOS9v+eUqOWcuuaZr+iEmuacrO+8jOWboOS4uiBzY2VuZTpxdWVyeS1oaWVyYXJjaHkg5Y+q6L+U5ZueIFVVSUQg5a2X56ym5LiyXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0cmVlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdnZXRTY2VuZVRyZWVEYXRhJyk7XG4gICAgICAgICAgICBpZiAodHJlZURhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJlZURhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgc2NlbmUtc2NyaXB0OiR7ZXJyPy5tZXNzYWdlIHx8IGVycn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWkh+eUqO+8muWwneivlemdouadvyBBUEnvvIjomb3nhLblroPov5Tlm57nmoTmoLzlvI/kuI3lr7nvvIlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGhpZXJhcmNoeSA9IGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6cXVlcnktaGllcmFyY2h5Jyk7XG4gICAgICAgICAgICBpZiAoaGllcmFyY2h5ICYmIHR5cGVvZiBoaWVyYXJjaHkgPT09ICdvYmplY3QnICYmIGhpZXJhcmNoeS51dWlkKSB7XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6L+U5Zue55qE5piv5a+56LGh5LiU5pyJIHV1aWTvvIzlj6/og73mmK/mraPnoa7nmoTmoJHnu5PmnoRcbiAgICAgICAgICAgICAgICByZXR1cm4gaGllcmFyY2h5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goYHBhbmVsOiR7ZXJyPy5tZXNzYWdlIHx8IGVycn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcnMuam9pbignIHwgJykgfHwgJ0ZhaWxlZCB0byBxdWVyeSBzY2VuZSB0cmVlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBmZXRjaE5vZGVEdW1wKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIC8vIOebtOaOpeS9v+eUqOWcuuaZr+iEmuacrO+8jOmBv+WFjSBzY2VuZTpxdWVyeS1ub2RlIOWcqCAyLjQuMTMg5Lit55qE6Zeu6aKYXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jYWxsU2NlbmVTY3JpcHQoJ2dldE5vZGVJbmZvJywgW3V1aWRdKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tub2RlLXRvb2xzXSBGYWlsZWQgdG8gZmV0Y2ggbm9kZSBkdW1wOicsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5vZGVVc2luZ1BhbmVsQVBJKG9wdGlvbnM6IHtcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBwYXJlbnQ/OiBzdHJpbmcgfCBudWxsO1xuICAgICAgICBub2RlVHlwZTogc3RyaW5nO1xuICAgICAgICBhc3NldFV1aWQ/OiBzdHJpbmcgfCBudWxsO1xuICAgICAgICBjb21wb25lbnRzPzogc3RyaW5nW107XG4gICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybT86IGJvb2xlYW47XG4gICAgICAgIHVubGlua1ByZWZhYj86IGJvb2xlYW47XG4gICAgfSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSBvcHRpb25zLnBhcmVudCB8fCAnJztcbiAgICAgICAgaWYgKG9wdGlvbnMuYXNzZXRVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZW5kVG9TY2VuZVBhbmVsKFxuICAgICAgICAgICAgICAgICdzY2VuZTpjcmVhdGUtbm9kZXMtYnktdXVpZHMnLFxuICAgICAgICAgICAgICAgIFtvcHRpb25zLmFzc2V0VXVpZF0sXG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogb3B0aW9ucy51bmxpbmtQcmVmYWIgPyB0cnVlIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiAhIW9wdGlvbnMua2VlcFdvcmxkVHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXNzSWQgPSB0aGlzLm1hcE5vZGVUeXBlVG9DbGFzc0lkKG9wdGlvbnMubm9kZVR5cGUpO1xuICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICAgICAgY29tcG9uZW50czogb3B0aW9ucy5jb21wb25lbnRzIHx8IFtdLFxuICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtOiAhIW9wdGlvbnMua2VlcFdvcmxkVHJhbnNmb3JtXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6Y3JlYXRlLW5vZGUtYnktY2xhc3NpZCcsIGNsYXNzSWQsIHBheWxvYWQsIHBhcmVudFV1aWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgbWFwTm9kZVR5cGVUb0NsYXNzSWQobm9kZVR5cGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICghbm9kZVR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnY2MuTm9kZSc7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG5vZGVUeXBlKSB7XG4gICAgICAgICAgICBjYXNlICcyRE5vZGUnOlxuICAgICAgICAgICAgY2FzZSAnM0ROb2RlJzpcbiAgICAgICAgICAgIGNhc2UgJ05vZGUnOlxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2NjLk5vZGUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHRyYWN0VXVpZEZyb21QYW5lbFJlc3VsdChyZXN1bHQ6IGFueSk6IHN0cmluZyB8IG51bGwge1xuICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpICYmIHJlc3VsdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdCA9IHJlc3VsdFswXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmlyc3QgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpcnN0ICYmIHR5cGVvZiBmaXJzdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3QudXVpZCB8fCBmaXJzdC5pZCB8fCBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnV1aWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LnV1aWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzdWx0LmlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2VuZFRvU2NlbmVQYW5lbChtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZWRpdG9yOiBhbnkgPSBFZGl0b3I7XG4gICAgICAgIGlmICghZWRpdG9yPy5JcGM/LnNlbmRUb1BhbmVsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0VkaXRvci5JcGMuc2VuZFRvUGFuZWwg5LiN5Y+v55SoJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuSXBjLnNlbmRUb1BhbmVsKCdzY2VuZScsIG1lc3NhZ2UsIC4uLmFyZ3MsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXBhcmVudE5vZGVzKFxuICAgICAgICB1dWlkczogc3RyaW5nW10sXG4gICAgICAgIHBhcmVudFV1aWQ6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogeyBrZWVwV29ybGRUcmFuc2Zvcm0/OiBib29sZWFuOyBzaWJsaW5nSW5kZXg/OiBudW1iZXIgfSA9IHt9XG4gICAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6bW92ZS1ub2RlcycsIHV1aWRzLCBwYXJlbnRVdWlkLCB7XG4gICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm06ICEhb3B0aW9ucy5rZWVwV29ybGRUcmFuc2Zvcm0sXG4gICAgICAgICAgICBzaWJsaW5nSW5kZXg6IG9wdGlvbnMuc2libGluZ0luZGV4ID8/IC0xXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZGVsZXRlTm9kZXModXVpZHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6ZGVsZXRlLW5vZGVzJywgdXVpZHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZHVwbGljYXRlTm9kZXModXVpZHM6IHN0cmluZ1tdLCBpbmNsdWRlQ2hpbGRyZW46IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6ZHVwbGljYXRlLW5vZGVzJywgdXVpZHMsIHsgaW5jbHVkZUNoaWxkcmVuIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdXBkYXRlTm9kZVByb3BlcnR5VmlhU2NlbmUodXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHBhbmVsUGF5bG9hZCA9IHtcbiAgICAgICAgICAgIGlkOiB1dWlkLFxuICAgICAgICAgICAgcGF0aDogcHJvcGVydHksXG4gICAgICAgICAgICB0eXBlOiB0aGlzLmluZmVyU2NlbmVQcm9wZXJ0eVR5cGUodmFsdWUpLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBpc1N1YlByb3A6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZFRvU2NlbmVQYW5lbCgnc2NlbmU6c2V0LXByb3BlcnR5JywgcGFuZWxQYXlsb2FkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tub2RlLXRvb2xzXSBzY2VuZTpzZXQtcHJvcGVydHkgcGFuZWwgZmFsbGJhY2s6JywgZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuY2FsbFNjZW5lU2NyaXB0KCdzZXROb2RlUHJvcGVydHknLCBbdXVpZCwgcHJvcGVydHksIHZhbHVlXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbmZlclNjZW5lUHJvcGVydHlUeXBlKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB2YWx1ZVR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZVR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1N0cmluZyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlVHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0Jvb2xlYW4nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZVR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0Zsb2F0JztcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnggIT09IHVuZGVmaW5lZCAmJiB2YWx1ZS55ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1ZlYyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ09iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICdVbmtub3duJztcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlc29sdmVBc3NldFV1aWQoYXNzZXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgYXNzZXRkYiA9IHRoaXMuZ2V0QXNzZXREQigpO1xuICAgICAgICBpZiAoIWFzc2V0ZGIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRWRpdG9yLmFzc2V0ZGIg5LiN5Y+v55SoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFzc2V0ZGIudXJsVG9VdWlkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gYXNzZXRkYi51cmxUb1V1aWQoYXNzZXRQYXRoKTtcbiAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFzc2V0ZGIucXVlcnlVdWlkQnlVcmwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgYXNzZXRkYi5xdWVyeVV1aWRCeVVybChhc3NldFBhdGgsIChlcnI6IEVycm9yIHwgbnVsbCwgdXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodXVpZCB8fCBudWxsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldGRiLnF1ZXJ5QXNzZXRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2V0ZGIucXVlcnlBc3NldHMoYXNzZXRQYXRoLCBbJ2Fzc2V0J10sIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBBcnJheS5pc0FycmF5KHJlc3VsdHMpICYmIHJlc3VsdHMubGVuZ3RoID4gMCA/IHJlc3VsdHNbMF0gOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1hdGNoPy51dWlkIHx8IG1hdGNoPy5maWxlSWQgfHwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QXNzZXREQigpOiBhbnkge1xuICAgICAgICBjb25zdCBlZGl0b3I6IGFueSA9IEVkaXRvcjtcbiAgICAgICAgcmV0dXJuIGVkaXRvcj8uYXNzZXRkYiB8fCBlZGl0b3I/LnJlbW90ZT8uYXNzZXRkYjtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNhbGxTY2VuZVNjcmlwdChtZXRob2Q6IHN0cmluZywgYXJnczogYW55W10gPSBbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXG4gICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICBhcmdzXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGVkaXRvcjogYW55ID0gRWRpdG9yO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFlZGl0b3I/LlNjZW5lPy5jYWxsU2NlbmVTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdFZGl0b3IuU2NlbmUuY2FsbFNjZW5lU2NyaXB0IOS4jeWPr+eUqCcpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLlNjZW5lLmNhbGxTY2VuZVNjcmlwdChcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgLi4ub3B0aW9ucy5hcmdzLFxuICAgICAgICAgICAgICAgICAgICAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==
import { ToolDefinition, ToolResponse, ToolExecutor, NodeInfo } from '../types';
import { ComponentTools } from './component-tools';

export class NodeTools implements ToolExecutor {
    private componentTools = new ComponentTools();
    getTools(): ToolDefinition[] {
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
                            description: 'Node type: Node (empty), 2DNode, 3DNode, or button (creates complete Button UI with Background and Label)',
                            enum: ['Node', '2DNode', '3DNode', 'button']
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
                        },
                        text: {
                            type: 'string',
                            description: 'Button text (only used when nodeType="button")',
                            default: 'button'
                        },
                        width: {
                            type: 'number',
                            description: 'Button width (only used when nodeType="button")',
                            default: 100
                        },
                        height: {
                            type: 'number',
                            description: 'Button height (only used when nodeType="button")',
                            default: 40
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

    async execute(toolName: string, args: any): Promise<ToolResponse> {
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

    private async createNode(args: any): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // 检查是否为特殊 UI 类型
                if (args.nodeType === 'button') {
                    console.log('[node-tools] Creating Button using template...');
                    try {
                        const { ButtonTemplate } = require('../ui-templates/button-template');
                        const result = await ButtonTemplate.create({
                            name: args.name,
                            parentUuid: args.parentUuid,
                            text: args.text || 'button',
                            width: args.width || 100,
                            height: args.height || 40
                        });
                        
                        console.log('[node-tools] Button template result:', result);
                        resolve(result);
                        return;
                    } catch (err: any) {
                        console.error('[node-tools] Button template failed:', err);
                        resolve({
                            success: false,
                            error: `Failed to create Button: ${err.message || err}`
                        });
                        return;
                    }
                }
                
                // 普通节点创建逻辑（原有代码）
                let targetParentUuid = args.parentUuid;
                
                // 如果没有提供父节点UUID，获取场景根节点
                if (!targetParentUuid) {
                    try {
                        const sceneInfo = await this.requestSceneTreeData();
                        const rootCandidate = Array.isArray(sceneInfo) ? sceneInfo[0] : sceneInfo;
                        if (rootCandidate && rootCandidate.uuid) {
                            targetParentUuid = rootCandidate.uuid;
                            console.log(`No parent specified, using scene root: ${targetParentUuid}`);
                        } else {
                            const currentScene = await this.callSceneScript('getCurrentSceneInfo');
                            if (currentScene?.data?.uuid) {
                                targetParentUuid = currentScene.data.uuid;
                            }
                        }
                    } catch (err) {
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
                    } catch (err) {
                        resolve({
                            success: false,
                            error: `Failed to resolve asset path '${args.assetPath}': ${err}`
                        });
                        return;
                    }
                }

                // 构建create-node选项
                const createNodeOptions: any = {
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
                } else if (args.nodeType && args.nodeType !== 'Node' && !finalAssetUuid) {
                    // 只有在不从资源实例化时才添加nodeType组件
                    createNodeOptions.components = [args.nodeType];
                }

                // 保持世界变换
                if (args.keepWorldTransform) {
                    createNodeOptions.keepWorldTransform = true;
                }

                // 直接使用场景脚本创建节点（面板 API 在 2.x 中有问题）
                console.log('[node-tools] Creating node via scene script...');
                let uuid: string | null = null;
                
                try {
                    const scriptResult = await this.callSceneScript('createNode', [args.name, targetParentUuid]);
                    console.log('[node-tools] Scene script result:', scriptResult);
                    
                    if (scriptResult && scriptResult.success && scriptResult.data && scriptResult.data.uuid) {
                        uuid = scriptResult.data.uuid;
                        console.log('[node-tools] ✅ Node created successfully:', uuid);
                    } else {
                        console.error('[node-tools] Scene script returned invalid result:', scriptResult);
                        throw new Error('Scene script did not return a valid UUID');
                    }
                } catch (scriptErr: any) {
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
                    } catch (err) {
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
                                } else {
                                    console.warn(`Failed to add component ${componentType}:`, result.error);
                                }
                            } catch (err) {
                                console.warn(`Failed to add component ${componentType}:`, err);
                            }
                        }
                    } catch (err) {
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
                    } catch (err) {
                        console.warn('Failed to set initial transform:', err);
                    }
                }

                // 获取创建后的节点信息进行验证
                let verificationData: any = null;
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
                } catch (err) {
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

            } catch (err: any) {
                resolve({ 
                    success: false, 
                    error: `Failed to create node: ${err.message}. Args: ${JSON.stringify(args)}`
                });
            }
        });
    }

    private async getNodeInfo(uuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            this.fetchNodeDump(uuid).then((nodeData: any) => {
                if (!nodeData) {
                    resolve({
                        success: false,
                        error: 'Node not found or invalid response'
                    });
                    return;
                }
                
                // 根据实际返回的数据结构解析节点信息
                const info: NodeInfo = {
                    uuid: nodeData.uuid?.value || uuid,
                    name: nodeData.name?.value || nodeData.name || 'Unknown',
                    active: nodeData.active?.value !== undefined ? nodeData.active.value : true,
                    position: nodeData.position?.value || { x: 0, y: 0, z: 0 },
                    rotation: nodeData.rotation?.value || { x: 0, y: 0, z: 0 },
                    scale: nodeData.scale?.value || { x: 1, y: 1, z: 1 },
                    parent: nodeData.parent?.value?.uuid || null,
                    children: nodeData.children || [],
                    components: (nodeData.__comps__ || nodeData.components || []).map((comp: any) => ({
                        type: comp.__type__ || comp.type || 'Unknown',
                        enabled: comp.enabled !== undefined ? comp.enabled : true
                    })),
                    layer: nodeData.layer?.value || 1073741824,
                    mobility: nodeData.mobility?.value || 0
                };
                resolve({ success: true, data: info });
            }).catch(async (err: Error) => {
                console.warn('[node-tools] getNodeInfo direct query failed, fallback to scene script:', err);
                try {
                    const scriptResult = await this.callSceneScript('getNodeInfo', [uuid]);
                    resolve(scriptResult);
                } catch (err2: any) {
                    resolve({ success: false, error: err2.message || err2 });
                }
            });
        });
    }

    private async findNodes(pattern: string, exactMatch: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree: any) => {
                const nodes: any[] = [];
                
                const searchTree = (node: any, parentPath: string = '') => {
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
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async findNodeByName(name: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree: any) => {
                let foundNodeData: { uuid: string; name: string; path: string } | null = null;
                
                const searchTree = (node: any, parentPath: string = ''): boolean => {
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
                } else {
                    resolve({ success: false, error: `Node '${name}' not found` });
                }
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private searchNodeInTree(node: any, targetName: string): any {
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

    private async getAllNodes(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            this.requestSceneTreeData().then((tree: any) => {
                const nodes: any[] = [];
                
                const traverseTree = (node: any, parentPath: string = '') => {
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
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private getNodePath(node: any): string {
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

    private async setNodeProperty(uuid: string, property: string, value: any): Promise<ToolResponse> {
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
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setNodeTransform(args: any): Promise<ToolResponse> {
        try {
            const { uuid, position, rotation, scale } = args;
            const transform: any = {};
            
            if (position) transform.position = position;
            if (rotation) transform.rotation = rotation;
            if (scale) transform.scale = scale;
            
            const result = await this.callSceneScript('setNodeTransform', [uuid, transform]);
            return result;
        } catch (err: any) {
            return { 
                success: false, 
                error: `Failed to update transform: ${err.message || err}` 
            };
        }
    }

    private is2DNode(nodeInfo: any): boolean {
        // Check if node has 2D-specific components or is under Canvas
        const components = nodeInfo.components || [];
        
        // Check for common 2D components
        const has2DComponents = components.some((comp: any) => 
            comp.type && (
                comp.type.includes('cc.Sprite') ||
                comp.type.includes('cc.Label') ||
                comp.type.includes('cc.Button') ||
                comp.type.includes('cc.Layout') ||
                comp.type.includes('cc.Widget') ||
                comp.type.includes('cc.Mask') ||
                comp.type.includes('cc.Graphics')
            )
        );
        
        if (has2DComponents) {
            return true;
        }
        
        // Check for 3D-specific components  
        const has3DComponents = components.some((comp: any) =>
            comp.type && (
                comp.type.includes('cc.MeshRenderer') ||
                comp.type.includes('cc.Camera') ||
                comp.type.includes('cc.Light') ||
                comp.type.includes('cc.DirectionalLight') ||
                comp.type.includes('cc.PointLight') ||
                comp.type.includes('cc.SpotLight')
            )
        );
        
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

    private normalizeTransformValue(value: any, type: 'position' | 'rotation' | 'scale', is2D: boolean): { value: any, warning?: string } {
        const result = { ...value };
        let warning: string | undefined;
        
        if (is2D) {
            switch (type) {
                case 'position':
                    if (value.z !== undefined && Math.abs(value.z) > 0.001) {
                        warning = `2D node: z position (${value.z}) ignored, set to 0`;
                        result.z = 0;
                    } else if (value.z === undefined) {
                        result.z = 0;
                    }
                    break;
                    
                case 'rotation':
                    if ((value.x !== undefined && Math.abs(value.x) > 0.001) || 
                        (value.y !== undefined && Math.abs(value.y) > 0.001)) {
                        warning = `2D node: x,y rotations ignored, only z rotation applied`;
                        result.x = 0;
                        result.y = 0;
                    } else {
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
        } else {
            // 3D node - ensure all axes are defined
            result.x = result.x !== undefined ? result.x : (type === 'scale' ? 1 : 0);
            result.y = result.y !== undefined ? result.y : (type === 'scale' ? 1 : 0);
            result.z = result.z !== undefined ? result.z : (type === 'scale' ? 1 : 0);
        }
        
        return { value: result, warning };
    }

    private async deleteNode(uuid: string): Promise<ToolResponse> {
        try {
            const result = await this.callSceneScript('deleteNode', [uuid]);
            return result;
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    }

    private async moveNode(nodeUuid: string, newParentUuid: string, siblingIndex: number = -1): Promise<ToolResponse> {
        try {
            const result = await this.callSceneScript('moveNode', [
                nodeUuid,
                newParentUuid,
                siblingIndex >= 0 ? siblingIndex : undefined
            ]);
            return result;
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    }

    private async duplicateNode(uuid: string, includeChildren: boolean = true): Promise<ToolResponse> {
        try {
            const result = await this.callSceneScript('duplicateNode', [uuid, includeChildren]);
            return result;
        } catch (err: any) {
            return { success: false, error: err.message || err };
        }
    }

    private async detectNodeType(uuid: string): Promise<ToolResponse> {
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
                const detectionReasons: string[] = [];
                
                // Check for 2D components
                const twoDComponents = components.filter((comp: any) => 
                    comp.type && (
                        comp.type.includes('cc.Sprite') ||
                        comp.type.includes('cc.Label') ||
                        comp.type.includes('cc.Button') ||
                        comp.type.includes('cc.Layout') ||
                        comp.type.includes('cc.Widget') ||
                        comp.type.includes('cc.Mask') ||
                        comp.type.includes('cc.Graphics')
                    )
                );
                
                // Check for 3D components
                const threeDComponents = components.filter((comp: any) =>
                    comp.type && (
                        comp.type.includes('cc.MeshRenderer') ||
                        comp.type.includes('cc.Camera') ||
                        comp.type.includes('cc.Light') ||
                        comp.type.includes('cc.DirectionalLight') ||
                        comp.type.includes('cc.PointLight') ||
                        comp.type.includes('cc.SpotLight')
                    )
                );

                if (twoDComponents.length > 0) {
                    detectionReasons.push(`Has 2D components: ${twoDComponents.map((c: any) => c.type).join(', ')}`);
                }
                
                if (threeDComponents.length > 0) {
                    detectionReasons.push(`Has 3D components: ${threeDComponents.map((c: any) => c.type).join(', ')}`);
                }
                
                // Check position for heuristic
                const position = nodeInfo.position;
                if (position && Math.abs(position.z) < 0.001) {
                    detectionReasons.push('Z position is ~0 (likely 2D)');
                } else if (position && Math.abs(position.z) > 0.001) {
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
                        components: components.map((comp: any) => ({
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
                
            } catch (err: any) {
                resolve({ 
                    success: false, 
                    error: `Failed to detect node type: ${err.message}` 
                });
            }
        });
    }

    private getComponentCategory(componentType: string): string {
        if (!componentType) return 'unknown';
        
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

    private async requestSceneTreeData(): Promise<any> {
        const errors: string[] = [];

        // 优先使用场景脚本，因为 scene:query-hierarchy 只返回 UUID 字符串
        try {
            const treeData = await this.callSceneScript('getSceneTreeData');
            if (treeData) {
                return treeData;
            }
        } catch (err: any) {
            errors.push(`scene-script:${err?.message || err}`);
        }

        // 备用：尝试面板 API（虽然它返回的格式不对）
        try {
            const hierarchy = await this.sendToScenePanel('scene:query-hierarchy');
            if (hierarchy && typeof hierarchy === 'object' && hierarchy.uuid) {
                // 如果返回的是对象且有 uuid，可能是正确的树结构
                return hierarchy;
            }
        } catch (err: any) {
            errors.push(`panel:${err?.message || err}`);
        }

        throw new Error(errors.join(' | ') || 'Failed to query scene tree');
    }

    private async fetchNodeDump(uuid: string): Promise<any> {
        // 直接使用场景脚本，避免 scene:query-node 在 2.4.13 中的问题
        try {
            return await this.callSceneScript('getNodeInfo', [uuid]);
        } catch (err: any) {
            console.error('[node-tools] Failed to fetch node dump:', err);
            throw err;
        }
    }

    private async createNodeUsingPanelAPI(options: {
        name: string;
        parent?: string | null;
        nodeType: string;
        assetUuid?: string | null;
        components?: string[];
        keepWorldTransform?: boolean;
        unlinkPrefab?: boolean;
    }): Promise<any> {
        const parentUuid = options.parent || '';
        if (options.assetUuid) {
            return await this.sendToScenePanel(
                'scene:create-nodes-by-uuids',
                [options.assetUuid],
                parentUuid,
                {
                    unlinkPrefab: options.unlinkPrefab ? true : null,
                    keepWorldTransform: !!options.keepWorldTransform
                }
            );
        }

        const classId = this.mapNodeTypeToClassId(options.nodeType);
        const payload = {
            name: options.name,
            components: options.components || [],
            keepWorldTransform: !!options.keepWorldTransform
        };

        return await this.sendToScenePanel('scene:create-node-by-classid', classId, payload, parentUuid);
    }

    private mapNodeTypeToClassId(nodeType: string): string {
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

    private extractUuidFromPanelResult(result: any): string | null {
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

    private async reparentNodes(
        uuids: string[],
        parentUuid: string,
        options: { keepWorldTransform?: boolean; siblingIndex?: number } = {}
    ): Promise<void> {
        await this.sendToScenePanel('scene:move-nodes', uuids, parentUuid, {
            keepWorldTransform: !!options.keepWorldTransform,
            siblingIndex: options.siblingIndex ?? -1
        });
    }

    private async deleteNodes(uuids: string[]): Promise<void> {
        await this.sendToScenePanel('scene:delete-nodes', uuids);
    }

    private async duplicateNodes(uuids: string[], includeChildren: boolean = true): Promise<any> {
        return await this.sendToScenePanel('scene:duplicate-nodes', uuids, { includeChildren });
    }

    private async updateNodePropertyViaScene(uuid: string, property: string, value: any): Promise<void> {
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
        } catch (err) {
            console.warn('[node-tools] scene:set-property panel fallback:', err);
        }

        await this.callSceneScript('setNodeProperty', [uuid, property, value]);
    }

    private inferScenePropertyType(value: any): string {
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

    private async resolveAssetUuid(assetPath: string): Promise<string | null> {
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
                assetdb.queryUuidByUrl(assetPath, (err: Error | null, uuid: string) => {
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
                assetdb.queryAssets(assetPath, ['asset'], (err: Error | null, results: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const match = Array.isArray(results) && results.length > 0 ? results[0] : null;
                    resolve(match?.uuid || match?.fileId || null);
                });
            });
        }

        return null;
    }

    private getAssetDB(): any {
        const editor: any = Editor;
        return editor?.assetdb || editor?.remote?.assetdb;
    }

    private async callSceneScript(method: string, args: any[] = []): Promise<any> {
        const options = {
            name: 'cocos-mcp-server',
            method,
            args
        };
        const editor: any = Editor;
        return new Promise((resolve, reject) => {
            if (!editor?.Scene?.callSceneScript) {
                reject(new Error('Editor.Scene.callSceneScript 不可用'));
                return;
            }

            try {
                editor.Scene.callSceneScript(
                    options.name,
                    options.method,
                    ...options.args,
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
}

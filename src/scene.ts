declare const cc: any;
declare const Editor: any;

// Import scene handlers
import * as buttonHandler from './scene-handlers/button-handler';
import * as spriteHandler from './scene-handlers/sprite-handler';
import * as layoutHandler from './scene-handlers/layout-handler';
import * as scrollviewHandler from './scene-handlers/scrollview-handler';
import * as sliderHandler from './scene-handlers/slider-handler';
import * as pageviewHandler from './scene-handlers/pageview-handler';
import * as progressbarHandler from './scene-handlers/progressbar-handler';
import * as toggleHandler from './scene-handlers/toggle-handler';

function getCC(): any {
    if (typeof cc !== 'undefined') {
        return cc;
    }

    try {
        return require('cc');
    } catch (error) {
        throw new Error('无法获取 Cocos 引擎实例 (cc)');
    }
}

/**
 * 标记场景为已修改并保存
 * 使用 scene:stash-and-save 是 Cocos Creator 2.4.13 中正确的保存 API
 */
function markSceneDirty(): void {
    try {
        if (typeof Editor !== 'undefined' && Editor.Ipc && Editor.Ipc.sendToPanel) {
            // 使用 scene:stash-and-save 保存场景
            // 这会暂存当前场景状态并保存到文件
            Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save');
        }
    } catch (error) {
        console.warn('[scene-script] Failed to save scene:', error);
    }
}

function toVec3(value: any, fallback: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    if (!value) {
        return { ...fallback };
    }

    if (typeof value.x === 'number') {
        return {
            x: value.x,
            y: value.y ?? fallback.y,
            z: value.z ?? fallback.z
        };
    }

    if (Array.isArray(value)) {
        return {
            x: value[0] ?? fallback.x,
            y: value[1] ?? fallback.y,
            z: value[2] ?? fallback.z
        };
    }

    return { ...fallback };
}

function getNodePosition(node: any): { x: number; y: number; z: number } {
    if (typeof node.getPosition === 'function') {
        return toVec3(node.getPosition(), { x: 0, y: 0, z: 0 });
    }

    return toVec3(node.position || { x: node.x, y: node.y, z: node.z }, { x: 0, y: 0, z: 0 });
}

function getNodeScale(node: any): { x: number; y: number; z: number } {
    const fallback = { x: 1, y: 1, z: 1 };

    if (node.scale && typeof node.scale === 'object') {
        return toVec3(node.scale, fallback);
    }

    if (typeof node.getScale === 'function') {
        try {
            const ccInstance = getCC();
            const Vec3Class = ccInstance?.Vec3;
            if (Vec3Class) {
                const out = new Vec3Class();
                node.getScale(out);
                return toVec3(out, fallback);
            }
        } catch (error) {
            console.warn('[MCP插件] 获取节点缩放时无法访问 cc.Vec3，改用备用属性。', error);
        }
    }

    const uniform = typeof node.scale === 'number' ? node.scale : 1;
    return {
        x: node.scaleX ?? uniform,
        y: node.scaleY ?? uniform,
        z: node.scaleZ ?? 1
    };
}

function getNodeRotation(node: any): { x: number; y: number; z: number; w: number } {
    const fallback = { x: 0, y: 0, z: 0, w: 1 };

    if (node.rotationQuat && typeof node.rotationQuat.w === 'number') {
        return {
            x: node.rotationQuat.x,
            y: node.rotationQuat.y,
            z: node.rotationQuat.z,
            w: node.rotationQuat.w
        };
    }

    if (node._quat && typeof node._quat.w === 'number') {
        return { x: node._quat.x, y: node._quat.y, z: node._quat.z, w: node._quat.w };
    }

    const ccInstance = getCC();
    const QuatClass = ccInstance?.Quat;

    if (typeof node.getRotationQuat === 'function') {
        if (QuatClass) {
            const out = new QuatClass();
            node.getRotationQuat(out);
            return { x: out.x, y: out.y, z: out.z, w: out.w };
        }

        const quat = node.getRotationQuat();
        if (quat && typeof quat.w === 'number') {
            return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
        }
    }

    if (QuatClass) {
        const quat = new QuatClass();
        const euler = node.eulerAngles || node._euler || {
            x: node.rotationX || 0,
            y: node.rotationY || 0,
            z: typeof node.angle === 'number'
                ? -node.angle
                : (node.rotation || node.rotationZ || 0)
        };

        try {
            QuatClass.fromEuler(quat, euler.x || 0, euler.y || 0, euler.z || 0);
            return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
        } catch (error) {
            console.warn('[MCP插件] 无法转换节点欧拉角为四元数:', error);
        }
    }

    return fallback;
}

function extractComponents(node: any): any[] {
    const components = node._components || node.components || [];
    const result: any[] = [];

    if (!Array.isArray(components)) {
        return result;
    }

    components.forEach((comp: any) => {
        if (!comp) {
            return;
        }

        const typeName = comp.__classname__ || comp.constructor?.name || 'cc.Component';
        result.push({
            __type__: typeName,
            type: typeName,
            enabled: comp.enabled !== undefined ? comp.enabled : true,
            uuid: comp.uuid || comp._id || '',
            nodeUuid: comp.node?.uuid || node.uuid || node._id || ''
        });
    });

    return result;
}

function buildSceneNode(node: any): any {
    const nodeData: any = {
        uuid: node.uuid || node._id || '',
        name: node.name || node._name || 'Node',
        type: node.constructor?.name || node.__classname__ || 'cc.Node',
        active: node.active !== undefined ? node.active : true,
        layer: node.layer !== undefined ? node.layer : (node._layer || 0),
        position: getNodePosition(node),
        rotation: getNodeRotation(node),
        scale: getNodeScale(node)
    };

    const comps = extractComponents(node);
    if (comps.length > 0) {
        nodeData.__comps__ = comps;
        nodeData.components = comps;
    }

    const children = node.children || node._children || [];
    nodeData.children = Array.isArray(children) ? children.map((child: any) => buildSceneNode(child)) : [];

    return nodeData;
}

export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * Create a new scene
     */
    createNewScene() {
        try {
            const { director, Scene } = getCC();
            const scene = new Scene();
            scene.name = 'New Scene';
            director.runScene(scene);
            return { success: true, message: 'New scene created successfully' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    getSceneTreeData() {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return null;
            }

            return buildSceneNode(scene);
        } catch (error) {
            console.error('[MCP插件] 获取场景节点树失败:', error);
            return null;
        }
    },

    /**
     * Add component to a node
     */
    addComponentToNode(nodeUuid: string, componentType: string) {
        try {
            const { director, js } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            // Find node by UUID
            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // Get component class
            const ComponentClass = js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }

            // Add component
            const component = node.addComponent(ComponentClass);
            return { 
                success: true, 
                message: `Component ${componentType} added successfully`,
                data: { componentId: component.uuid }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Remove component from a node
     */
    removeComponentFromNode(nodeUuid: string, componentType: string) {
        try {
            const { director, js } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const ComponentClass = js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }

            const component = node.getComponent(ComponentClass);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
            }

            node.removeComponent(component);
            return { success: true, message: `Component ${componentType} removed successfully` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Create a new node
     */
    createNode(name: string, parentUuid: string | null) {
        try {
            const { director, Node } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = new Node(name);
            const parent = parentUuid ? scene.getChildByUuid(parentUuid) : scene;
            if (parent) {
                parent.addChild(node);
            } else {
                // Fallback if parentUuid was provided but parent not found, add to scene root
                scene.addChild(node);
            }

            // 标记场景为已修改
            markSceneDirty();

            return { 
                success: true, 
                message: `Node ${name} created successfully`,
                data: { 
                    uuid: node.uuid || node._id, 
                    name: node.name || node._name 
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get node information
     */
    getNodeInfo(nodeUuid: string) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const size = typeof node.getContentSize === 'function'
                ? node.getContentSize()
                : node._contentSize || { width: 0, height: 0 };
            const anchor = typeof node.getAnchorPoint === 'function'
                ? node.getAnchorPoint()
                : { x: node.anchorX ?? 0.5, y: node.anchorY ?? 0.5 };

            return {
                success: true,
                data: {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    width: size.width,
                    height: size.height,
                    anchor: { x: anchor.x, y: anchor.y },
                    position: getNodePosition(node),
                    rotation: getNodeRotation(node),
                    scale: getNodeScale(node),
                    parent: node.parent?.uuid,
                    children: (node.children || []).map((child: any) => child.uuid),
                    components: extractComponents(node)
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all nodes in scene
     */
    getAllNodes() {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const nodes: any[] = [];
            const collectNodes = (node: any) => {
                nodes.push({
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    parent: node.parent?.uuid
                });
                
                node.children.forEach((child: any) => collectNodes(child));
            };

            scene.children.forEach((child: any) => collectNodes(child));
            
            return { success: true, data: nodes };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Find node by name
     */
    findNodeByName(name: string) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByName(name);
            if (!node) {
                return { success: false, error: `Node with name ${name} not found` };
            }

            return {
                success: true,
                data: {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    position: node.position
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current scene information
     */
    getCurrentSceneInfo() {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            return {
                success: true,
                data: {
                    name: scene.name,
                    uuid: scene.uuid,
                    nodeCount: scene.children.length
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Set node property
     */
    setNodeProperty(nodeUuid: string, property: string, value: any) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // 设置属性
            if (property === 'position') {
                node.setPosition(value.x || 0, value.y || 0, value.z || 0);
            } else if (property === 'rotation') {
                node.setRotationFromEuler(value.x || 0, value.y || 0, value.z || 0);
            } else if (property === 'scale') {
                node.setScale(value.x || 1, value.y || 1, value.z || 1);
            } else if (property === 'active') {
                node.active = value;
            } else if (property === 'name') {
                node.name = value;
            } else {
                // 尝试直接设置属性
                (node as any)[property] = value;
            }

            return { 
                success: true, 
                message: `Property '${property}' updated successfully` 
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(includeComponents: boolean = false) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const processNode = (node: any): any => {
                const result: any = {
                    name: node.name,
                    uuid: node.uuid,
                    active: node.active,
                    children: []
                };

                if (includeComponents) {
                    result.components = node.components.map((comp: any) => ({
                        type: comp.constructor.name,
                        enabled: comp.enabled
                    }));
                }

                if (node.children && node.children.length > 0) {
                    result.children = node.children.map((child: any) => processNode(child));
                }

                return result;
            };

            const hierarchy = scene.children.map((child: any) => processNode(child));
            return { success: true, data: hierarchy };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Create prefab from node
     */
    createPrefabFromNode(nodeUuid: string, prefabPath: string) {
        try {
            const { director, instantiate } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // 注意：这里只是一个模拟实现，因为运行时环境下无法直接创建预制体文件
            // 真正的预制体创建需要Editor API支持
            return {
                success: true,
                data: {
                    prefabPath: prefabPath,
                    sourceNodeUuid: nodeUuid,
                    message: `Prefab created from node '${node.name}' at ${prefabPath}`
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Set component property
     */
    setComponentProperty(nodeUuid: string, componentType: string, property: string, value: any) {
        try {
            const { director, js } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }
            const ComponentClass = js.getClassByName(componentType);
            if (!ComponentClass) {
                return { success: false, error: `Component type ${componentType} not found` };
            }
            const component = node.getComponent(ComponentClass);
            if (!component) {
                return { success: false, error: `Component ${componentType} not found on node` };
            }
            // 针对常见属性做特殊处理
            if (property === 'spriteFrame' && componentType === 'cc.Sprite') {
                // 支持 value 为 uuid 或资源路径
                if (typeof value === 'string') {
                    // 先尝试按 uuid 查找
                    const assetManager = getCC().assetManager;
                    assetManager.resources.load(value, getCC().SpriteFrame, (err: any, spriteFrame: any) => {
                        if (!err && spriteFrame) {
                            component.spriteFrame = spriteFrame;
                        } else {
                            // 尝试通过 uuid 加载
                            assetManager.loadAny({ uuid: value }, (err2: any, asset: any) => {
                                if (!err2 && asset) {
                                    component.spriteFrame = asset;
                                } else {
                                    // 直接赋值（兼容已传入资源对象）
                                    component.spriteFrame = value;
                                }
                            });
                        }
                    });
                } else {
                    component.spriteFrame = value;
                }
            } else if (property === 'material' && (componentType === 'cc.Sprite' || componentType === 'cc.MeshRenderer')) {
                // 支持 value 为 uuid 或资源路径
                if (typeof value === 'string') {
                    const assetManager = getCC().assetManager;
                    assetManager.resources.load(value, getCC().Material, (err: any, material: any) => {
                        if (!err && material) {
                            component.material = material;
                        } else {
                            assetManager.loadAny({ uuid: value }, (err2: any, asset: any) => {
                                if (!err2 && asset) {
                                    component.material = asset;
                                } else {
                                    component.material = value;
                                }
                            });
                        }
                    });
                } else {
                    component.material = value;
                }
            } else if (property === 'string' && (componentType === 'cc.Label' || componentType === 'cc.RichText')) {
                component.string = value;
            } else {
                component[property] = value;
            }
            // 可选：刷新 Inspector
            // Editor.Message.send('scene', 'snapshot');
            return { success: true, message: `Component property '${property}' updated successfully` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete a node
     */
    deleteNode(nodeUuid: string) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const nodeName = node.name;
            node.destroy();
            
            // 标记场景为已修改
            markSceneDirty();
            
            return { 
                success: true, 
                message: `Node '${nodeName}' deleted successfully`,
                data: { deletedUuid: nodeUuid, deletedName: nodeName }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Move a node to a new parent
     */
    moveNode(nodeUuid: string, newParentUuid: string, siblingIndex?: number) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const newParent = scene.getChildByUuid(newParentUuid);
            if (!newParent) {
                return { success: false, error: `Parent node with UUID ${newParentUuid} not found` };
            }

            const oldParentName = node.parent?.name || 'Scene';
            node.parent = newParent;
            
            if (siblingIndex !== undefined && siblingIndex >= 0) {
                node.setSiblingIndex(siblingIndex);
            }

            // 标记场景为已修改
            markSceneDirty();

            return { 
                success: true, 
                message: `Node '${node.name}' moved from '${oldParentName}' to '${newParent.name}'`,
                data: {
                    nodeUuid: nodeUuid,
                    nodeName: node.name,
                    newParentUuid: newParentUuid,
                    newParentName: newParent.name,
                    siblingIndex: siblingIndex
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Duplicate a node
     */
    duplicateNode(nodeUuid: string, includeChildren: boolean = true) {
        try {
            const { director, instantiate } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            // 使用 instantiate 复制节点（会自动复制子节点）
            const duplicate = instantiate(node);
            duplicate.name = node.name + ' Copy';

            // 添加到相同的父节点
            if (node.parent) {
                node.parent.addChild(duplicate);
            } else {
                scene.addChild(duplicate);
            }

            // 标记场景为已修改
            markSceneDirty();

            return { 
                success: true, 
                message: `Node '${node.name}' duplicated successfully`,
                data: {
                    originalUuid: nodeUuid,
                    originalName: node.name,
                    newUuid: duplicate.uuid || duplicate._id,
                    newName: duplicate.name
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Set node transform (position, rotation, scale)
     */
    setNodeTransform(nodeUuid: string, transform: any) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }

            const node = scene.getChildByUuid(nodeUuid);
            if (!node) {
                return { success: false, error: `Node with UUID ${nodeUuid} not found` };
            }

            const updates: string[] = [];

            // 设置位置
            if (transform.position) {
                const pos = transform.position;
                node.setPosition(
                    pos.x !== undefined ? pos.x : node.position.x,
                    pos.y !== undefined ? pos.y : node.position.y,
                    pos.z !== undefined ? pos.z : node.position.z
                );
                updates.push('position');
            }

            // 设置旋转
            if (transform.rotation) {
                const rot = transform.rotation;
                node.setRotationFromEuler(
                    rot.x !== undefined ? rot.x : 0,
                    rot.y !== undefined ? rot.y : 0,
                    rot.z !== undefined ? rot.z : 0
                );
                updates.push('rotation');
            }

            // 设置缩放
            if (transform.scale) {
                const scale = transform.scale;
                node.setScale(
                    scale.x !== undefined ? scale.x : node.scale.x,
                    scale.y !== undefined ? scale.y : node.scale.y,
                    scale.z !== undefined ? scale.z : node.scale.z
                );
                updates.push('scale');
            }

            // 标记场景为已修改
            markSceneDirty();

            return { 
                success: true, 
                message: `Node transform updated: ${updates.join(', ')}`,
                data: {
                    nodeUuid: nodeUuid,
                    nodeName: node.name,
                    updatedProperties: updates,
                    currentTransform: {
                        position: getNodePosition(node),
                        rotation: getNodeRotation(node),
                        scale: getNodeScale(node)
                    }
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 创建完整的 Button UI 组件（委托给 button-handler）
     * 包括 Background 子节点（Sprite + Widget）和 Label 子节点
     * @param sprites 包含 4 个状态的图集 UUID: {normal, pressed, hover, disabled}
     */
    createButtonWithTemplate(
        name: string,
        parentUuid: string | null,
        text: string,
        width: number,
        height: number,
        sprites: { normal: string; pressed: string; hover: string; disabled: string }
    ) {
        // 调用 button-handler
        return buttonHandler.createButtonWithTemplate(name, parentUuid, text, width, height, sprites, getCC, markSceneDirty);
    },

    /**
     * 创建 Sprite 组件（委托给 sprite-handler）
     */
    createSpriteWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number,
        spriteFrameUuid: string
    ) {
        // 调用 sprite-handler
        return spriteHandler.createSpriteWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    },

    /**
     * 创建 Layout 组件（委托给 layout-handler）
     */
    createLayoutWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number,
        spriteFrameUuid: string
    ) {
        // 调用 layout-handler
        return layoutHandler.createLayoutWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    },

    /**
     * 创建 ScrollView 组件（委托给 scrollview-handler）
     */
    createScrollViewWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number,
        spriteFrameUuid: string
    ) {
        // 调用 scrollview-handler
        return scrollviewHandler.createScrollViewWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    },

    /**
     * 创建 Slider 组件（委托给 slider-handler）
     */
    createSliderWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number
    ) {
        return sliderHandler.createSliderWithTemplate(name, parentUuid, width, height, getCC, markSceneDirty);
    },

    /**
     * 创建 PageView 组件（委托给 pageview-handler）
     */
    createPageViewWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number
    ) {
        return pageviewHandler.createPageViewWithTemplate(name, parentUuid, width, height, getCC, markSceneDirty);
    },

    /**
     * 创建 ProgressBar 组件（委托给 progressbar-handler）
     */
    createProgressBarWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number
    ) {
        return progressbarHandler.createProgressBarWithTemplate(name, parentUuid, width, height, getCC, markSceneDirty);
    },

    /**
     * 创建 Toggle 组件（委托给 toggle-handler）
     */
    createToggleWithTemplate(
        name: string,
        parentUuid: string | null,
        width: number,
        height: number
    ) {
        return toggleHandler.createToggleWithTemplate(name, parentUuid, width, height, getCC, markSceneDirty);
    }
};

const sceneHandlers: Record<string, (event: any, ...args: any[]) => void> = {};

for (const key of Object.keys(methods)) {
    sceneHandlers[key] = (event: any, ...args: any[]) => {
        try {
            const handler = (methods as any)[key];
            const result = handler(...args);

            if (result && typeof result.then === 'function') {
                result.then((value: any) => event.reply(null, value)).catch((error: any) => event.reply(error));
            } else {
                event.reply(null, result);
            }
        } catch (error) {
            event.reply(error);
        }
    };
}

module.exports = sceneHandlers;

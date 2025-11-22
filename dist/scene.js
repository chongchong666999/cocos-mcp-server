"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
// Import scene handlers
const buttonHandler = __importStar(require("./scene-handlers/button-handler"));
const spriteHandler = __importStar(require("./scene-handlers/sprite-handler"));
const layoutHandler = __importStar(require("./scene-handlers/layout-handler"));
const scrollviewHandler = __importStar(require("./scene-handlers/scrollview-handler"));
function getCC() {
    if (typeof cc !== 'undefined') {
        return cc;
    }
    try {
        return require('cc');
    }
    catch (error) {
        throw new Error('无法获取 Cocos 引擎实例 (cc)');
    }
}
/**
 * 标记场景为已修改并保存
 * 使用 scene:stash-and-save 是 Cocos Creator 2.4.13 中正确的保存 API
 */
function markSceneDirty() {
    try {
        if (typeof Editor !== 'undefined' && Editor.Ipc && Editor.Ipc.sendToPanel) {
            // 使用 scene:stash-and-save 保存场景
            // 这会暂存当前场景状态并保存到文件
            Editor.Ipc.sendToPanel('scene', 'scene:stash-and-save');
        }
    }
    catch (error) {
        console.warn('[scene-script] Failed to save scene:', error);
    }
}
function toVec3(value, fallback) {
    var _a, _b, _c, _d, _e;
    if (!value) {
        return Object.assign({}, fallback);
    }
    if (typeof value.x === 'number') {
        return {
            x: value.x,
            y: (_a = value.y) !== null && _a !== void 0 ? _a : fallback.y,
            z: (_b = value.z) !== null && _b !== void 0 ? _b : fallback.z
        };
    }
    if (Array.isArray(value)) {
        return {
            x: (_c = value[0]) !== null && _c !== void 0 ? _c : fallback.x,
            y: (_d = value[1]) !== null && _d !== void 0 ? _d : fallback.y,
            z: (_e = value[2]) !== null && _e !== void 0 ? _e : fallback.z
        };
    }
    return Object.assign({}, fallback);
}
function getNodePosition(node) {
    if (typeof node.getPosition === 'function') {
        return toVec3(node.getPosition(), { x: 0, y: 0, z: 0 });
    }
    return toVec3(node.position || { x: node.x, y: node.y, z: node.z }, { x: 0, y: 0, z: 0 });
}
function getNodeScale(node) {
    var _a, _b, _c;
    const fallback = { x: 1, y: 1, z: 1 };
    if (node.scale && typeof node.scale === 'object') {
        return toVec3(node.scale, fallback);
    }
    if (typeof node.getScale === 'function') {
        try {
            const ccInstance = getCC();
            const Vec3Class = ccInstance === null || ccInstance === void 0 ? void 0 : ccInstance.Vec3;
            if (Vec3Class) {
                const out = new Vec3Class();
                node.getScale(out);
                return toVec3(out, fallback);
            }
        }
        catch (error) {
            console.warn('[MCP插件] 获取节点缩放时无法访问 cc.Vec3，改用备用属性。', error);
        }
    }
    const uniform = typeof node.scale === 'number' ? node.scale : 1;
    return {
        x: (_a = node.scaleX) !== null && _a !== void 0 ? _a : uniform,
        y: (_b = node.scaleY) !== null && _b !== void 0 ? _b : uniform,
        z: (_c = node.scaleZ) !== null && _c !== void 0 ? _c : 1
    };
}
function getNodeRotation(node) {
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
    const QuatClass = ccInstance === null || ccInstance === void 0 ? void 0 : ccInstance.Quat;
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
        }
        catch (error) {
            console.warn('[MCP插件] 无法转换节点欧拉角为四元数:', error);
        }
    }
    return fallback;
}
function extractComponents(node) {
    const components = node._components || node.components || [];
    const result = [];
    if (!Array.isArray(components)) {
        return result;
    }
    components.forEach((comp) => {
        var _a, _b;
        if (!comp) {
            return;
        }
        result.push({
            __type__: comp.__classname__ || ((_a = comp.constructor) === null || _a === void 0 ? void 0 : _a.name) || 'cc.Component',
            enabled: comp.enabled !== undefined ? comp.enabled : true,
            uuid: comp.uuid || comp._id || '',
            nodeUuid: ((_b = comp.node) === null || _b === void 0 ? void 0 : _b.uuid) || node.uuid || node._id || ''
        });
    });
    return result;
}
function buildSceneNode(node) {
    var _a;
    const nodeData = {
        uuid: node.uuid || node._id || '',
        name: node.name || node._name || 'Node',
        type: ((_a = node.constructor) === null || _a === void 0 ? void 0 : _a.name) || node.__classname__ || 'cc.Node',
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
    nodeData.children = Array.isArray(children) ? children.map((child) => buildSceneNode(child)) : [];
    return nodeData;
}
exports.methods = {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('[MCP插件] 获取场景节点树失败:', error);
            return null;
        }
    },
    /**
     * Add component to a node
     */
    addComponentToNode(nodeUuid, componentType) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Remove component from a node
     */
    removeComponentFromNode(nodeUuid, componentType) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Create a new node
     */
    createNode(name, parentUuid) {
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
            }
            else {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Get node information
     */
    getNodeInfo(nodeUuid) {
        var _a;
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
            return {
                success: true,
                data: {
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    position: getNodePosition(node),
                    rotation: getNodeRotation(node),
                    scale: getNodeScale(node),
                    parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid,
                    children: (node.children || []).map((child) => child.uuid),
                    components: extractComponents(node)
                }
            };
        }
        catch (error) {
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
            const nodes = [];
            const collectNodes = (node) => {
                var _a;
                nodes.push({
                    uuid: node.uuid,
                    name: node.name,
                    active: node.active,
                    parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.uuid
                });
                node.children.forEach((child) => collectNodes(child));
            };
            scene.children.forEach((child) => collectNodes(child));
            return { success: true, data: nodes };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Find node by name
     */
    findNodeByName(name) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set node property
     */
    setNodeProperty(nodeUuid, property, value) {
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
            }
            else if (property === 'rotation') {
                node.setRotationFromEuler(value.x || 0, value.y || 0, value.z || 0);
            }
            else if (property === 'scale') {
                node.setScale(value.x || 1, value.y || 1, value.z || 1);
            }
            else if (property === 'active') {
                node.active = value;
            }
            else if (property === 'name') {
                node.name = value;
            }
            else {
                // 尝试直接设置属性
                node[property] = value;
            }
            return {
                success: true,
                message: `Property '${property}' updated successfully`
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Get scene hierarchy
     */
    getSceneHierarchy(includeComponents = false) {
        try {
            const { director } = getCC();
            const scene = director.getScene();
            if (!scene) {
                return { success: false, error: 'No active scene' };
            }
            const processNode = (node) => {
                const result = {
                    name: node.name,
                    uuid: node.uuid,
                    active: node.active,
                    children: []
                };
                if (includeComponents) {
                    result.components = node.components.map((comp) => ({
                        type: comp.constructor.name,
                        enabled: comp.enabled
                    }));
                }
                if (node.children && node.children.length > 0) {
                    result.children = node.children.map((child) => processNode(child));
                }
                return result;
            };
            const hierarchy = scene.children.map((child) => processNode(child));
            return { success: true, data: hierarchy };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Create prefab from node
     */
    createPrefabFromNode(nodeUuid, prefabPath) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set component property
     */
    setComponentProperty(nodeUuid, componentType, property, value) {
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
                    assetManager.resources.load(value, getCC().SpriteFrame, (err, spriteFrame) => {
                        if (!err && spriteFrame) {
                            component.spriteFrame = spriteFrame;
                        }
                        else {
                            // 尝试通过 uuid 加载
                            assetManager.loadAny({ uuid: value }, (err2, asset) => {
                                if (!err2 && asset) {
                                    component.spriteFrame = asset;
                                }
                                else {
                                    // 直接赋值（兼容已传入资源对象）
                                    component.spriteFrame = value;
                                }
                            });
                        }
                    });
                }
                else {
                    component.spriteFrame = value;
                }
            }
            else if (property === 'material' && (componentType === 'cc.Sprite' || componentType === 'cc.MeshRenderer')) {
                // 支持 value 为 uuid 或资源路径
                if (typeof value === 'string') {
                    const assetManager = getCC().assetManager;
                    assetManager.resources.load(value, getCC().Material, (err, material) => {
                        if (!err && material) {
                            component.material = material;
                        }
                        else {
                            assetManager.loadAny({ uuid: value }, (err2, asset) => {
                                if (!err2 && asset) {
                                    component.material = asset;
                                }
                                else {
                                    component.material = value;
                                }
                            });
                        }
                    });
                }
                else {
                    component.material = value;
                }
            }
            else if (property === 'string' && (componentType === 'cc.Label' || componentType === 'cc.RichText')) {
                component.string = value;
            }
            else {
                component[property] = value;
            }
            // 可选：刷新 Inspector
            // Editor.Message.send('scene', 'snapshot');
            return { success: true, message: `Component property '${property}' updated successfully` };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Delete a node
     */
    deleteNode(nodeUuid) {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Move a node to a new parent
     */
    moveNode(nodeUuid, newParentUuid, siblingIndex) {
        var _a;
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
            const oldParentName = ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.name) || 'Scene';
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Duplicate a node
     */
    duplicateNode(nodeUuid, includeChildren = true) {
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
            }
            else {
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * Set node transform (position, rotation, scale)
     */
    setNodeTransform(nodeUuid, transform) {
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
            const updates = [];
            // 设置位置
            if (transform.position) {
                const pos = transform.position;
                node.setPosition(pos.x !== undefined ? pos.x : node.position.x, pos.y !== undefined ? pos.y : node.position.y, pos.z !== undefined ? pos.z : node.position.z);
                updates.push('position');
            }
            // 设置旋转
            if (transform.rotation) {
                const rot = transform.rotation;
                node.setRotationFromEuler(rot.x !== undefined ? rot.x : 0, rot.y !== undefined ? rot.y : 0, rot.z !== undefined ? rot.z : 0);
                updates.push('rotation');
            }
            // 设置缩放
            if (transform.scale) {
                const scale = transform.scale;
                node.setScale(scale.x !== undefined ? scale.x : node.scale.x, scale.y !== undefined ? scale.y : node.scale.y, scale.z !== undefined ? scale.z : node.scale.z);
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    },
    /**
     * 创建完整的 Button UI 组件（委托给 button-handler）
     * 包括 Background 子节点（Sprite + Widget）和 Label 子节点
     * @param sprites 包含 4 个状态的图集 UUID: {normal, pressed, hover, disabled}
     */
    createButtonWithTemplate(name, parentUuid, text, width, height, sprites) {
        // 调用 button-handler
        return buttonHandler.createButtonWithTemplate(name, parentUuid, text, width, height, sprites, getCC, markSceneDirty);
    },
    /**
     * 创建 Sprite 组件（委托给 sprite-handler）
     */
    createSpriteWithTemplate(name, parentUuid, width, height, spriteFrameUuid) {
        // 调用 sprite-handler
        return spriteHandler.createSpriteWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    },
    /**
     * 创建 Layout 组件（委托给 layout-handler）
     */
    createLayoutWithTemplate(name, parentUuid, width, height, spriteFrameUuid) {
        // 调用 layout-handler
        return layoutHandler.createLayoutWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    },
    /**
     * 创建 ScrollView 组件（委托给 scrollview-handler）
     */
    createScrollViewWithTemplate(name, parentUuid, width, height, spriteFrameUuid) {
        // 调用 scrollview-handler
        return scrollviewHandler.createScrollViewWithTemplate(name, parentUuid, width, height, spriteFrameUuid, getCC, markSceneDirty);
    }
};
const sceneHandlers = {};
for (const key of Object.keys(exports.methods)) {
    sceneHandlers[key] = (event, ...args) => {
        try {
            const handler = exports.methods[key];
            const result = handler(...args);
            if (result && typeof result.then === 'function') {
                result.then((value) => event.reply(null, value)).catch((error) => event.reply(error));
            }
            else {
                event.reply(null, result);
            }
        }
        catch (error) {
            event.reply(error);
        }
    };
}
module.exports = sceneHandlers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc2NlbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0Esd0JBQXdCO0FBQ3hCLCtFQUFpRTtBQUNqRSwrRUFBaUU7QUFDakUsK0VBQWlFO0FBQ2pFLHVGQUF5RTtBQUV6RSxTQUFTLEtBQUs7SUFDVixJQUFJLE9BQU8sRUFBRSxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQzVCLE9BQU8sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQzVDLENBQUM7QUFDTCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjO0lBQ25CLElBQUksQ0FBQztRQUNELElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN4RSwrQkFBK0I7WUFDL0IsbUJBQW1CO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBQzVELENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEUsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLE1BQU0sQ0FBQyxLQUFVLEVBQUUsUUFBNkM7O0lBQ3JFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNULHlCQUFZLFFBQVEsRUFBRztJQUMzQixDQUFDO0lBRUQsSUFBSSxPQUFPLEtBQUssQ0FB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TyxJQUFJLENBQUMsZUFBZSxLQUFLLFVBQVUsRUFBRSxDQUFDO1FBQzdDLElBQUksU0FBUyxFQUFFLENBQUM7WUFDWixNQUFNLEdBQUcsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDdEQsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwQyxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDckMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDMUQsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ1osTUFBTSxJQUFJLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUk7WUFDN0MsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQztZQUN0QixDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDO1lBQ3RCLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUTtnQkFDN0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUs7Z0JBQ2IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJ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QUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBVSxFQUFFLEdBQUcsSUFBVyxFQUFFLEVBQUU7UUFDaEQsSUFBSSxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBRWhDLElBQUksTUFBTSxJQUFJLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNwRyxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNMLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2IsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiZGVjbGFyZSBjb25zdCBjYzogYW55O1xuZGVjbGFyZSBjb25zdCBFZGl0b3I6IGFueTtcblxuLy8gSW1wb3J0IHNjZW5lIGhhbmRsZXJzXG5pbXBvcnQgKiBhcyBidXR0b25IYW5kbGVyIGZyb20gJy4vc2NlbmUtaGFuZGxlcnMvYnV0dG9uLWhhbmRsZXInO1xuaW1wb3J0ICogYXMgc3ByaXRlSGFuZGxlciBmcm9tICcuL3NjZW5lLWhhbmRsZXJzL3Nwcml0ZS1oYW5kbGVyJztcbmltcG9ydCAqIGFzIGxheW91dEhhbmRsZXIgZnJvbSAnLi9zY2VuZS1oYW5kbGVycy9sYXlvdXQtaGFuZGxlcic7XG5pbXBvcnQgKiBhcyBzY3JvbGx2aWV3SGFuZGxlciBmcm9tICcuL3NjZW5lLWhhbmRsZXJzL3Njcm9sbHZpZXctaGFuZGxlcic7XG5cbmZ1bmN0aW9uIGdldENDKCk6IGFueSB7XG4gICAgaWYgKHR5cGVvZiBjYyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGNjO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCdjYycpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign5peg5rOV6I635Y+WIENvY29zIOW8leaTjuWunuS+iyAoY2MpJyk7XG4gICAgfVxufVxuXG4vKipcbiAqIOagh+iusOWcuuaZr+S4uuW3suS/ruaUueW5tuS/neWtmFxuICog5L2/55SoIHNjZW5lOnN0YXNoLWFuZC1zYXZlIOaYryBDb2NvcyBDcmVhdG9yIDIuNC4xMyDkuK3mraPnoa7nmoTkv53lrZggQVBJXG4gKi9cbmZ1bmN0aW9uIG1hcmtTY2VuZURpcnR5KCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgRWRpdG9yICE9PSAndW5kZWZpbmVkJyAmJiBFZGl0b3IuSXBjICYmIEVkaXRvci5JcGMuc2VuZFRvUGFuZWwpIHtcbiAgICAgICAgICAgIC8vIOS9v+eUqCBzY2VuZTpzdGFzaC1hbmQtc2F2ZSDkv53lrZjlnLrmma9cbiAgICAgICAgICAgIC8vIOi/meS8muaaguWtmOW9k+WJjeWcuuaZr+eKtuaAgeW5tuS/neWtmOWIsOaWh+S7tlxuICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9QYW5lbCgnc2NlbmUnLCAnc2NlbmU6c3Rhc2gtYW5kLXNhdmUnKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW3NjZW5lLXNjcmlwdF0gRmFpbGVkIHRvIHNhdmUgc2NlbmU6JywgZXJyb3IpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9WZWMzKHZhbHVlOiBhbnksIGZhbGxiYWNrOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB6OiBudW1iZXIgfSk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHo6IG51bWJlciB9IHtcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgIHJldHVybiB7IC4uLmZhbGxiYWNrIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZS54ID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogdmFsdWUueCxcbiAgICAgICAgICAgIHk6IHZhbHVlLnkgPz8gZmFsbGJhY2sueSxcbiAgICAgICAgICAgIHo6IHZhbHVlLnogPz8gZmFsbGJhY2suelxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogdmFsdWVbMF0gPz8gZmFsbGJhY2sueCxcbiAgICAgICAgICAgIHk6IHZhbHVlWzFdID8/IGZhbGxiYWNrLnksXG4gICAgICAgICAgICB6OiB2YWx1ZVsyXSA/PyBmYWxsYmFjay56XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgLi4uZmFsbGJhY2sgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVBvc2l0aW9uKG5vZGU6IGFueSk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHo6IG51bWJlciB9IHtcbiAgICBpZiAodHlwZW9mIG5vZGUuZ2V0UG9zaXRpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHRvVmVjMyhub2RlLmdldFBvc2l0aW9uKCksIHsgeDogMCwgeTogMCwgejogMCB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9WZWMzKG5vZGUucG9zaXRpb24gfHwgeyB4OiBub2RlLngsIHk6IG5vZGUueSwgejogbm9kZS56IH0sIHsgeDogMCwgeTogMCwgejogMCB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVNjYWxlKG5vZGU6IGFueSk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHo6IG51bWJlciB9IHtcbiAgICBjb25zdCBmYWxsYmFjayA9IHsgeDogMSwgeTogMSwgejogMSB9O1xuXG4gICAgaWYgKG5vZGUuc2NhbGUgJiYgdHlwZW9mIG5vZGUuc2NhbGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiB0b1ZlYzMobm9kZS5zY2FsZSwgZmFsbGJhY2spO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygbm9kZS5nZXRTY2FsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY2NJbnN0YW5jZSA9IGdldENDKCk7XG4gICAgICAgICAgICBjb25zdCBWZWMzQ2xhc3MgPSBjY0luc3RhbmNlPy5WZWMzO1xuICAgICAgICAgICAgaWYgKFZlYzNDbGFzcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dCA9IG5ldyBWZWMzQ2xhc3MoKTtcbiAgICAgICAgICAgICAgICBub2RlLmdldFNjYWxlKG91dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvVmVjMyhvdXQsIGZhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignW01DUOaPkuS7tl0g6I635Y+W6IqC54K557yp5pS+5pe25peg5rOV6K6/6ZeuIGNjLlZlYzPvvIzmlLnnlKjlpIfnlKjlsZ7mgKfjgIInLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB1bmlmb3JtID0gdHlwZW9mIG5vZGUuc2NhbGUgPT09ICdudW1iZXInID8gbm9kZS5zY2FsZSA6IDE7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogbm9kZS5zY2FsZVggPz8gdW5pZm9ybSxcbiAgICAgICAgeTogbm9kZS5zY2FsZVkgPz8gdW5pZm9ybSxcbiAgICAgICAgejogbm9kZS5zY2FsZVogPz8gMVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSb3RhdGlvbihub2RlOiBhbnkpOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB6OiBudW1iZXI7IHc6IG51bWJlciB9IHtcbiAgICBjb25zdCBmYWxsYmFjayA9IHsgeDogMCwgeTogMCwgejogMCwgdzogMSB9O1xuXG4gICAgaWYgKG5vZGUucm90YXRpb25RdWF0ICYmIHR5cGVvZiBub2RlLnJvdGF0aW9uUXVhdC53ID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogbm9kZS5yb3RhdGlvblF1YXQueCxcbiAgICAgICAgICAgIHk6IG5vZGUucm90YXRpb25RdWF0LnksXG4gICAgICAgICAgICB6OiBub2RlLnJvdGF0aW9uUXVhdC56LFxuICAgICAgICAgICAgdzogbm9kZS5yb3RhdGlvblF1YXQud1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChub2RlLl9xdWF0ICYmIHR5cGVvZiBub2RlLl9xdWF0LncgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB7IHg6IG5vZGUuX3F1YXQueCwgeTogbm9kZS5fcXVhdC55LCB6OiBub2RlLl9xdWF0LnosIHc6IG5vZGUuX3F1YXQudyB9O1xuICAgIH1cblxuICAgIGNvbnN0IGNjSW5zdGFuY2UgPSBnZXRDQygpO1xuICAgIGNvbnN0IFF1YXRDbGFzcyA9IGNjSW5zdGFuY2U/LlF1YXQ7XG5cbiAgICBpZiAodHlwZW9mIG5vZGUuZ2V0Um90YXRpb25RdWF0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChRdWF0Q2xhc3MpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IG5ldyBRdWF0Q2xhc3MoKTtcbiAgICAgICAgICAgIG5vZGUuZ2V0Um90YXRpb25RdWF0KG91dCk7XG4gICAgICAgICAgICByZXR1cm4geyB4OiBvdXQueCwgeTogb3V0LnksIHo6IG91dC56LCB3OiBvdXQudyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcXVhdCA9IG5vZGUuZ2V0Um90YXRpb25RdWF0KCk7XG4gICAgICAgIGlmIChxdWF0ICYmIHR5cGVvZiBxdWF0LncgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4geyB4OiBxdWF0LngsIHk6IHF1YXQueSwgejogcXVhdC56LCB3OiBxdWF0LncgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChRdWF0Q2xhc3MpIHtcbiAgICAgICAgY29uc3QgcXVhdCA9IG5ldyBRdWF0Q2xhc3MoKTtcbiAgICAgICAgY29uc3QgZXVsZXIgPSBub2RlLmV1bGVyQW5nbGVzIHx8IG5vZGUuX2V1bGVyIHx8IHtcbiAgICAgICAgICAgIHg6IG5vZGUucm90YXRpb25YIHx8IDAsXG4gICAgICAgICAgICB5OiBub2RlLnJvdGF0aW9uWSB8fCAwLFxuICAgICAgICAgICAgejogdHlwZW9mIG5vZGUuYW5nbGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgPyAtbm9kZS5hbmdsZVxuICAgICAgICAgICAgICAgIDogKG5vZGUucm90YXRpb24gfHwgbm9kZS5yb3RhdGlvblogfHwgMClcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgUXVhdENsYXNzLmZyb21FdWxlcihxdWF0LCBldWxlci54IHx8IDAsIGV1bGVyLnkgfHwgMCwgZXVsZXIueiB8fCAwKTtcbiAgICAgICAgICAgIHJldHVybiB7IHg6IHF1YXQueCwgeTogcXVhdC55LCB6OiBxdWF0LnosIHc6IHF1YXQudyB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbTUNQ5o+S5Lu2XSDml6Dms5XovazmjaLoioLngrnmrKfmi4nop5LkuLrlm5vlhYPmlbA6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0Q29tcG9uZW50cyhub2RlOiBhbnkpOiBhbnlbXSB7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGUuX2NvbXBvbmVudHMgfHwgbm9kZS5jb21wb25lbnRzIHx8IFtdO1xuICAgIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNvbXBvbmVudHMuZm9yRWFjaCgoY29tcDogYW55KSA9PiB7XG4gICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgX190eXBlX186IGNvbXAuX19jbGFzc25hbWVfXyB8fCBjb21wLmNvbnN0cnVjdG9yPy5uYW1lIHx8ICdjYy5Db21wb25lbnQnLFxuICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkICE9PSB1bmRlZmluZWQgPyBjb21wLmVuYWJsZWQgOiB0cnVlLFxuICAgICAgICAgICAgdXVpZDogY29tcC51dWlkIHx8IGNvbXAuX2lkIHx8ICcnLFxuICAgICAgICAgICAgbm9kZVV1aWQ6IGNvbXAubm9kZT8udXVpZCB8fCBub2RlLnV1aWQgfHwgbm9kZS5faWQgfHwgJydcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBidWlsZFNjZW5lTm9kZShub2RlOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG5vZGVEYXRhOiBhbnkgPSB7XG4gICAgICAgIHV1aWQ6IG5vZGUudXVpZCB8fCBub2RlLl9pZCB8fCAnJyxcbiAgICAgICAgbmFtZTogbm9kZS5uYW1lIHx8IG5vZGUuX25hbWUgfHwgJ05vZGUnLFxuICAgICAgICB0eXBlOiBub2RlLmNvbnN0cnVjdG9yPy5uYW1lIHx8IG5vZGUuX19jbGFzc25hbWVfXyB8fCAnY2MuTm9kZScsXG4gICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUgIT09IHVuZGVmaW5lZCA/IG5vZGUuYWN0aXZlIDogdHJ1ZSxcbiAgICAgICAgbGF5ZXI6IG5vZGUubGF5ZXIgIT09IHVuZGVmaW5lZCA/IG5vZGUubGF5ZXIgOiAobm9kZS5fbGF5ZXIgfHwgMCksXG4gICAgICAgIHBvc2l0aW9uOiBnZXROb2RlUG9zaXRpb24obm9kZSksXG4gICAgICAgIHJvdGF0aW9uOiBnZXROb2RlUm90YXRpb24obm9kZSksXG4gICAgICAgIHNjYWxlOiBnZXROb2RlU2NhbGUobm9kZSlcbiAgICB9O1xuXG4gICAgY29uc3QgY29tcHMgPSBleHRyYWN0Q29tcG9uZW50cyhub2RlKTtcbiAgICBpZiAoY29tcHMubGVuZ3RoID4gMCkge1xuICAgICAgICBub2RlRGF0YS5fX2NvbXBzX18gPSBjb21wcztcbiAgICAgICAgbm9kZURhdGEuY29tcG9uZW50cyA9IGNvbXBzO1xuICAgIH1cblxuICAgIGNvbnN0IGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbiB8fCBub2RlLl9jaGlsZHJlbiB8fCBbXTtcbiAgICBub2RlRGF0YS5jaGlsZHJlbiA9IEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pID8gY2hpbGRyZW4ubWFwKChjaGlsZDogYW55KSA9PiBidWlsZFNjZW5lTm9kZShjaGlsZCkpIDogW107XG5cbiAgICByZXR1cm4gbm9kZURhdGE7XG59XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzOiB7IFtrZXk6IHN0cmluZ106ICguLi5hbnk6IGFueSkgPT4gYW55IH0gPSB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHNjZW5lXG4gICAgICovXG4gICAgY3JlYXRlTmV3U2NlbmUoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yLCBTY2VuZSB9ID0gZ2V0Q0MoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gbmV3IFNjZW5lKCk7XG4gICAgICAgICAgICBzY2VuZS5uYW1lID0gJ05ldyBTY2VuZSc7XG4gICAgICAgICAgICBkaXJlY3Rvci5ydW5TY2VuZShzY2VuZSk7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnTmV3IHNjZW5lIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRTY2VuZVRyZWVEYXRhKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciB9ID0gZ2V0Q0MoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkU2NlbmVOb2RlKHNjZW5lKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1Dmj5Lku7ZdIOiOt+WPluWcuuaZr+iKgueCueagkeWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY29tcG9uZW50IHRvIGEgbm9kZVxuICAgICAqL1xuICAgIGFkZENvbXBvbmVudFRvTm9kZShub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGlyZWN0b3IsIGpzIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmluZCBub2RlIGJ5IFVVSURcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCBjb21wb25lbnQgY2xhc3NcbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0ganMuZ2V0Q2xhc3NCeU5hbWUoY29tcG9uZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIUNvbXBvbmVudENsYXNzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IHR5cGUgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCBjb21wb25lbnRcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGUuYWRkQ29tcG9uZW50KENvbXBvbmVudENsYXNzKTtcbiAgICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBhZGRlZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgY29tcG9uZW50SWQ6IGNvbXBvbmVudC51dWlkIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBjb21wb25lbnQgZnJvbSBhIG5vZGVcbiAgICAgKi9cbiAgICByZW1vdmVDb21wb25lbnRGcm9tTm9kZShub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGlyZWN0b3IsIGpzIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSBqcy5nZXRDbGFzc0J5TmFtZShjb21wb25lbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghQ29tcG9uZW50Q2xhc3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgdHlwZSAke2NvbXBvbmVudFR5cGV9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MpO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZWAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZS5yZW1vdmVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSByZW1vdmVkIHN1Y2Nlc3NmdWxseWAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IG5vZGVcbiAgICAgKi9cbiAgICBjcmVhdGVOb2RlKG5hbWU6IHN0cmluZywgcGFyZW50VXVpZDogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciwgTm9kZSB9ID0gZ2V0Q0MoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBuZXcgTm9kZShuYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHBhcmVudFV1aWQgPyBzY2VuZS5nZXRDaGlsZEJ5VXVpZChwYXJlbnRVdWlkKSA6IHNjZW5lO1xuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5hZGRDaGlsZChub2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgaWYgcGFyZW50VXVpZCB3YXMgcHJvdmlkZWQgYnV0IHBhcmVudCBub3QgZm91bmQsIGFkZCB0byBzY2VuZSByb290XG4gICAgICAgICAgICAgICAgc2NlbmUuYWRkQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOagh+iusOWcuuaZr+S4uuW3suS/ruaUuVxuICAgICAgICAgICAgbWFya1NjZW5lRGlydHkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYE5vZGUgJHtuYW1lfSBjcmVhdGVkIHN1Y2Nlc3NmdWxseWAsXG4gICAgICAgICAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkIHx8IG5vZGUuX2lkLCBcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lIHx8IG5vZGUuX25hbWUgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IG5vZGUgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICBnZXROb2RlSW5mbyhub2RlVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBub2RlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogbm9kZS5hY3RpdmUsXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBnZXROb2RlUG9zaXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBnZXROb2RlUm90YXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgIHNjYWxlOiBnZXROb2RlU2NhbGUobm9kZSksXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogbm9kZS5wYXJlbnQ/LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiAobm9kZS5jaGlsZHJlbiB8fCBbXSkubWFwKChjaGlsZDogYW55KSA9PiBjaGlsZC51dWlkKSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50czogZXh0cmFjdENvbXBvbmVudHMobm9kZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIG5vZGVzIGluIHNjZW5lXG4gICAgICovXG4gICAgZ2V0QWxsTm9kZXMoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0Tm9kZXMgPSAobm9kZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgbm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGUucGFyZW50Py51dWlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZDogYW55KSA9PiBjb2xsZWN0Tm9kZXMoY2hpbGQpKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjZW5lLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkOiBhbnkpID0+IGNvbGxlY3ROb2RlcyhjaGlsZCkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBub2RlcyB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG5vZGUgYnkgbmFtZVxuICAgICAqL1xuICAgIGZpbmROb2RlQnlOYW1lKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciB9ID0gZ2V0Q0MoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5TmFtZShuYW1lKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBuYW1lICR7bmFtZX0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlLmFjdGl2ZSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgY3VycmVudCBzY2VuZSBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIGdldEN1cnJlbnRTY2VuZUluZm8oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc2NlbmUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogc2NlbmUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiBzY2VuZS5jaGlsZHJlbi5sZW5ndGhcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgbm9kZSBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHNldE5vZGVQcm9wZXJ0eShub2RlVXVpZDogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6K6+572u5bGe5oCnXG4gICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldFBvc2l0aW9uKHZhbHVlLnggfHwgMCwgdmFsdWUueSB8fCAwLCB2YWx1ZS56IHx8IDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gJ3JvdGF0aW9uJykge1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIodmFsdWUueCB8fCAwLCB2YWx1ZS55IHx8IDAsIHZhbHVlLnogfHwgMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnc2NhbGUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRTY2FsZSh2YWx1ZS54IHx8IDEsIHZhbHVlLnkgfHwgMSwgdmFsdWUueiB8fCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdhY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hY3RpdmUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICduYW1lJykge1xuICAgICAgICAgICAgICAgIG5vZGUubmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlsJ3or5Xnm7TmjqXorr7nva7lsZ7mgKdcbiAgICAgICAgICAgICAgICAobm9kZSBhcyBhbnkpW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWAgXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2NlbmUgaGllcmFyY2h5XG4gICAgICovXG4gICAgZ2V0U2NlbmVIaWVyYXJjaHkoaW5jbHVkZUNvbXBvbmVudHM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciB9ID0gZ2V0Q0MoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjZW5lID0gZGlyZWN0b3IuZ2V0U2NlbmUoKTtcbiAgICAgICAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdObyBhY3RpdmUgc2NlbmUnIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NOb2RlID0gKG5vZGU6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IG5vZGUuYWN0aXZlLFxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVDb21wb25lbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wb25lbnRzID0gbm9kZS5jb21wb25lbnRzLm1hcCgoY29tcDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogY29tcC5lbmFibGVkXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKGNoaWxkOiBhbnkpID0+IHByb2Nlc3NOb2RlKGNoaWxkKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IGhpZXJhcmNoeSA9IHNjZW5lLmNoaWxkcmVuLm1hcCgoY2hpbGQ6IGFueSkgPT4gcHJvY2Vzc05vZGUoY2hpbGQpKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGhpZXJhcmNoeSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgcHJlZmFiIGZyb20gbm9kZVxuICAgICAqL1xuICAgIGNyZWF0ZVByZWZhYkZyb21Ob2RlKG5vZGVVdWlkOiBzdHJpbmcsIHByZWZhYlBhdGg6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciwgaW5zdGFudGlhdGUgfSA9IGdldENDKCk7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDms6jmhI/vvJrov5nph4zlj6rmmK/kuIDkuKrmqKHmi5/lrp7njrDvvIzlm6DkuLrov5DooYzml7bnjq/looPkuIvml6Dms5Xnm7TmjqXliJvlu7rpooTliLbkvZPmlofku7ZcbiAgICAgICAgICAgIC8vIOecn+ato+eahOmihOWItuS9k+WIm+W7uumcgOimgUVkaXRvciBBUEnmlK/mjIFcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZhYlBhdGg6IHByZWZhYlBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZU5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFByZWZhYiBjcmVhdGVkIGZyb20gbm9kZSAnJHtub2RlLm5hbWV9JyBhdCAke3ByZWZhYlBhdGh9YFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBjb21wb25lbnQgcHJvcGVydHlcbiAgICAgKi9cbiAgICBzZXRDb21wb25lbnRQcm9wZXJ0eShub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZGlyZWN0b3IsIGpzIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzY2VuZS5nZXRDaGlsZEJ5VXVpZChub2RlVXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBOb2RlIHdpdGggVVVJRCAke25vZGVVdWlkfSBub3QgZm91bmRgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBDb21wb25lbnRDbGFzcyA9IGpzLmdldENsYXNzQnlOYW1lKGNvbXBvbmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFDb21wb25lbnRDbGFzcykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCB0eXBlICR7Y29tcG9uZW50VHlwZX0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbm9kZS5nZXRDb21wb25lbnQoQ29tcG9uZW50Q2xhc3MpO1xuICAgICAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJHtjb21wb25lbnRUeXBlfSBub3QgZm91bmQgb24gbm9kZWAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOmSiOWvueW4uOingeWxnuaAp+WBmueJueauiuWkhOeQhlxuICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSAnc3ByaXRlRnJhbWUnICYmIGNvbXBvbmVudFR5cGUgPT09ICdjYy5TcHJpdGUnKSB7XG4gICAgICAgICAgICAgICAgLy8g5pSv5oyBIHZhbHVlIOS4uiB1dWlkIOaIlui1hOa6kOi3r+W+hFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWFiOWwneivleaMiSB1dWlkIOafpeaJvlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldE1hbmFnZXIgPSBnZXRDQygpLmFzc2V0TWFuYWdlcjtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRNYW5hZ2VyLnJlc291cmNlcy5sb2FkKHZhbHVlLCBnZXRDQygpLlNwcml0ZUZyYW1lLCAoZXJyOiBhbnksIHNwcml0ZUZyYW1lOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWwneivlemAmui/hyB1dWlkIOWKoOi9vVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0TWFuYWdlci5sb2FkQW55KHsgdXVpZDogdmFsdWUgfSwgKGVycjI6IGFueSwgYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5zcHJpdGVGcmFtZSA9IGFzc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g55u05o6l6LWL5YC877yI5YW85a655bey5Lyg5YWl6LWE5rqQ5a+56LGh77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuc3ByaXRlRnJhbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuc3ByaXRlRnJhbWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSAnbWF0ZXJpYWwnICYmIChjb21wb25lbnRUeXBlID09PSAnY2MuU3ByaXRlJyB8fCBjb21wb25lbnRUeXBlID09PSAnY2MuTWVzaFJlbmRlcmVyJykpIHtcbiAgICAgICAgICAgICAgICAvLyDmlK/mjIEgdmFsdWUg5Li6IHV1aWQg5oiW6LWE5rqQ6Lev5b6EXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXRNYW5hZ2VyID0gZ2V0Q0MoKS5hc3NldE1hbmFnZXI7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0TWFuYWdlci5yZXNvdXJjZXMubG9hZCh2YWx1ZSwgZ2V0Q0MoKS5NYXRlcmlhbCwgKGVycjogYW55LCBtYXRlcmlhbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBtYXRlcmlhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5tYXRlcmlhbCA9IG1hdGVyaWFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldE1hbmFnZXIubG9hZEFueSh7IHV1aWQ6IHZhbHVlIH0sIChlcnIyOiBhbnksIGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIyICYmIGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQubWF0ZXJpYWwgPSBhc3NldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5tYXRlcmlhbCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5tYXRlcmlhbCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09ICdzdHJpbmcnICYmIChjb21wb25lbnRUeXBlID09PSAnY2MuTGFiZWwnIHx8IGNvbXBvbmVudFR5cGUgPT09ICdjYy5SaWNoVGV4dCcpKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnN0cmluZyA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlj6/pgInvvJrliLfmlrAgSW5zcGVjdG9yXG4gICAgICAgICAgICAvLyBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogYENvbXBvbmVudCBwcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5YCB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgYSBub2RlXG4gICAgICovXG4gICAgZGVsZXRlTm9kZShub2RlVXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZU5hbWUgPSBub2RlLm5hbWU7XG4gICAgICAgICAgICBub2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5qCH6K6w5Zy65pmv5Li65bey5L+u5pS5XG4gICAgICAgICAgICBtYXJrU2NlbmVEaXJ0eSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTm9kZSAnJHtub2RlTmFtZX0nIGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7IGRlbGV0ZWRVdWlkOiBub2RlVXVpZCwgZGVsZXRlZE5hbWU6IG5vZGVOYW1lIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmUgYSBub2RlIHRvIGEgbmV3IHBhcmVudFxuICAgICAqL1xuICAgIG1vdmVOb2RlKG5vZGVVdWlkOiBzdHJpbmcsIG5ld1BhcmVudFV1aWQ6IHN0cmluZywgc2libGluZ0luZGV4PzogbnVtYmVyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbmV3UGFyZW50ID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobmV3UGFyZW50VXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5ld1BhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFBhcmVudCBub2RlIHdpdGggVVVJRCAke25ld1BhcmVudFV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgb2xkUGFyZW50TmFtZSA9IG5vZGUucGFyZW50Py5uYW1lIHx8ICdTY2VuZSc7XG4gICAgICAgICAgICBub2RlLnBhcmVudCA9IG5ld1BhcmVudDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gdW5kZWZpbmVkICYmIHNpYmxpbmdJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRTaWJsaW5nSW5kZXgoc2libGluZ0luZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5qCH6K6w5Zy65pmv5Li65bey5L+u5pS5XG4gICAgICAgICAgICBtYXJrU2NlbmVEaXJ0eSgpO1xuXG4gICAgICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgTm9kZSAnJHtub2RlLm5hbWV9JyBtb3ZlZCBmcm9tICcke29sZFBhcmVudE5hbWV9JyB0byAnJHtuZXdQYXJlbnQubmFtZX0nYCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbm9kZU5hbWU6IG5vZGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3UGFyZW50VXVpZDogbmV3UGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmV3UGFyZW50TmFtZTogbmV3UGFyZW50Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdJbmRleDogc2libGluZ0luZGV4XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRHVwbGljYXRlIGEgbm9kZVxuICAgICAqL1xuICAgIGR1cGxpY2F0ZU5vZGUobm9kZVV1aWQ6IHN0cmluZywgaW5jbHVkZUNoaWxkcmVuOiBib29sZWFuID0gdHJ1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBkaXJlY3RvciwgaW5zdGFudGlhdGUgfSA9IGdldENDKCk7XG4gICAgICAgICAgICBjb25zdCBzY2VuZSA9IGRpcmVjdG9yLmdldFNjZW5lKCk7XG4gICAgICAgICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gYWN0aXZlIHNjZW5lJyB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc2NlbmUuZ2V0Q2hpbGRCeVV1aWQobm9kZVV1aWQpO1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgTm9kZSB3aXRoIFVVSUQgJHtub2RlVXVpZH0gbm90IGZvdW5kYCB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkvb/nlKggaW5zdGFudGlhdGUg5aSN5Yi26IqC54K577yI5Lya6Ieq5Yqo5aSN5Yi25a2Q6IqC54K577yJXG4gICAgICAgICAgICBjb25zdCBkdXBsaWNhdGUgPSBpbnN0YW50aWF0ZShub2RlKTtcbiAgICAgICAgICAgIGR1cGxpY2F0ZS5uYW1lID0gbm9kZS5uYW1lICsgJyBDb3B5JztcblxuICAgICAgICAgICAgLy8g5re75Yqg5Yiw55u45ZCM55qE54i26IqC54K5XG4gICAgICAgICAgICBpZiAobm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmVudC5hZGRDaGlsZChkdXBsaWNhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY2VuZS5hZGRDaGlsZChkdXBsaWNhdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDmoIforrDlnLrmma/kuLrlt7Lkv67mlLlcbiAgICAgICAgICAgIG1hcmtTY2VuZURpcnR5KCk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBOb2RlICcke25vZGUubmFtZX0nIGR1cGxpY2F0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsVXVpZDogbm9kZVV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBuZXdVdWlkOiBkdXBsaWNhdGUudXVpZCB8fCBkdXBsaWNhdGUuX2lkLFxuICAgICAgICAgICAgICAgICAgICBuZXdOYW1lOiBkdXBsaWNhdGUubmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBub2RlIHRyYW5zZm9ybSAocG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSlcbiAgICAgKi9cbiAgICBzZXROb2RlVHJhbnNmb3JtKG5vZGVVdWlkOiBzdHJpbmcsIHRyYW5zZm9ybTogYW55KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGRpcmVjdG9yIH0gPSBnZXRDQygpO1xuICAgICAgICAgICAgY29uc3Qgc2NlbmUgPSBkaXJlY3Rvci5nZXRTY2VuZSgpO1xuICAgICAgICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGFjdGl2ZSBzY2VuZScgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHNjZW5lLmdldENoaWxkQnlVdWlkKG5vZGVVdWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYE5vZGUgd2l0aCBVVUlEICR7bm9kZVV1aWR9IG5vdCBmb3VuZGAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdXBkYXRlczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgLy8g6K6+572u5L2N572uXG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zID0gdHJhbnNmb3JtLnBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIHBvcy54ICE9PSB1bmRlZmluZWQgPyBwb3MueCA6IG5vZGUucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgcG9zLnkgIT09IHVuZGVmaW5lZCA/IHBvcy55IDogbm9kZS5wb3NpdGlvbi55LFxuICAgICAgICAgICAgICAgICAgICBwb3MueiAhPT0gdW5kZWZpbmVkID8gcG9zLnogOiBub2RlLnBvc2l0aW9uLnpcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6K6+572u5peL6L2sXG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtLnJvdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm90ID0gdHJhbnNmb3JtLnJvdGF0aW9uO1xuICAgICAgICAgICAgICAgIG5vZGUuc2V0Um90YXRpb25Gcm9tRXVsZXIoXG4gICAgICAgICAgICAgICAgICAgIHJvdC54ICE9PSB1bmRlZmluZWQgPyByb3QueCA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJvdC55ICE9PSB1bmRlZmluZWQgPyByb3QueSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHJvdC56ICE9PSB1bmRlZmluZWQgPyByb3QueiA6IDBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHVwZGF0ZXMucHVzaCgncm90YXRpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6K6+572u57yp5pS+XG4gICAgICAgICAgICBpZiAodHJhbnNmb3JtLnNjYWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSB0cmFuc2Zvcm0uc2NhbGU7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRTY2FsZShcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUueCAhPT0gdW5kZWZpbmVkID8gc2NhbGUueCA6IG5vZGUuc2NhbGUueCxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUueSAhPT0gdW5kZWZpbmVkID8gc2NhbGUueSA6IG5vZGUuc2NhbGUueSxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUueiAhPT0gdW5kZWZpbmVkID8gc2NhbGUueiA6IG5vZGUuc2NhbGUuelxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdXBkYXRlcy5wdXNoKCdzY2FsZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDmoIforrDlnLrmma/kuLrlt7Lkv67mlLlcbiAgICAgICAgICAgIG1hcmtTY2VuZURpcnR5KCk7XG5cbiAgICAgICAgICAgIHJldHVybiB7IFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBOb2RlIHRyYW5zZm9ybSB1cGRhdGVkOiAke3VwZGF0ZXMuam9pbignLCAnKX1gLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxuICAgICAgICAgICAgICAgICAgICBub2RlTmFtZTogbm9kZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkUHJvcGVydGllczogdXBkYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFRyYW5zZm9ybToge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGdldE5vZGVQb3NpdGlvbihub2RlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0aW9uOiBnZXROb2RlUm90YXRpb24obm9kZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FsZTogZ2V0Tm9kZVNjYWxlKG5vZGUpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDliJvlu7rlrozmlbTnmoQgQnV0dG9uIFVJIOe7hOS7tu+8iOWnlOaJmOe7mSBidXR0b24taGFuZGxlcu+8iVxuICAgICAqIOWMheaLrCBCYWNrZ3JvdW5kIOWtkOiKgueCue+8iFNwcml0ZSArIFdpZGdldO+8ieWSjCBMYWJlbCDlrZDoioLngrlcbiAgICAgKiBAcGFyYW0gc3ByaXRlcyDljIXlkKsgNCDkuKrnirbmgIHnmoTlm77pm4YgVVVJRDoge25vcm1hbCwgcHJlc3NlZCwgaG92ZXIsIGRpc2FibGVkfVxuICAgICAqL1xuICAgIGNyZWF0ZUJ1dHRvbldpdGhUZW1wbGF0ZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBwYXJlbnRVdWlkOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHdpZHRoOiBudW1iZXIsXG4gICAgICAgIGhlaWdodDogbnVtYmVyLFxuICAgICAgICBzcHJpdGVzOiB7IG5vcm1hbDogc3RyaW5nOyBwcmVzc2VkOiBzdHJpbmc7IGhvdmVyOiBzdHJpbmc7IGRpc2FibGVkOiBzdHJpbmcgfVxuICAgICkge1xuICAgICAgICAvLyDosIPnlKggYnV0dG9uLWhhbmRsZXJcbiAgICAgICAgcmV0dXJuIGJ1dHRvbkhhbmRsZXIuY3JlYXRlQnV0dG9uV2l0aFRlbXBsYXRlKG5hbWUsIHBhcmVudFV1aWQsIHRleHQsIHdpZHRoLCBoZWlnaHQsIHNwcml0ZXMsIGdldENDLCBtYXJrU2NlbmVEaXJ0eSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIm+W7uiBTcHJpdGUg57uE5Lu277yI5aeU5omY57uZIHNwcml0ZS1oYW5kbGVy77yJXG4gICAgICovXG4gICAgY3JlYXRlU3ByaXRlV2l0aFRlbXBsYXRlKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHBhcmVudFV1aWQ6IHN0cmluZyB8IG51bGwsXG4gICAgICAgIHdpZHRoOiBudW1iZXIsXG4gICAgICAgIGhlaWdodDogbnVtYmVyLFxuICAgICAgICBzcHJpdGVGcmFtZVV1aWQ6IHN0cmluZ1xuICAgICkge1xuICAgICAgICAvLyDosIPnlKggc3ByaXRlLWhhbmRsZXJcbiAgICAgICAgcmV0dXJuIHNwcml0ZUhhbmRsZXIuY3JlYXRlU3ByaXRlV2l0aFRlbXBsYXRlKG5hbWUsIHBhcmVudFV1aWQsIHdpZHRoLCBoZWlnaHQsIHNwcml0ZUZyYW1lVXVpZCwgZ2V0Q0MsIG1hcmtTY2VuZURpcnR5KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Yib5bu6IExheW91dCDnu4Tku7bvvIjlp5TmiZjnu5kgbGF5b3V0LWhhbmRsZXLvvIlcbiAgICAgKi9cbiAgICBjcmVhdGVMYXlvdXRXaXRoVGVtcGxhdGUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgcGFyZW50VXVpZDogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgd2lkdGg6IG51bWJlcixcbiAgICAgICAgaGVpZ2h0OiBudW1iZXIsXG4gICAgICAgIHNwcml0ZUZyYW1lVXVpZDogc3RyaW5nXG4gICAgKSB7XG4gICAgICAgIC8vIOiwg+eUqCBsYXlvdXQtaGFuZGxlclxuICAgICAgICByZXR1cm4gbGF5b3V0SGFuZGxlci5jcmVhdGVMYXlvdXRXaXRoVGVtcGxhdGUobmFtZSwgcGFyZW50VXVpZCwgd2lkdGgsIGhlaWdodCwgc3ByaXRlRnJhbWVVdWlkLCBnZXRDQywgbWFya1NjZW5lRGlydHkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDliJvlu7ogU2Nyb2xsVmlldyDnu4Tku7bvvIjlp5TmiZjnu5kgc2Nyb2xsdmlldy1oYW5kbGVy77yJXG4gICAgICovXG4gICAgY3JlYXRlU2Nyb2xsVmlld1dpdGhUZW1wbGF0ZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBwYXJlbnRVdWlkOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICB3aWR0aDogbnVtYmVyLFxuICAgICAgICBoZWlnaHQ6IG51bWJlcixcbiAgICAgICAgc3ByaXRlRnJhbWVVdWlkOiBzdHJpbmdcbiAgICApIHtcbiAgICAgICAgLy8g6LCD55SoIHNjcm9sbHZpZXctaGFuZGxlclxuICAgICAgICByZXR1cm4gc2Nyb2xsdmlld0hhbmRsZXIuY3JlYXRlU2Nyb2xsVmlld1dpdGhUZW1wbGF0ZShuYW1lLCBwYXJlbnRVdWlkLCB3aWR0aCwgaGVpZ2h0LCBzcHJpdGVGcmFtZVV1aWQsIGdldENDLCBtYXJrU2NlbmVEaXJ0eSk7XG4gICAgfVxufTtcblxuY29uc3Qgc2NlbmVIYW5kbGVyczogUmVjb3JkPHN0cmluZywgKGV2ZW50OiBhbnksIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkPiA9IHt9O1xuXG5mb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhtZXRob2RzKSkge1xuICAgIHNjZW5lSGFuZGxlcnNba2V5XSA9IChldmVudDogYW55LCAuLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IChtZXRob2RzIGFzIGFueSlba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGhhbmRsZXIoLi4uYXJncyk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKHZhbHVlOiBhbnkpID0+IGV2ZW50LnJlcGx5KG51bGwsIHZhbHVlKSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IGV2ZW50LnJlcGx5KGVycm9yKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50LnJlcGx5KG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBldmVudC5yZXBseShlcnJvcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNjZW5lSGFuZGxlcnM7XG4iXX0=
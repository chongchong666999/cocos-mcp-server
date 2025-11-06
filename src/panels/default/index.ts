import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { ensureEditorAdapters } from '../../utils/editor-adapter';

declare const window: any;

function createDefaultSettings() {
    return {
        port: 3000,
        autoStart: false,
        debugLog: false,
        maxConnections: 10
    };
}

module.exports = Editor.Panel.extend({
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle'
    },
    ready() {
        ensureEditorAdapters();

        const template = readFileSync(join(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8');
        const rootElement = (this as any).$app as HTMLElement | undefined;

        if (!rootElement) {
            console.error('[MCP 面板] 未找到面板根节点 #app');
            return;
        }

        const vm = new window.Vue({
            el: rootElement,
            template,
            data: {
                activeTab: 'server',
                serverRunning: false,
                serverStatusText: '已停止',
                connectedClients: 0,
                httpUrl: '',
                isProcessing: false,
                settingsChanged: false,
                settings: createDefaultSettings(),
                availableTools: [] as any[],
                toolCategories: [] as string[],
                statusTimer: null as any,
                _suspendSettingsWatch: false
            },
            computed: {
                statusClass(): string {
                    const vm = this as any;
                    return vm.serverRunning ? 'running' : 'stopped';
                },
                totalTools(): number {
                    const vm = this as any;
                    return vm.availableTools.length;
                },
                enabledTools(): number {
                    const vm = this as any;
                    return vm.availableTools.filter((tool: any) => tool.enabled).length;
                },
                disabledTools(): number {
                    const vm = this as any;
                    return vm.totalTools - vm.enabledTools;
                }
            },
            methods: {
                switchTab(tabName: string) {
                    const vm = this as any;
                    vm.activeTab = tabName;
                    if (tabName === 'tools') {
                        vm.loadToolManagerState();
                    }
                },
                async loadToolManagerState() {
                    try {
                        const vm = this as any;
                        const result = await Editor.Message.request('cocos-mcp-server', 'get-tool-manager-state');
                        if (result && result.success !== false) {
                            vm.availableTools = result.availableTools || [];
                            const categories = new Set<string>();
                            vm.availableTools.forEach((tool: any) => categories.add(tool.category));
                            vm.toolCategories = Array.from(categories);
                        }
                    } catch (error) {
                        console.error('[MCP 面板] 获取工具列表失败:', error);
                    }
                },
                async toggleServer() {
                    try {
                        const vm = this as any;
                        vm.isProcessing = true;
                        if (vm.serverRunning) {
                            await Editor.Message.request('cocos-mcp-server', 'stop-server');
                        } else {
                            const currentSettings = {
                                port: vm.settings.port,
                                autoStart: vm.settings.autoStart,
                                enableDebugLog: vm.settings.debugLog,
                                maxConnections: vm.settings.maxConnections
                            };
                            await Editor.Message.request('cocos-mcp-server', 'update-settings', currentSettings);
                            await Editor.Message.request('cocos-mcp-server', 'start-server');
                        }
                        await vm.updateStatus();
                    } catch (error) {
                        console.error('[MCP 面板] 切换服务器状态失败:', error);
                    } finally {
                        (this as any).isProcessing = false;
                    }
                },
                async saveSettings() {
                    try {
                        const vm = this as any;
                        const settingsData = {
                            port: vm.settings.port,
                            autoStart: vm.settings.autoStart,
                            enableDebugLog: vm.settings.debugLog,
                            maxConnections: vm.settings.maxConnections
                        };
                        await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                        vm.settingsChanged = false;
                        await vm.updateStatus();
                    } catch (error) {
                        console.error('[MCP 面板] 保存设置失败:', error);
                    }
                },
                async copyUrl() {
                    try {
                        const vm = this as any;
                        await navigator.clipboard.writeText(vm.httpUrl);
                        Editor.success('[MCP 面板] 已复制服务器地址');
                    } catch (error) {
                        console.error('[MCP 面板] 复制 URL 失败:', error);
                    }
                },
                async updateToolStatus(category: string, toolName: string, enabled: boolean) {
                    const vm = this as any;
                    const index = vm.availableTools.findIndex((tool: any) => tool.category === category && tool.name === toolName);
                    if (index === -1) {
                        return;
                    }

                    const previous = vm.availableTools[index].enabled;
                    vm.$set(vm.availableTools[index], 'enabled', enabled);

                    try {
                        const result = await Editor.Message.request('cocos-mcp-server', 'update-tool-status', category, toolName, enabled);
                        if (!result || !result.success) {
                            vm.$set(vm.availableTools[index], 'enabled', previous);
                        }
                    } catch (error) {
                        console.error('[MCP 面板] 更新工具状态失败:', error);
                        vm.$set(vm.availableTools[index], 'enabled', previous);
                    }
                },
                onToolToggle(category: string, toolName: string, event: Event) {
                    const target = event && (event.target as HTMLInputElement);
                    const checked = target ? target.checked : false;
                    (this as any).updateToolStatus(category, toolName, checked);
                },
                async selectAllTools() {
                    const vm = this as any;
                    vm.availableTools.forEach((tool: any, idx: number) => {
                        vm.$set(vm.availableTools[idx], 'enabled', true);
                    });
                    await vm.saveToolChanges();
                },
                async deselectAllTools() {
                    const vm = this as any;
                    vm.availableTools.forEach((tool: any, idx: number) => {
                        vm.$set(vm.availableTools[idx], 'enabled', false);
                    });
                    await vm.saveToolChanges();
                },
                async toggleCategoryTools(category: string, enabled: boolean) {
                    const vm = this as any;
                    vm.availableTools.forEach((tool: any, idx: number) => {
                        if (tool.category === category) {
                            vm.$set(vm.availableTools[idx], 'enabled', enabled);
                        }
                    });
                    await vm.saveToolChanges();
                },
                getToolsByCategory(category: string) {
                    const vm = this as any;
                    return vm.availableTools.filter((tool: any) => tool.category === category);
                },
                getCategoryDisplayName(category: string) {
                    const displayMap: Record<string, string> = {
                        scene: '场景工具',
                        node: '节点工具',
                        component: '组件工具',
                        prefab: '预制体工具',
                        project: '项目工具',
                        debug: '调试工具',
                        preferences: '偏好设置',
                        server: '服务器工具',
                        broadcast: '广播工具',
                        sceneAdvanced: '场景高级工具',
                        sceneView: '场景视图工具',
                        referenceImage: '参考图片工具',
                        assetAdvanced: '资源高级工具',
                        validation: '校验工具'
                    };
                    return displayMap[category] || category;
                },
                async saveToolChanges() {
                    try {
                        const vm = this as any;
                        const updates = vm.availableTools.map((tool: any) => ({
                            category: String(tool.category),
                            name: String(tool.name),
                            enabled: Boolean(tool.enabled)
                        }));
                        await Editor.Message.request('cocos-mcp-server', 'update-tool-status-batch', updates);
                    } catch (error) {
                        console.error('[MCP 面板] 保存工具配置失败:', error);
                        await (this as any).loadToolManagerState();
                    }
                },
                async updateStatus() {
                    try {
                        const vm = this as any;
                        const result = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                        if (result) {
                            vm.serverRunning = !!result.running;
                            vm.serverStatusText = result.running ? '运行中' : '已停止';
                            vm.connectedClients = result.clients || 0;
                            vm.httpUrl = result.running ? `http://127.0.0.1:${result.port}` : '';

                            if (result.settings) {
                                vm._suspendSettingsWatch = true;
                                vm.settings.port = result.settings.port || 3000;
                                vm.settings.autoStart = !!result.settings.autoStart;
                                vm.settings.debugLog = !!result.settings.enableDebugLog;
                                vm.settings.maxConnections = result.settings.maxConnections || 10;
                                vm._suspendSettingsWatch = false;
                                vm.settingsChanged = false;
                            }
                        }
                    } catch (error) {
                        console.error('[MCP 面板] 获取服务器状态失败:', error);
                    } finally {
                        const vm = this as any;
                        vm._suspendSettingsWatch = false;
                    }
                },
                startStatusTimer() {
                    const vm = this as any;
                    vm.clearStatusTimer();
                    vm.statusTimer = setInterval(() => {
                        vm.updateStatus();
                    }, 2000);
                },
                clearStatusTimer() {
                    const vm = this as any;
                    if (vm.statusTimer) {
                        clearInterval(vm.statusTimer);
                        vm.statusTimer = null;
                    }
                }
            },
            watch: {
                settings: {
                    handler() {
                        const vm = this as any;
                        if (vm._suspendSettingsWatch) {
                            return;
                        }
                        vm.settingsChanged = true;
                    },
                    deep: true
                }
            },
            async created() {
                const vm = this as any;
                await vm.loadToolManagerState();
                await vm.updateStatus();
                vm.startStatusTimer();
            },
            beforeDestroy() {
                (this as any).clearStatusTimer();
            }
        });

        (this as any)._vm = vm;
    },
    close() {
        const vm = (this as any)._vm;
        if (vm) {
            vm.clearStatusTimer();
            vm.$destroy();
            (this as any)._vm = null;
        }
    }
});

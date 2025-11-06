"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const editor_adapter_1 = require("../../utils/editor-adapter");
function createDefaultSettings() {
    return {
        port: 3000,
        autoStart: false,
        debugLog: false,
        maxConnections: 10
    };
}
module.exports = Editor.Panel.extend({
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle'
    },
    ready() {
        (0, editor_adapter_1.ensureEditorAdapters)();
        const template = (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/vue/mcp-server-app.html'), 'utf-8');
        const rootElement = this.$app;
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
                availableTools: [],
                toolCategories: [],
                statusTimer: null,
                _suspendSettingsWatch: false
            },
            computed: {
                statusClass() {
                    const vm = this;
                    return vm.serverRunning ? 'running' : 'stopped';
                },
                totalTools() {
                    const vm = this;
                    return vm.availableTools.length;
                },
                enabledTools() {
                    const vm = this;
                    return vm.availableTools.filter((tool) => tool.enabled).length;
                },
                disabledTools() {
                    const vm = this;
                    return vm.totalTools - vm.enabledTools;
                }
            },
            methods: {
                switchTab(tabName) {
                    const vm = this;
                    vm.activeTab = tabName;
                    if (tabName === 'tools') {
                        vm.loadToolManagerState();
                    }
                },
                async loadToolManagerState() {
                    try {
                        const vm = this;
                        const result = await Editor.Message.request('cocos-mcp-server', 'get-tool-manager-state');
                        if (result && result.success !== false) {
                            vm.availableTools = result.availableTools || [];
                            const categories = new Set();
                            vm.availableTools.forEach((tool) => categories.add(tool.category));
                            vm.toolCategories = Array.from(categories);
                        }
                    }
                    catch (error) {
                        console.error('[MCP 面板] 获取工具列表失败:', error);
                    }
                },
                async toggleServer() {
                    try {
                        const vm = this;
                        vm.isProcessing = true;
                        if (vm.serverRunning) {
                            await Editor.Message.request('cocos-mcp-server', 'stop-server');
                        }
                        else {
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
                    }
                    catch (error) {
                        console.error('[MCP 面板] 切换服务器状态失败:', error);
                    }
                    finally {
                        this.isProcessing = false;
                    }
                },
                async saveSettings() {
                    try {
                        const vm = this;
                        const settingsData = {
                            port: vm.settings.port,
                            autoStart: vm.settings.autoStart,
                            enableDebugLog: vm.settings.debugLog,
                            maxConnections: vm.settings.maxConnections
                        };
                        await Editor.Message.request('cocos-mcp-server', 'update-settings', settingsData);
                        vm.settingsChanged = false;
                        await vm.updateStatus();
                    }
                    catch (error) {
                        console.error('[MCP 面板] 保存设置失败:', error);
                    }
                },
                async copyUrl() {
                    try {
                        const vm = this;
                        await navigator.clipboard.writeText(vm.httpUrl);
                        Editor.success('[MCP 面板] 已复制服务器地址');
                    }
                    catch (error) {
                        console.error('[MCP 面板] 复制 URL 失败:', error);
                    }
                },
                async updateToolStatus(category, toolName, enabled) {
                    const vm = this;
                    const index = vm.availableTools.findIndex((tool) => tool.category === category && tool.name === toolName);
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
                    }
                    catch (error) {
                        console.error('[MCP 面板] 更新工具状态失败:', error);
                        vm.$set(vm.availableTools[index], 'enabled', previous);
                    }
                },
                onToolToggle(category, toolName, event) {
                    const target = event && event.target;
                    const checked = target ? target.checked : false;
                    this.updateToolStatus(category, toolName, checked);
                },
                async selectAllTools() {
                    const vm = this;
                    vm.availableTools.forEach((tool, idx) => {
                        vm.$set(vm.availableTools[idx], 'enabled', true);
                    });
                    await vm.saveToolChanges();
                },
                async deselectAllTools() {
                    const vm = this;
                    vm.availableTools.forEach((tool, idx) => {
                        vm.$set(vm.availableTools[idx], 'enabled', false);
                    });
                    await vm.saveToolChanges();
                },
                async toggleCategoryTools(category, enabled) {
                    const vm = this;
                    vm.availableTools.forEach((tool, idx) => {
                        if (tool.category === category) {
                            vm.$set(vm.availableTools[idx], 'enabled', enabled);
                        }
                    });
                    await vm.saveToolChanges();
                },
                getToolsByCategory(category) {
                    const vm = this;
                    return vm.availableTools.filter((tool) => tool.category === category);
                },
                getCategoryDisplayName(category) {
                    const displayMap = {
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
                        const vm = this;
                        const updates = vm.availableTools.map((tool) => ({
                            category: String(tool.category),
                            name: String(tool.name),
                            enabled: Boolean(tool.enabled)
                        }));
                        await Editor.Message.request('cocos-mcp-server', 'update-tool-status-batch', updates);
                    }
                    catch (error) {
                        console.error('[MCP 面板] 保存工具配置失败:', error);
                        await this.loadToolManagerState();
                    }
                },
                async updateStatus() {
                    try {
                        const vm = this;
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
                    }
                    catch (error) {
                        console.error('[MCP 面板] 获取服务器状态失败:', error);
                    }
                    finally {
                        const vm = this;
                        vm._suspendSettingsWatch = false;
                    }
                },
                startStatusTimer() {
                    const vm = this;
                    vm.clearStatusTimer();
                    vm.statusTimer = setInterval(() => {
                        vm.updateStatus();
                    }, 2000);
                },
                clearStatusTimer() {
                    const vm = this;
                    if (vm.statusTimer) {
                        clearInterval(vm.statusTimer);
                        vm.statusTimer = null;
                    }
                }
            },
            watch: {
                settings: {
                    handler() {
                        const vm = this;
                        if (vm._suspendSettingsWatch) {
                            return;
                        }
                        vm.settingsChanged = true;
                    },
                    deep: true
                }
            },
            async created() {
                const vm = this;
                await vm.loadToolManagerState();
                await vm.updateStatus();
                vm.startStatusTimer();
            },
            beforeDestroy() {
                this.clearStatusTimer();
            }
        });
        this._vm = vm;
    },
    close() {
        const vm = this._vm;
        if (vm) {
            vm.clearStatusTimer();
            vm.$destroy();
            this._vm = null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBQzVCLCtEQUFrRTtBQUlsRSxTQUFTLHFCQUFxQjtJQUMxQixPQUFPO1FBQ0gsSUFBSSxFQUFFLElBQUk7UUFDVixTQUFTLEVBQUUsS0FBSztRQUNoQixRQUFRLEVBQUUsS0FBSztRQUNmLGNBQWMsRUFBRSxFQUFFO0tBQ3JCLENBQUM7QUFDTixDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxRQUFRLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSw2Q0FBNkMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUMvRixLQUFLLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUN4RixDQUFDLEVBQUU7UUFDQyxHQUFHLEVBQUUsTUFBTTtRQUNYLFVBQVUsRUFBRSxhQUFhO0tBQzVCO0lBQ0QsS0FBSztRQUNELElBQUEscUNBQW9CLEdBQUUsQ0FBQztRQUV2QixNQUFNLFFBQVEsR0FBRyxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGtEQUFrRCxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUcsTUFBTSxXQUFXLEdBQUksSUFBWSxDQUFDLElBQStCLENBQUM7UUFFbEUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3hDLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQ3RCLEVBQUUs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QUFRLEVBQUU7b0JBQ04sT0FBTzt3QkFDSCxNQUFNLEVBQUUsR0FBRyxJQUFXLENBQUM7d0JBQ3ZCLElBQUksRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7NEJBQzNCLE9BQU87d0JBQ1gsQ0FBQzt3QkFDRCxFQUFFLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztvQkFDOUIsQ0FBQztvQkFDRCxJQUFJLEVBQUUsSUFBSTtpQkFDYjthQUNKO1lBQ0QsS0FBSyxDQUFDLE9BQU87Z0JBQ1QsTUFBTSxFQUFFLEdBQUcsSUFBVyxDQUFDO2dCQUN2QixNQUFNLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsRUFBRSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUNELGFBQWE7Z0JBQ1IsSUFBWSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDckMsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVGLElBQVksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFDRCxLQUFLO1FBQ0QsTUFBTSxFQUFFLEdBQUksSUFBWSxDQUFDLEdBQUcsQ0FBQztRQUM3QixJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ0wsRUFBRSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDdEIsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2IsSUFBWSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFDN0IsQ0FBQztJQUNMLENBQUM7Q0FDSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBlbnN1cmVFZGl0b3JBZGFwdGVycyB9IGZyb20gJy4uLy4uL3V0aWxzL2VkaXRvci1hZGFwdGVyJztcblxuZGVjbGFyZSBjb25zdCB3aW5kb3c6IGFueTtcblxuZnVuY3Rpb24gY3JlYXRlRGVmYXVsdFNldHRpbmdzKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIGF1dG9TdGFydDogZmFsc2UsXG4gICAgICAgIGRlYnVnTG9nOiBmYWxzZSxcbiAgICAgICAgbWF4Q29ubmVjdGlvbnM6IDEwXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL2RlZmF1bHQvaW5kZXguaHRtbCcpLCAndXRmLTgnKSxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxuICAgICQ6IHtcbiAgICAgICAgYXBwOiAnI2FwcCcsXG4gICAgICAgIHBhbmVsVGl0bGU6ICcjcGFuZWxUaXRsZSdcbiAgICB9LFxuICAgIHJlYWR5KCkge1xuICAgICAgICBlbnN1cmVFZGl0b3JBZGFwdGVycygpO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL3Z1ZS9tY3Atc2VydmVyLWFwcC5odG1sJyksICd1dGYtOCcpO1xuICAgICAgICBjb25zdCByb290RWxlbWVudCA9ICh0aGlzIGFzIGFueSkuJGFwcCBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoIXJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIOmdouadv10g5pyq5om+5Yiw6Z2i5p2/5qC56IqC54K5ICNhcHAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZtID0gbmV3IHdpbmRvdy5WdWUoe1xuICAgICAgICAgICAgZWw6IHJvb3RFbGVtZW50LFxuICAgICAgICAgICAgdGVtcGxhdGUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiOiAnc2VydmVyJyxcbiAgICAgICAgICAgICAgICBzZXJ2ZXJSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzZXJ2ZXJTdGF0dXNUZXh0OiAn5bey5YGc5q2iJyxcbiAgICAgICAgICAgICAgICBjb25uZWN0ZWRDbGllbnRzOiAwLFxuICAgICAgICAgICAgICAgIGh0dHBVcmw6ICcnLFxuICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgc2V0dGluZ3NDaGFuZ2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzZXR0aW5nczogY3JlYXRlRGVmYXVsdFNldHRpbmdzKCksXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHM6IFtdIGFzIGFueVtdLFxuICAgICAgICAgICAgICAgIHRvb2xDYXRlZ29yaWVzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICBzdGF0dXNUaW1lcjogbnVsbCBhcyBhbnksXG4gICAgICAgICAgICAgICAgX3N1c3BlbmRTZXR0aW5nc1dhdGNoOiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ2xhc3MoKTogc3RyaW5nIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZtLnNlcnZlclJ1bm5pbmcgPyAncnVubmluZycgOiAnc3RvcHBlZCc7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0b3RhbFRvb2xzKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2bS5hdmFpbGFibGVUb29scy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbmFibGVkVG9vbHMoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZtLmF2YWlsYWJsZVRvb2xzLmZpbHRlcigodG9vbDogYW55KSA9PiB0b29sLmVuYWJsZWQpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRpc2FibGVkVG9vbHMoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZtLnRvdGFsVG9vbHMgLSB2bS5lbmFibGVkVG9vbHM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICBzd2l0Y2hUYWIodGFiTmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHZtLmFjdGl2ZVRhYiA9IHRhYk5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWJOYW1lID09PSAndG9vbHMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhc3luYyBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC10b29sLW1hbmFnZXItc3RhdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnN1Y2Nlc3MgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uYXZhaWxhYmxlVG9vbHMgPSByZXN1bHQuYXZhaWxhYmxlVG9vbHMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcmllcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZtLmF2YWlsYWJsZVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4gY2F0ZWdvcmllcy5hZGQodG9vbC5jYXRlZ29yeSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZtLnRvb2xDYXRlZ29yaWVzID0gQXJyYXkuZnJvbShjYXRlZ29yaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1Ag6Z2i5p2/XSDojrflj5blt6XlhbfliJfooajlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhc3luYyB0b2dnbGVTZXJ2ZXIoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2bSA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uaXNQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2bS5zZXJ2ZXJSdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9wLXNlcnZlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHZtLnNldHRpbmdzLnBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogdm0uc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogdm0uc2V0dGluZ3MuZGVidWdMb2csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiB2bS5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBjdXJyZW50U2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RhcnQtc2VydmVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB2bS51cGRhdGVTdGF0dXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1Ag6Z2i5p2/XSDliIfmjaLmnI3liqHlmajnirbmgIHlpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMgYXMgYW55KS5pc1Byb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiB2bS5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogdm0uc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURlYnVnTG9nOiB2bS5zZXR0aW5ncy5kZWJ1Z0xvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogdm0uc2V0dGluZ3MubWF4Q29ubmVjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIHNldHRpbmdzRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5zZXR0aW5nc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLnVwZGF0ZVN0YXR1cygpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCDpnaLmnb9dIOS/neWtmOiuvue9ruWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFzeW5jIGNvcHlVcmwoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2bSA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodm0uaHR0cFVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3Iuc3VjY2VzcygnW01DUCDpnaLmnb9dIOW3suWkjeWItuacjeWKoeWZqOWcsOWdgCcpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCDpnaLmnb9dIOWkjeWItiBVUkwg5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdm0uYXZhaWxhYmxlVG9vbHMuZmluZEluZGV4KCh0b29sOiBhbnkpID0+IHRvb2wuY2F0ZWdvcnkgPT09IGNhdGVnb3J5ICYmIHRvb2wubmFtZSA9PT0gdG9vbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmV2aW91cyA9IHZtLmF2YWlsYWJsZVRvb2xzW2luZGV4XS5lbmFibGVkO1xuICAgICAgICAgICAgICAgICAgICB2bS4kc2V0KHZtLmF2YWlsYWJsZVRvb2xzW2luZGV4XSwgJ2VuYWJsZWQnLCBlbmFibGVkKTtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMnLCBjYXRlZ29yeSwgdG9vbE5hbWUsIGVuYWJsZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uJHNldCh2bS5hdmFpbGFibGVUb29sc1tpbmRleF0sICdlbmFibGVkJywgcHJldmlvdXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCDpnaLmnb9dIOabtOaWsOW3peWFt+eKtuaAgeWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS4kc2V0KHZtLmF2YWlsYWJsZVRvb2xzW2luZGV4XSwgJ2VuYWJsZWQnLCBwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVG9vbFRvZ2dsZShjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBldmVudDogRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQgJiYgKGV2ZW50LnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZCA9IHRhcmdldCA/IHRhcmdldC5jaGVja2VkIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkudXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeSwgdG9vbE5hbWUsIGNoZWNrZWQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgc2VsZWN0QWxsVG9vbHMoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHZtLmF2YWlsYWJsZVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSwgaWR4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLiRzZXQodm0uYXZhaWxhYmxlVG9vbHNbaWR4XSwgJ2VuYWJsZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLnNhdmVUb29sQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgZGVzZWxlY3RBbGxUb29scygpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgdm0uYXZhaWxhYmxlVG9vbHMuZm9yRWFjaCgodG9vbDogYW55LCBpZHg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0uJHNldCh2bS5hdmFpbGFibGVUb29sc1tpZHhdLCAnZW5hYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLnNhdmVUb29sQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXN5bmMgdG9nZ2xlQ2F0ZWdvcnlUb29scyhjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIHZtLmF2YWlsYWJsZVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSwgaWR4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b29sLmNhdGVnb3J5ID09PSBjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZtLiRzZXQodm0uYXZhaWxhYmxlVG9vbHNbaWR4XSwgJ2VuYWJsZWQnLCBlbmFibGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHZtLnNhdmVUb29sQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0VG9vbHNCeUNhdGVnb3J5KGNhdGVnb3J5OiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZtLmF2YWlsYWJsZVRvb2xzLmZpbHRlcigodG9vbDogYW55KSA9PiB0b29sLmNhdGVnb3J5ID09PSBjYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBnZXRDYXRlZ29yeURpc3BsYXlOYW1lKGNhdGVnb3J5OiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcGxheU1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lOiAn5Zy65pmv5bel5YW3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6ICfoioLngrnlt6XlhbcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiAn57uE5Lu25bel5YW3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZhYjogJ+mihOWItuS9k+W3peWFtycsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0OiAn6aG555uu5bel5YW3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnOiAn6LCD6K+V5bel5YW3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzOiAn5YGP5aW96K6+572uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlcjogJ+acjeWKoeWZqOW3peWFtycsXG4gICAgICAgICAgICAgICAgICAgICAgICBicm9hZGNhc3Q6ICflub/mkq3lt6XlhbcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NlbmVBZHZhbmNlZDogJ+WcuuaZr+mrmOe6p+W3peWFtycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2VuZVZpZXc6ICflnLrmma/op4blm77lt6XlhbcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlSW1hZ2U6ICflj4LogIPlm77niYflt6XlhbcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRBZHZhbmNlZDogJ+i1hOa6kOmrmOe6p+W3peWFtycsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiAn5qCh6aqM5bel5YW3J1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlzcGxheU1hcFtjYXRlZ29yeV0gfHwgY2F0ZWdvcnk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhc3luYyBzYXZlVG9vbENoYW5nZXMoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2bSA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHZtLmF2YWlsYWJsZVRvb2xzLm1hcCgodG9vbDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBTdHJpbmcodG9vbC5jYXRlZ29yeSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogU3RyaW5nKHRvb2wubmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogQm9vbGVhbih0b29sLmVuYWJsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCDpnaLmnb9dIOS/neWtmOW3peWFt+mFjee9ruWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCAodGhpcyBhcyBhbnkpLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFzeW5jIHVwZGF0ZVN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC1zZXJ2ZXItc3RhdHVzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2VydmVyUnVubmluZyA9ICEhcmVzdWx0LnJ1bm5pbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2VydmVyU3RhdHVzVGV4dCA9IHJlc3VsdC5ydW5uaW5nID8gJ+i/kOihjOS4rScgOiAn5bey5YGc5q2iJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2bS5jb25uZWN0ZWRDbGllbnRzID0gcmVzdWx0LmNsaWVudHMgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2bS5odHRwVXJsID0gcmVzdWx0LnJ1bm5pbmcgPyBgaHR0cDovLzEyNy4wLjAuMToke3Jlc3VsdC5wb3J0fWAgOiAnJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uX3N1c3BlbmRTZXR0aW5nc1dhdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2V0dGluZ3MucG9ydCA9IHJlc3VsdC5zZXR0aW5ncy5wb3J0IHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZtLnNldHRpbmdzLmF1dG9TdGFydCA9ICEhcmVzdWx0LnNldHRpbmdzLmF1dG9TdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2V0dGluZ3MuZGVidWdMb2cgPSAhIXJlc3VsdC5zZXR0aW5ncy5lbmFibGVEZWJ1Z0xvZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm0uc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgPSByZXN1bHQuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgfHwgMTA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZtLl9zdXNwZW5kU2V0dGluZ3NXYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2bS5zZXR0aW5nc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIOmdouadv10g6I635Y+W5pyN5Yqh5Zmo54q25oCB5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5fc3VzcGVuZFNldHRpbmdzV2F0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RhcnRTdGF0dXNUaW1lcigpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgdm0uY2xlYXJTdGF0dXNUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICB2bS5zdGF0dXNUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLnVwZGF0ZVN0YXR1cygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNsZWFyU3RhdHVzVGltZXIoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZtID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2bS5zdGF0dXNUaW1lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh2bS5zdGF0dXNUaW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5zdGF0dXNUaW1lciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2bS5fc3VzcGVuZFNldHRpbmdzV2F0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2bS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWVwOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFzeW5jIGNyZWF0ZWQoKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgdm0gPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICBhd2FpdCB2bS5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnVwZGF0ZVN0YXR1cygpO1xuICAgICAgICAgICAgICAgIHZtLnN0YXJ0U3RhdHVzVGltZXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiZWZvcmVEZXN0cm95KCkge1xuICAgICAgICAgICAgICAgICh0aGlzIGFzIGFueSkuY2xlYXJTdGF0dXNUaW1lcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAodGhpcyBhcyBhbnkpLl92bSA9IHZtO1xuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHZtID0gKHRoaXMgYXMgYW55KS5fdm07XG4gICAgICAgIGlmICh2bSkge1xuICAgICAgICAgICAgdm0uY2xlYXJTdGF0dXNUaW1lcigpO1xuICAgICAgICAgICAgdm0uJGRlc3Ryb3koKTtcbiAgICAgICAgICAgICh0aGlzIGFzIGFueSkuX3ZtID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl19
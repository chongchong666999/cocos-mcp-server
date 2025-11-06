import { MCPServer } from './mcp-server';
import { readSettings, saveSettings } from './settings';
import { MCPServerSettings } from './types';
import { ToolManager } from './tools/tool-manager';
import { ensureEditorAdapters } from './utils/editor-adapter';

let mcpServer: MCPServer | null = null;
let toolManager: ToolManager;

type MessageHandler = (event: any, ...args: any[]) => any;

const messages: Record<string, MessageHandler> = {
    'cocos-mcp-server:open-panel'(event: any) {
        Editor.Panel.open('cocos-mcp-server');
        if (event && event.reply) {
            event.reply();
        }
    },

    async 'cocos-mcp-server:start-server'(event: any) {
        if (!mcpServer) {
            console.warn('[MCP插件] mcpServer 未初始化，尝试使用默认设置重新创建');
            initializeServer();
        }

        if (!mcpServer) {
            event.reply(new Error('MCP 服务器初始化失败'));
            return;
        }

        try {
            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            await mcpServer.start();
            event.reply(null, mcpServer.getStatus());
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:stop-server'(event: any) {
        try {
            if (mcpServer) {
                mcpServer.stop();
            }
            event.reply(null, { success: true });
        } catch (error) {
            event.reply(error);
        }
    },

    'cocos-mcp-server:get-server-status'(event: any) {
        try {
            const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
            const settings = mcpServer ? mcpServer.getSettings() : readSettings();
            event.reply(null, {
                ...status,
                settings
            });
        } catch (error) {
            event.reply(error);
        }
    },

    'cocos-mcp-server:get-server-settings'(event: any) {
        try {
            event.reply(null, mcpServer ? mcpServer.getSettings() : readSettings());
        } catch (error) {
            event.reply(error);
        }
    },

    'cocos-mcp-server:get-settings'(event: any) {
        try {
            event.reply(null, mcpServer ? mcpServer.getSettings() : readSettings());
        } catch (error) {
            event.reply(error);
        }
    },

    'cocos-mcp-server:get-tools-list'(event: any) {
        try {
            event.reply(null, mcpServer ? mcpServer.getAvailableTools() : []);
        } catch (error) {
            event.reply(error);
        }
    },

    'cocos-mcp-server:get-filtered-tools-list'(event: any) {
        try {
            if (!mcpServer) {
                event.reply(null, []);
                return;
            }

            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            event.reply(null, mcpServer.getFilteredTools(enabledTools));
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:update-settings'(event: any, settings: MCPServerSettings) {
        if (!settings) {
            event.reply(new Error('无效的服务器设置'));
            return;
        }

        try {
            saveSettings(settings);

            if (mcpServer) {
                mcpServer.stop();
            }

            mcpServer = new MCPServer(settings);

            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            await mcpServer.start();

            event.reply(null, { success: true, settings });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:get-tool-manager-state'(event: any) {
        try {
            event.reply(null, toolManager.getToolManagerState());
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:create-tool-configuration'(event: any, name: string, description?: string) {
        try {
            const config = toolManager.createConfiguration(name, description);
            event.reply(null, { success: true, id: config.id, config });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:update-tool-configuration'(event: any, configId: string, updates: any) {
        try {
            event.reply(null, toolManager.updateConfiguration(configId, updates));
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:delete-tool-configuration'(event: any, configId: string) {
        try {
            toolManager.deleteConfiguration(configId);
            event.reply(null, { success: true });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:set-current-tool-configuration'(event: any, configId: string) {
        try {
            toolManager.setCurrentConfiguration(configId);
            event.reply(null, { success: true });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:update-tool-status'(event: any, category: string, toolName: string, enabled: boolean) {
        try {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }

            toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);

            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }

            event.reply(null, { success: true });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:update-tool-status-batch'(event: any, updates: any[]) {
        try {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }

            toolManager.updateToolStatusBatch(currentConfig.id, updates);

            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }

            event.reply(null, { success: true });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:export-tool-configuration'(event: any, configId: string) {
        try {
            event.reply(null, { configJson: toolManager.exportConfiguration(configId) });
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:import-tool-configuration'(event: any, configJson: string) {
        try {
            event.reply(null, toolManager.importConfiguration(configJson));
        } catch (error) {
            event.reply(error);
        }
    },

    async 'cocos-mcp-server:get-enabled-tools'(event: any) {
        try {
            event.reply(null, toolManager.getEnabledTools());
        } catch (error) {
            event.reply(error);
        }
    }
};

function initializeServer() {
    toolManager = toolManager || new ToolManager();
    const settings = readSettings();
    mcpServer = new MCPServer(settings);

    const enabledTools = toolManager.getEnabledTools();
    mcpServer.updateEnabledTools(enabledTools);

    if (settings.autoStart) {
        mcpServer.start().catch((err) => {
            console.error('[MCP插件] 自动启动失败:', err);
        });
    }
}

const extension = {
    load() {
        console.log('[MCP插件] Cocos MCP Server extension loaded');
        ensureEditorAdapters();
        initializeServer();
    },

    unload() {
        if (mcpServer) {
            mcpServer.stop();
            mcpServer = null;
        }
    },

    messages
};

export = extension;

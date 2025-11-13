import { TavilySearch } from '@langchain/tavily';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  createSearchLLM,
  createAnalysisLLM,
  createGenerationLLM,
} from './nodes/llm';
import path from 'path';

// 统一的 MCP 工具初始化函数
export async function initializeMCPToolsForDeepResearch() {
  const { MultiServerMCPClient } = await import('@langchain/mcp-adapters');
  const { TavilySearch } = await import('@langchain/tavily');

  // 添加超时处理的 MCP 客户端初始化
  const initializeMCPServers = async () => {
    try {
      const mcptools = new MultiServerMCPClient({
        mcpServers: {
          'server-sequential-thinking': {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
            transport: 'stdio',
          },
          filesystem: {
            command: 'npx',
            args: [
              '-y',
              '@modelcontextprotocol/server-filesystem',
              path.join(process.cwd(), 'public'),
            ],
            transport: 'stdio',
          },
          // playwright: {
          //   command: 'npx',
          //   args: ['@playwright/mcp@latest'],
          //   transport: 'stdio',
          // },
        },
      });

      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MCP 服务器连接超时')), 15000);
      });

      // 获取 MCP 工具，带超时处理
      const tools = await Promise.race([
        mcptools.getTools(),
        timeoutPromise
      ]) as any[];

      return { mcptools, tools };
    } catch (error) {
      console.error('MCP 服务器初始化失败:', error);

      // 如果 MCP 服务器失败，尝试只使用搜索工具
      console.log('回退到仅使用搜索工具');
      return { mcptools: null, tools: [] };
    }
  };

  const { mcptools, tools } = await initializeMCPServers();

  // 添加搜索工具
  const searchTool = new TavilySearch({ maxResults: 3 });
  const allTools = [searchTool, ...tools];

  return {
    allTools,
    searchTool,
    mcpTools: tools,
  };
}

// 创建工具配置
export function createToolsConfig() {
  return {
    tavily: {
      maxResults: 5,
      searchDepth: 'advanced' as const,
      includeAnswer: true,
    },
    mcp: {
      enableSequentialThinking: true,
      enableFilesystem: true,
      allowedDirectories: [process.cwd()],
    },
  };
}

// 工具配置接口
export interface ToolsConfig {
  tavily?: {
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
  };
  mcp?: {
    enableSequentialThinking?: boolean;
    enableFilesystem?: boolean;
    allowedDirectories?: string[];
    customServers?: Record<
      string,
      {
        command: string;
        args: string[];
        transport: 'stdio';
      }
    >;
  };
}

// 统一的工具初始化函数
export async function initializeTools(config?: RunnableConfig) {
  const toolsConfig: ToolsConfig = config?.configurable?.toolsConfig || {};

  // 初始化搜索工具
  const tavilyConfig = toolsConfig.tavily || {};
  const searchTool = new TavilySearch({
    maxResults: tavilyConfig.maxResults || 5,
    searchDepth: tavilyConfig.searchDepth || 'advanced',
    includeAnswer: tavilyConfig.includeAnswer !== false,
  });

  // 初始化 MCP 工具
  const mcpConfig = toolsConfig.mcp || {};
  const mcpServers: Record<string, any> = {};

  // 添加 sequential-thinking 服务器
  if (mcpConfig.enableSequentialThinking !== false) {
    mcpServers['server-sequential-thinking'] = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-sequential-thinking', '-y'],
      transport: 'stdio',
    };
  }

  // 添加 filesystem 服务器
  if (mcpConfig.enableFilesystem !== false) {
    const allowedDirs = mcpConfig.allowedDirectories || [process.cwd()];
    mcpServers['filesystem'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', ...allowedDirs],
      transport: 'stdio',
    };
  }

  // 添加自定义服务器
  if (mcpConfig.customServers) {
    Object.assign(mcpServers, mcpConfig.customServers);
  }

  let mcpTools: unknown[] = [];
  if (Object.keys(mcpServers).length > 0) {
    try {
      const mcpClient = new MultiServerMCPClient({ mcpServers });

      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MCP 服务器连接超时')), 10000);
      });

      mcpTools = await Promise.race([
        mcpClient.getTools(),
        timeoutPromise
      ]) as unknown[];
    } catch (error) {
      console.error('MCP 工具初始化失败，继续使用搜索工具:', error);
      mcpTools = [];
    }
  }

  return {
    searchTool,
    mcpTools,
    allTools: [searchTool, ...mcpTools],
  };
}

// 保留向后兼容的函数
export function getToolsConfig(config?: RunnableConfig): ToolsConfig {
  return config?.configurable?.toolsConfig || {};
}

export async function initializeMCPTools(toolsConfig: ToolsConfig) {
  const mcpConfig = toolsConfig.mcp || {};
  const mcpServers: Record<string, any> = {};

  if (mcpConfig.enableSequentialThinking !== false) {
    mcpServers['server-sequential-thinking'] = {
      command: 'npx',
      args: ['@modelcontextprotocol/server-sequential-thinking', '-y'],
      transport: 'stdio',
    };
  }

  if (mcpConfig.enableFilesystem !== false) {
    const allowedDirs = mcpConfig.allowedDirectories || [process.cwd()];
    mcpServers['filesystem'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', ...allowedDirs],
      transport: 'stdio',
    };
  }

  if (mcpConfig.customServers) {
    Object.assign(mcpServers, mcpConfig.customServers);
  }

  if (Object.keys(mcpServers).length === 0) {
    return [];
  }

  try {
    const mcptools = new MultiServerMCPClient({ mcpServers });

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MCP 服务器连接超时')), 10000);
    });

    return await Promise.race([
      mcptools.getTools(),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('MCP 工具初始化失败:', error);
    return [];
  }
}

export function initializeSearchTool(toolsConfig: ToolsConfig) {
  const tavilyConfig = toolsConfig.tavily || {};

  return new TavilySearch({
    maxResults: tavilyConfig.maxResults || 5,
    searchDepth: tavilyConfig.searchDepth || 'advanced',
    includeAnswer: tavilyConfig.includeAnswer !== false,
  });
}

// 创建搜索专用的 ReactAgent
export async function createSearchAgent() {
  const llm = createSearchLLM();

  const searchTool = new TavilySearch({
    maxResults: 5,
    searchDepth: 'advanced',
    includeAnswer: true,
  });

  let tools: unknown[] = [];
  try {
    const mcptools = new MultiServerMCPClient({
      mcpServers: {
        'server-sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          transport: 'stdio',
        },
      },
    });

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MCP 服务器连接超时')), 10000);
    });

    tools = await Promise.race([
      mcptools.getTools(),
      timeoutPromise
    ]) as unknown[];
  } catch (error) {
    console.error('搜索 Agent MCP 工具初始化失败，仅使用搜索工具:', error);
    tools = [];
  }

  const searchPrompt = `你是一个专业的信息搜索助手。你的任务是：

1. 理解用户的搜索需求
2. 制定有效的搜索策略
3. 执行搜索并获取相关信息
4. 对搜索结果进行初步筛选和整理

请根据用户提供的章节标题和描述，搜索相关的高质量信息。
优先搜索权威来源、学术资料、官方文档等可靠信息。

搜索完成后，请提供：
- 搜索查询词
- 搜索结果摘要
- 关键信息点
- 信息来源评估`;

  return createReactAgent({
    llm,
    tools: [searchTool, ...tools],
    prompt: searchPrompt,
  });
}

// 创建分析专用的 ReactAgent
export async function createAnalysisAgent() {
  const llm = createAnalysisLLM();

  let tools: unknown[] = [];
  try {
    const mcptools = new MultiServerMCPClient({
      mcpServers: {
        'server-sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          transport: 'stdio',
        },
      },
    });

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MCP 服务器连接超时')), 10000);
    });

    tools = await Promise.race([
      mcptools.getTools(),
      timeoutPromise
    ]) as unknown[];
  } catch (error) {
    console.error('分析 Agent MCP 工具初始化失败:', error);
    tools = [];
  }

  const analysisPrompt = `你是一个专业的信息分析师。你的任务是：

1. 深入分析提供的搜索结果和信息
2. 提取关键信息和核心观点
3. 识别重要的数据、事实和趋势
4. 评估信息的可靠性和相关性
5. 生成结构化的分析报告

分析时请注意：
- 区分事实和观点
- 识别权威来源
- 提取量化数据
- 发现内在联系和模式
- 评估信息的时效性

请使用sequential-thinking工具进行深度思考和分析。`;

  return createReactAgent({
    llm,
    tools: [...tools],
    prompt: analysisPrompt,
  });
}

// 创建内容生成专用的 ReactAgent
export async function createContentGenerationAgent() {
  const llm = createGenerationLLM();

  let tools: unknown[] = [];
  try {
    const mcptools = new MultiServerMCPClient({
      mcpServers: {
        'server-sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          transport: 'stdio',
        },
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
          transport: 'stdio',
        },
      },
    });

    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MCP 服务器连接超时')), 10000);
    });

    tools = await Promise.race([
      mcptools.getTools(),
      timeoutPromise
    ]) as unknown[];
  } catch (error) {
    console.error('内容生成 Agent MCP 工具初始化失败:', error);
    tools = [];
  }

  const generationPrompt = `你是一个专业的内容创作专家。你的任务是：

1. 基于分析结果生成高质量的研究内容
2. 确保内容结构清晰、逻辑严密
3. 使用适当的Markdown格式
4. 包含必要的引用和参考
5. 保持内容的学术性和专业性

内容生成要求：
- 使用清晰的标题层级（H2, H3, H4）
- 包含具体的数据和事实
- 提供相关的引用来源
- 逻辑连贯，论证充分
- 语言准确，表达清晰

请使用sequential-thinking工具进行深度思考，确保生成的内容质量。`;

  return createReactAgent({
    llm,
    tools: [...tools],
    prompt: generationPrompt,
  });
}

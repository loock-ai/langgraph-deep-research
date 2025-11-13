import '../../utils/loadEnv';
import { getCheckpointer } from '../chatbot';
import { initializeMCPToolsForDeepResearch, createToolsConfig } from './tools';

// 导出类型定义
export * from './types';
export * from './state';

// 导出节点
export {
  analyzeQuestionNode,
  generatePlanNode,
  researchSectionNode,
  generateReportNode,
  executeSearchTask,
  executeAnalyzeTask,
  executeGenerateTask,
} from './nodes';

// 导出边
export * from './edges';

// 导出工具
export * from './tools';

// 导出状态图
export * from './graph';

// 导入需要的函数
import {
  createDeepResearchGraph,
  createDeepResearchGraphWithCheckpoint,
  createInitialState,
  validateState,
} from './graph';
import { BaseCheckpointSaver } from '@langchain/langgraph';

export { ResearchStateAnnotation, type ResearchState } from './state';

export {
  type QuestionAnalysis,
  type ResearchPlan,
  type ResearchTask,
  type SearchResult,
  type AnalysisResult,
  type ContentSection,
  type GeneratedFile,
  type ResearchStatus,
} from './types';

// 使用示例函数
export async function runDeepResearch(
  question: string,
  sessionId: string,
  userId: string,
  options?: {
    checkpointer?: BaseCheckpointSaver<number>;
    onProgress?: (progress: number, status: string) => void;
    onError?: (error: string) => void;
  }
) {
  const {
    checkpointer = getCheckpointer(),
    onProgress,
    onError,
  } = options || {};

  try {
    // 初始化 MCP 工具

    const { allTools } = await initializeMCPToolsForDeepResearch();

    // 创建状态图，传入工具
    const graph = createDeepResearchGraph(checkpointer);

    // 创建初始状态
    const initialState = createInitialState(question, sessionId, userId);

    // 验证状态
    if (!validateState(initialState)) {
      throw new Error('初始状态验证失败');
    }

    // 配置，将工具传入运行时配置
    const config = checkpointer
      ? {
          configurable: {
            thread_id: sessionId,
            tools: allTools,
          },
        }
      : {
          configurable: {
            tools: allTools,
          },
        };

    // 执行研究
    const stream = await graph.stream(initialState, config);

    let finalState: unknown = null;

    for await (const chunk of stream) {
      // 获取最新状态
      const nodeNames = Object.keys(chunk);
      if (nodeNames.length > 0) {
        const nodeName = nodeNames[0];
        const nodeState = (chunk as Record<string, unknown>)[nodeName] as any;
        finalState = nodeState;

        // 报告进度
        if (onProgress && nodeState.progress !== undefined) {
          onProgress(nodeState.progress, nodeState.status || 'processing');
        }

        // 检查错误
        if (nodeState.status === 'error' && onError) {
          onError(nodeState.error || '未知错误');
        }
      }
    }

    return finalState;
  } catch (error: any) {
    if (onError) {
      onError(error.message);
    }
    throw error;
  }
}

// 流式执行函数
export async function* streamDeepResearch(
  question: string,
  sessionId: string,
  userId: string,
  options?: {
    checkpointer?: any;
  }
) {
  const { checkpointer = getCheckpointer() } = options || {};

  const { allTools } = await initializeMCPToolsForDeepResearch();

  // 创建状态图，传入工具
  const graph = createDeepResearchGraph(checkpointer);

  // 创建初始状态
  const initialState = createInitialState(question, sessionId, userId);

  // 验证状态
  if (!validateState(initialState)) {
    throw new Error('初始状态验证失败');
  }

  // 配置，将工具传入运行时配置
  const config: any = {
    configurable: {
      thread_id: sessionId,
      tools: allTools,
    },
    streamMode: 'updates',
    recursionLimit: 200, // 增加递归限制到200
  };

  // 流式执行
  const stream = await graph.stream(initialState, config);

  for await (const chunk of stream) {
    yield chunk;
  }
}

// 获取研究状态函数
export async function getResearchState(
  sessionId: string,
  checkpointer: any
): Promise<any> {
  if (!checkpointer) {
    throw new Error('需要检查点保存器来获取状态');
  }

  const config = { configurable: { thread_id: sessionId } };

  try {
    // 这里需要根据实际的 checkpointer API 来实现
    // 暂时返回 null，实际使用时需要调用 checkpointer 的相应方法
    return null;
  } catch (error: any) {
    throw new Error(`获取研究状态失败: ${error.message}`);
  }
}

// 恢复研究函数
export async function resumeResearch(
  sessionId: string,
  checkpointer: any,
  options?: {
    onProgress?: (progress: number, status: string) => void;
    onError?: (error: string) => void;
  }
) {
  const { onProgress, onError } = options || {};

  try {
    // 获取当前状态
    const currentState = await getResearchState(sessionId, checkpointer);

    if (!currentState) {
      throw new Error('找不到要恢复的研究状态');
    }

    // 创建状态图
    const graph = createDeepResearchGraph(checkpointer);

    // 配置
    const config = { configurable: { thread_id: sessionId } };

    // 继续执行
    const stream = await graph.stream(null, config);

    let finalState: any = null;

    for await (const chunk of stream) {
      // 获取最新状态
      const nodeNames = Object.keys(chunk);
      if (nodeNames.length > 0) {
        const nodeName = nodeNames[0];
        const nodeState = (chunk as any)[nodeName];
        finalState = nodeState;

        // 报告进度
        if (onProgress && nodeState.progress !== undefined) {
          onProgress(nodeState.progress, nodeState.status || 'processing');
        }

        // 检查错误
        if (nodeState.status === 'error' && onError) {
          onError(nodeState.error || '未知错误');
        }
      }
    }

    return finalState;
  } catch (error: any) {
    if (onError) {
      onError(error.message);
    }
    throw error;
  }
}

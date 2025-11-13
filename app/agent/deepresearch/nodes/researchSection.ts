import { RunnableConfig } from '@langchain/core/runnables';
import { ResearchState } from '../state';
import { ContentSection } from '../types';
import { initializeTools } from '../tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createAnalysisLLM } from './llm';
import { messageContentToString } from './utils';

// 章节研究节点（统一的研究流程）
export async function researchSectionNode(
  state: ResearchState,
  config?: RunnableConfig
): Promise<Partial<ResearchState>> {
  const { plan, generatedContent } = state;

  if (!plan || !plan.sections) {
    return {
      status: 'error',
      error: '缺少研究计划或章节信息',
    };
  }

  // 找到下一个需要研究的章节
  const completedSections = generatedContent.map((c) => c.sectionIndex);
  const nextSectionIndex = plan.sections.findIndex(
    (_, index) => !completedSections.includes(index)
  );

  if (nextSectionIndex === -1) {
    // 所有章节都已完成
    return {
      status: 'generating',
      progress: 80,
    };
  }

  const section = plan.sections[nextSectionIndex];
  const { sessionId } = state;

  // 创建统一的研究 Agent，集成搜索、分析、内容生成功能
  const llm = createAnalysisLLM();

  // 从运行时配置获取工具，如果没有则使用默认初始化
  let allTools = config?.configurable?.tools;

  // 如果没有工具或工具格式不正确，初始化默认工具
  if (!allTools || !Array.isArray(allTools) || allTools.length === 0) {
    console.log('从运行时配置获取工具失败，使用默认初始化');
    try {
      const { allTools: defaultTools } = await initializeTools();
      allTools = defaultTools;
    } catch (error) {
      console.error('工具初始化失败，继续使用 LLM（无工具）:', error);
      allTools = [];
    }
  }

  const researchPrompt = `你是一个专业的研究专家。请按照以下指示完成章节研究：

重要说明：
- 这是一个单一任务，请一次性完成，不要分步骤或循环
- 直接使用可用的工具完成搜索和内容生成
- 生成完整的章节内容作为最终结果

研究任务：
请完成对指定主题的全面研究，包括：
1. 搜索相关信息和数据
2. 分析和整理内容
3. 生成结构化的章节内容

输出要求：
- 使用 Markdown 格式
- 包含清晰的标题结构
- 提供具体的数据和事实
- 确保内容逻辑连贯、论证充分
- 每个章节应该在合理范围内完整（避免过长或过短）

请直接提供最终的研究成果，不需要额外解释。`;

  // 如果没有可用工具，使用简化的 LLM 调用而不是 React Agent
  let result;
  if (!allTools || allTools.length === 0) {
    console.log('没有可用工具，使用简化的 LLM 调用');
    const simplifiedPrompt = `请为以下主题生成一个研究章节：

章节标题：${section.title}
章节描述：${section.description}

请基于你的知识生成一个结构化的研究章节，使用 Markdown 格式。包含：
- 适当的标题和子标题
- 准确的信息和分析
- 专业的表达和结构

章节内容：`;

    result = {
      messages: [
        {
          role: 'assistant' as const,
          content: await llm.invoke(simplifiedPrompt),
        },
      ],
    };
  } else {
    const researchAgent = createReactAgent({
      llm,
      tools: allTools,
      prompt: researchPrompt,
    });

    const researchInput = {
      messages: [
        {
          role: 'user',
          content: `请为以下主题生成一个完整的研究章节：

**章节标题**：${section.title}
**章节描述**：${section.description}
**章节优先级**：${section.priority}

要求：
1. 首先搜索相关信息，获取最新和准确的数据
2. 分析信息并生成结构化的内容
3. 使用Markdown格式，包含适当的标题和子标题
4. 确保内容专业、准确、有价值
5. 长度适中（通常500-1500字）

请直接返回完整的章节内容（Markdown格式）。`,
        },
      ],
    };

    // 确保传递正确的配置和工具
    const agentConfig = {
      configurable: {
        thread_id: `section-research-${sessionId}-${nextSectionIndex}`,
        tools: allTools, // 确保工具可用
      },
      recursionLimit: 20, // 为 Agent 设置递归限制
    };

    result = await researchAgent.invoke(researchInput, agentConfig);
  }

  // 统一处理结果
  try {
    // 提取生成的内容
    const lastMessage = result.messages[result.messages.length - 1];
    const sectionContent = messageContentToString(lastMessage.content);

    const content: ContentSection = {
      taskId: `section-${nextSectionIndex}`,
      sectionIndex: nextSectionIndex,
      title: section.title,
      content: sectionContent,
      timestamp: new Date(),
    };

    const completedSectionsCount = generatedContent.length + 1;
    const totalSections = plan.sections.length;
    const progress = 40 + (completedSectionsCount / totalSections) * 40;

    return {
      generatedContent: [...state.generatedContent, content],
      messages: [...state.messages, ...result.messages],
      progress,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      error: `章节研究失败: ${errorMessage}`,
    };
  }
}

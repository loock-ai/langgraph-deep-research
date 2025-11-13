'use client';

import { useState, useEffect, useRef } from 'react';
import { FileTree } from './components/FileTree';
import { ContentViewer } from './components/ContentViewer';
import { ChatPanel } from './components/ChatPanel';
import { ProgressIndicator } from './components/ProgressIndicator';
import HistoryPanel from './components/HistoryPanel';
import { Clock } from 'lucide-react';

interface ResearchState {
  sessionId?: string;
  status: string;
  progress: number;
  question?: string;
  analysis?: any;
  plan?: any;
  tasks?: any[];
  currentTask?: number;
  totalTasks?: number;
  generatedContent?: any[];
  finalReport?: string;
  fileTree?: any;
  error?: string;
}

export default function DeepResearchPage() {
  const [researchState, setResearchState] = useState<ResearchState>({
    status: 'idle',
    progress: 0,
  });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [currentUserId] = useState(() => {
    // 从localStorage获取用户ID，如果不存在则生成新的并保存
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('deepresearch_user_id');
      if (storedUserId) {
        return storedUserId;
      } else {
        const newUserId = 'user-' + Date.now();
        localStorage.setItem('deepresearch_user_id', newUserId);
        return newUserId;
      }
    }
    // 服务端渲染时的fallback
    return 'user-' + Date.now();
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  // 开始研究
  const startResearch = async (question: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setResearchState({
      status: 'starting',
      progress: 0,
      question,
    });
    setMessages([]);

    try {
      // 首先创建研究会话
      const response = await fetch('/api/deepresearch/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userId: currentUserId, // 使用固定的用户ID
        }),
      });

      if (!response.ok) {
        throw new Error('启动研究失败');
      }

      const { sessionId } = await response.json();

      // 更新状态
      setResearchState((prev) => ({
        ...prev,
        sessionId,
      }));

      // 创建EventSource连接到流式端点
      const eventSource = new EventSource(
        `/api/deepresearch/stream/${sessionId}`
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleResearchUpdate(data);
        } catch (error) {
          console.error('解析SSE数据失败:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        setIsLoading(false);
        setResearchState((prev) => ({
          ...prev,
          status: 'error',
          error: '连接中断',
        }));
        eventSource.close();
      };
    } catch (error: any) {
      console.error('启动研究失败:', error);
      setIsLoading(false);
      setResearchState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    }
  };

  // 处理研究更新
  const handleResearchUpdate = (data: any) => {
    console.log('研究更新:', data);

    switch (data.type) {
      case 'session_created':
        setResearchState((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          status: data.status,
          progress: data.progress,
        }));
        addMessage({
          type: 'system',
          content: `研究会话已创建，ID: ${data.sessionId}`,
          timestamp: new Date(),
        });
        break;

      case 'progress':
        setResearchState((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          currentTask: data.currentTask,
          totalTasks: data.totalTasks,
          analysis: data.analysis,
          plan: data.plan,
          tasks: data.tasks,
          generatedContent: data.generatedContent,
          error: data.error,
        }));

        // 添加进度消息
        if (data.analysis) {
          addMessage({
            type: 'analysis',
            content: data.analysis,
            timestamp: new Date(),
          });
        }

        if (data.plan) {
          addMessage({
            type: 'plan',
            content: data.plan,
            timestamp: new Date(),
          });
        }

        if (data.generatedContent && data.generatedContent.length > 0) {
          console.log(
            '%c Line:162 🥐 data.generatedContent',
            'color:#3f7cff',
            data.generatedContent
          );
          data.generatedContent.forEach((content: any) => {
            addMessage({
              type: 'content',
              content,
              timestamp: new Date(),
            });
          });
        }
        break;

      case 'completed':
        setResearchState((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
          finalReport: data.finalReport,
          fileTree: data.fileTree,
        }));
        setIsLoading(false);
        addMessage({
          type: 'system',
          content: '研究完成！',
          timestamp: new Date(),
        });

        // 关闭EventSource连接
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;

      case 'error':
        setResearchState((prev) => ({
          ...prev,
          status: 'error',
          error: data.error,
        }));
        setIsLoading(false);
        addMessage({
          type: 'error',
          content: data.error,
          timestamp: new Date(),
        });

        // 关闭EventSource连接
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;
    }
  };

  // 添加消息
  const addMessage = (message: any) => {
    console.log('%c Line:218 🍰 message', 'color:#4fff4B', message);
    setMessages((prev) => [...prev, message]);
  };

  // 加载历史会话
  const loadHistorySession = async (sessionId: string) => {
    try {
      setIsLoading(true);

      // 关闭当前的EventSource连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // 获取历史会话状态
      const response = await fetch(`/api/deepresearch/status/${sessionId}`);

      if (!response.ok) {
        throw new Error('加载历史会话失败');
      }

      const sessionData = await response.json();

      // 重建消息历史
      const historyMessages: any[] = [];

      // 添加用户问题
      historyMessages.push({
        type: 'user',
        content: sessionData.question,
        timestamp: new Date(sessionData.createdAt),
      });

      // 如果有状态数据，重建消息
      if (sessionData.state) {
        const state = sessionData.state;

        if (state.analysis) {
          historyMessages.push({
            type: 'analysis',
            content: state.analysis,
            timestamp: new Date(sessionData.createdAt),
          });
        }

        if (state.plan) {
          historyMessages.push({
            type: 'plan',
            content: state.plan,
            timestamp: new Date(sessionData.createdAt),
          });
        }

        if (state.generatedContent && state.generatedContent.length > 0) {
          state.generatedContent.forEach((content: any) => {
            historyMessages.push({
              type: 'content',
              content,
              timestamp: new Date(sessionData.createdAt),
            });
          });
        }
      }

      // 添加完成消息
      if (sessionData.status === 'completed') {
        historyMessages.push({
          type: 'system',
          content: '研究完成！',
          timestamp: new Date(sessionData.updatedAt),
        });
      } else if (sessionData.status === 'error') {
        historyMessages.push({
          type: 'error',
          content: sessionData.state?.error || '研究过程中出现错误',
          timestamp: new Date(sessionData.updatedAt),
        });
      }

      // 更新状态
      setResearchState({
        sessionId: sessionData.sessionId,
        status: sessionData.status,
        progress: sessionData.progress,
        question: sessionData.question,
        analysis: sessionData.state?.analysis,
        plan: sessionData.state?.plan,
        tasks: sessionData.state?.tasks,
        currentTask: sessionData.state?.currentTask,
        totalTasks: sessionData.state?.totalTasks,
        generatedContent: sessionData.state?.generatedContent,
        finalReport: sessionData.state?.finalReport,
        fileTree: sessionData.fileTree,
        error: sessionData.state?.error,
      });

      setMessages(historyMessages);
      setSelectedFile(null);
      setFileContent('');
    } catch (error: any) {
      console.error('加载历史会话失败:', error);
      addMessage({
        type: 'error',
        content: '加载历史会话失败: ' + error.message,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理历史会话选择
  const handleSelectHistorySession = (sessionId: string) => {
    loadHistorySession(sessionId);
  };

  // 选择文件
  const handleFileSelect = async (filePath: string) => {
    if (!researchState.sessionId) return;

    setSelectedFile(filePath);

    try {
      const response = await fetch(
        `/api/deepresearch/files/${researchState.sessionId}/${filePath}`
      );

      if (response.ok) {
        const content = await response.text();
        setFileContent(content);
      } else {
        setFileContent('文件加载失败');
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      setFileContent('文件加载失败');
    }
  };

  // 清理EventSource连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className='h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'>
      {/* 顶部标题栏 - 优化版 */}
      <header className='bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg'>
              <svg className='w-7 h-7 text-white' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
              </svg>
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Deep Research</h1>
              <p className='text-sm text-gray-500'>AI 驱动的深度研究平台</p>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {/* 历史按钮 - 优化版 */}
            <button
              onClick={() => setShowHistoryPanel(true)}
              className='flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md'
              title='查看历史记录'
            >
              <Clock className='w-4 h-4' />
              <span className='font-medium'>历史记录</span>
            </button>

            {researchState.sessionId && (
              <div className='px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl'>
                <span className='text-sm text-blue-700 font-medium'>
                  会话: {researchState.sessionId.slice(0, 8)}...
                </span>
              </div>
            )}

            <ProgressIndicator
              status={researchState.status}
              progress={researchState.progress}
              currentTask={researchState.currentTask}
              totalTasks={researchState.totalTasks}
            />
          </div>
        </div>
      </header>

      {/* 主要内容区域 - 优化版 */}
      <div className='flex-1 flex overflow-hidden gap-4 p-4'>
        {/* 左侧对话面板 */}
        <div className='w-2/5 bg-white rounded-2xl shadow-lg border border-gray-200/50 flex flex-col overflow-hidden'>
          <ChatPanel
            messages={messages}
            researchState={researchState}
            onStartResearch={startResearch}
            isLoading={isLoading}
          />
        </div>

        {/* 右侧预览面板 */}
        <div className='flex-1 flex flex-col'>
          <div className='flex h-full gap-4'>
            {/* 文件树 */}
            <div className='w-72 bg-white rounded-2xl shadow-lg border border-gray-200/50 flex flex-col overflow-hidden'>
              <div className='p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50'>
                <h3 className='text-base font-bold text-gray-900 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' />
                  </svg>
                  研究文件
                </h3>
              </div>
              <div className='flex-1 overflow-auto'>
                {researchState.fileTree ? (
                  <FileTree
                    tree={researchState.fileTree}
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                  />
                ) : (
                  <div className='p-6 text-center'>
                    <div className='w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center'>
                      <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                    </div>
                    <p className='text-sm text-gray-500 font-medium'>暂无文件</p>
                    <p className='text-xs text-gray-400 mt-1'>启动研究后会自动生成</p>
                  </div>
                )}
              </div>
            </div>

            {/* 内容查看器 */}
            <div className='flex-1 bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden'>
              <ContentViewer
                selectedFile={selectedFile}
                content={fileContent}
                researchState={researchState}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 历史面板 */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onSelectSession={handleSelectHistorySession}
        userId={currentUserId}
      />
    </div>
  );
}

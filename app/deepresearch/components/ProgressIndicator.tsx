interface ProgressIndicatorProps {
  status: string;
  progress: number;
  currentTask?: number;
  totalTasks?: number;
}

export function ProgressIndicator({
  status,
  progress,
  currentTask,
  totalTasks,
}: ProgressIndicatorProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing':
        return 'bg-blue-500';
      case 'planning':
        return 'bg-purple-500';
      case 'executing':
        return 'bg-orange-500';
      case 'generating':
        return 'bg-green-500';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle':
        return '等待开始';
      case 'starting':
        return '正在启动';
      case 'analyzing':
        return '分析问题';
      case 'planning':
        return '制定计划';
      case 'executing':
        return '执行研究';
      case 'generating':
        return '生成报告';
      case 'completed':
        return '研究完成';
      case 'error':
        return '发生错误';
      default:
        return status;
    }
  };

  return (
    <div className='flex items-center space-x-4 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm'>
      {/* 状态指示器 - 优化版 */}
      <div className='flex items-center space-x-2'>
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(status)} shadow-lg ${
            status === 'executing' || status === 'starting' ? 'animate-pulse' : ''
          }`}
        />
        <span className='text-sm font-semibold text-gray-800'>
          {getStatusText(status)}
        </span>
      </div>

      {/* 进度条 - 优化版 */}
      {progress > 0 && (
        <div className='flex items-center space-x-3'>
          <div className='w-40 bg-gray-100 rounded-full h-2.5 shadow-inner overflow-hidden'>
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getStatusColor(
                status
              )} shadow-sm`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className='text-sm font-bold text-gray-700 min-w-[3rem] text-right'>
            {progress.toFixed(0)}%
          </span>
        </div>
      )}

      {/* 任务进度 - 优化版 */}
      {currentTask !== undefined &&
        totalTasks !== undefined &&
        totalTasks > 0 && (
          <div className='px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg'>
            <span className='text-sm font-bold text-blue-700'>
              {currentTask + 1}/{totalTasks}
            </span>
          </div>
        )}
    </div>
  );
}

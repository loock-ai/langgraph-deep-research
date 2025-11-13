import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface Session {
    id: string;
    name: string;
    created_at: string;
}

interface SessionSidebarProps {
    currentSessionId: string;
    onSelect: (id: string) => void;
    onNew: (id: string) => void;
}

// 获取会话标题（可用 thread_id 简写或首条消息摘要，后续可扩展）
function getSessionTitle(session: Session) {
    return session.name || `会话 ${session.id.slice(0, 8)}`;
}

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const MessageIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const SessionSidebar = forwardRef(function SessionSidebar(
    { currentSessionId, onSelect, onNew }: SessionSidebarProps,
    ref
) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    useImperativeHandle(ref, () => ({ fetchSessions }), [sessions]);

    useEffect(() => {
        fetchSessions();
    }, [currentSessionId]);

    async function fetchSessions() {
        try {
            const res = await fetch('/api/chat/sessions');
            const data = await res.json();
            if (Array.isArray(data.sessions)) {
                setSessions(data.sessions);
            }
        } catch {
            // ignore
        }
    }

    async function handleNew() {
        const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '' })
        });
        const data = await res.json();
        if (data.id) {
            onNew(data.id);
            fetchSessions();
        }
    }

    async function handleDelete(id: string) {
        await fetch('/api/chat/sessions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        fetchSessions();
    }

    async function handleRename(id: string) {
        if (!renameValue.trim()) return;
        await fetch('/api/chat/sessions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: renameValue.trim() })
        });
        setRenameId(null);
        setRenameValue('');
        fetchSessions();
    }

    return (
        <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 h-full flex flex-col backdrop-blur-sm">
            {/* 头部 */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <MessageIcon />
                        历史会话
                    </h2>
                </div>
                <button
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleNew}
                >
                    <PlusIcon />
                    新建会话
                </button>
            </div>

            {/* 会话列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {sessions.length === 0 ? (
                    <div className="text-purple-300/60 p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <MessageIcon />
                        </div>
                        <p className="text-sm">暂无历史会话</p>
                        <p className="text-xs mt-1 text-purple-400/40">点击上方按钮创建新会话</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {sessions.map((session) => (
                            <li key={session.id} className="group relative">
                                <button
                                    className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                                        session.id === currentSessionId
                                            ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white font-semibold shadow-lg border border-purple-500/30'
                                            : 'text-purple-200/80 hover:bg-white/5 hover:text-white'
                                    }`}
                                    onClick={() => onSelect(session.id)}
                                    disabled={session.id === currentSessionId}
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        session.id === currentSessionId ? 'bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse' : 'bg-purple-500/30'
                                    }`} />
                                    <span className="truncate flex-1 text-sm">{getSessionTitle(session)}</span>
                                    {session.id === currentSessionId && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    )}
                                </button>

                                {/* 悬停时显示的操作按钮 */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        className="p-1.5 bg-slate-800/90 text-blue-400 rounded-lg hover:bg-slate-700 hover:text-blue-300 transition-all duration-200 backdrop-blur-sm shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRenameId(session.id);
                                            setRenameValue(session.name);
                                        }}
                                        title="重命名"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        className="p-1.5 bg-slate-800/90 text-red-400 rounded-lg hover:bg-slate-700 hover:text-red-300 transition-all duration-200 backdrop-blur-sm shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(session.id);
                                        }}
                                        title="删除"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 重命名弹窗 */}
            {renameId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl w-96 border border-white/10 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                            <EditIcon />
                            重命名会话
                        </h2>
                        <input
                            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="输入新的会话名称..."
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(renameId);
                                if (e.key === 'Escape') setRenameId(null);
                            }}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-5 py-2.5 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700 transition-all duration-200 font-medium"
                                onClick={() => setRenameId(null)}
                            >
                                取消
                            </button>
                            <button
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25"
                                onClick={() => handleRename(renameId)}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
});

export default SessionSidebar; 
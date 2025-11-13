# LangGraph Deep Research - 全栈技术架构文档

> 生成时间: 2025-11-13
> 项目名称: langgraph-chat-app
> 版本: 0.1.0

---

## 1. 全景图 (C4 Context 风格)

### 1.1 识别的系统元素

**核心服务**:
- Next.js 全栈应用 (前端 + API Routes)
- LangGraph 状态图引擎 (聊天机器人 + DeepResearch)
- SQLite 数据库 (会话持久化 + 检查点)
- MCP 工具服务器 (Sequential Thinking, Filesystem, Playwright)

**外部依赖**:
- OpenAI API (LLM 服务)
- Tavily Search API (网络搜索)

**用户角色**:
- 终端用户 (浏览器访问)

### 1.2 架构全景图

```mermaid
graph TB
    subgraph client["客户端层"]
        Browser[浏览器<br/>Chrome/Safari/Firefox]
        User[终端用户<br/>交互操作]
    end

    subgraph app["LangGraph Deep Research - Next.js 15 全栈应用"]
        subgraph frontend["前端层 - React 19"]
            ChatUI[聊天界面<br/>app page.tsx<br/>流式响应显示]
            DeepResearchUI[深度研究界面<br/>app deepresearch page.tsx<br/>SSE进度跟踪]
            SessionSidebar[会话侧边栏<br/>app components SessionSidebar.tsx<br/>历史会话管理]
            FileTree[文件树组件<br/>app deepresearch FileTree.tsx<br/>研究成果展示]
        end

        subgraph api["API路由层 - Next.js API Routes"]
            ChatAPI[聊天API<br/>POST api chat<br/>流式响应]
            SessionAPI[会话API<br/>api chat sessions<br/>CRUD操作]
            ResearchStartAPI[研究启动API<br/>POST api deepresearch start<br/>创建研究会话]
            ResearchStreamAPI[研究流式API<br/>GET api deepresearch stream<br/>SSE推送]
            ResearchStatusAPI[研究状态API<br/>GET api deepresearch status<br/>状态查询]
            FileAPI[文件访问API<br/>GET api deepresearch files<br/>文件读取]
        end

        subgraph logic["业务逻辑层 - LangGraph Agent"]
            ChatbotGraph[聊天机器人图<br/>app agent chatbot.ts<br/>START chatbot END]
            DeepResearchGraph[深度研究图<br/>app agent deepresearch<br/>多节点状态机]

            subgraph deepnodes["DeepResearch 节点"]
                AnalyzeNode[问题分析节点<br/>analyzeQuestionNode<br/>提取关键词研究方向]
                PlanNode[计划生成节点<br/>generatePlanNode<br/>创建研究大纲]
                ResearchNode[章节研究节点<br/>researchSectionNode<br/>搜索分析生成]
                ReportNode[报告生成节点<br/>generateReportNode<br/>汇总Markdown HTML]
            end
        end

        subgraph data["数据访问层"]
            ChatDB[聊天数据库<br/>app agent db.ts<br/>sessions表]
            ResearchDB[研究数据库<br/>app api deepresearch db.ts<br/>research sessions表]
            Checkpointer[检查点存储<br/>SqliteSaver<br/>LangGraph状态持久化]
            FileManager[文件管理器<br/>app api fileManager.ts<br/>public目录管理]
        end
    end

    subgraph external["外部服务"]
        OpenAI[OpenAI API<br/>gpt-3.5-turbo gpt-4<br/>LLM推理]
        Tavily[Tavily Search<br/>网络搜索服务<br/>maxResults 3-5]
    end

    subgraph mcp["MCP工具服务器"]
        MCPThinking[Sequential Thinking<br/>server-sequential-thinking<br/>深度思考工具]
        MCPFilesystem[Filesystem<br/>server-filesystem<br/>文件读写]
        MCPPlaywright[Playwright<br/>playwright mcp<br/>浏览器自动化]
    end

    Browser --> ChatUI
    Browser --> DeepResearchUI
    User --> Browser

    ChatUI --> ChatAPI
    ChatUI --> SessionAPI
    SessionSidebar --> SessionAPI

    DeepResearchUI --> ResearchStartAPI
    DeepResearchUI --> ResearchStreamAPI
    DeepResearchUI --> ResearchStatusAPI
    FileTree --> FileAPI

    ChatAPI --> ChatbotGraph
    ResearchStartAPI --> ResearchDB
    ResearchStreamAPI --> DeepResearchGraph
    ResearchStatusAPI --> ResearchDB
    FileAPI --> FileManager
    SessionAPI --> ChatDB

    ChatbotGraph --> Checkpointer
    DeepResearchGraph --> AnalyzeNode
    AnalyzeNode --> PlanNode
    PlanNode --> ResearchNode
    ResearchNode --> ResearchNode
    ResearchNode --> ReportNode

    DeepResearchGraph --> Checkpointer
    ChatDB --> Checkpointer
    ResearchDB --> Checkpointer
    ReportNode --> FileManager

    ChatbotGraph --> OpenAI
    AnalyzeNode --> OpenAI
    PlanNode --> OpenAI
    ResearchNode --> OpenAI
    ResearchNode --> Tavily
    ReportNode --> OpenAI

    ResearchNode --> MCPThinking
    ResearchNode --> MCPFilesystem
    AnalyzeNode --> MCPThinking
    PlanNode --> MCPThinking

    %% 客户端层样式
    style Browser fill:#bbdefb,stroke:none,color:#000,rx:10,ry:10
    style User fill:#90caf9,stroke:none,color:#000,rx:10,ry:10

    %% 前端层样式
    style ChatUI fill:#b3e5fc,stroke:none,color:#000,rx:10,ry:10
    style DeepResearchUI fill:#81d4fa,stroke:none,color:#000,rx:10,ry:10
    style SessionSidebar fill:#4fc3f7,stroke:none,color:#000,rx:10,ry:10
    style FileTree fill:#29b6f6,stroke:none,color:#000,rx:10,ry:10

    %% API路由层样式
    style ChatAPI fill:#ffe0b2,stroke:none,color:#000,rx:10,ry:10
    style SessionAPI fill:#ffcc80,stroke:none,color:#000,rx:10,ry:10
    style ResearchStartAPI fill:#ffb74d,stroke:none,color:#000,rx:10,ry:10
    style ResearchStreamAPI fill:#ffa726,stroke:none,color:#000,rx:10,ry:10
    style ResearchStatusAPI fill:#ff9800,stroke:none,color:#000,rx:10,ry:10
    style FileAPI fill:#fb8c00,stroke:none,color:#000,rx:10,ry:10

    %% 业务逻辑层样式
    style ChatbotGraph fill:#e1bee7,stroke:none,color:#000,rx:10,ry:10
    style DeepResearchGraph fill:#ce93d8,stroke:none,color:#000,rx:10,ry:10
    style AnalyzeNode fill:#ba68c8,stroke:none,color:#000,rx:10,ry:10
    style PlanNode fill:#ab47bc,stroke:none,color:#000,rx:10,ry:10
    style ResearchNode fill:#9c27b0,stroke:none,color:#000,rx:10,ry:10
    style ReportNode fill:#8e24aa,stroke:none,color:#000,rx:10,ry:10

    %% 数据访问层样式
    style ChatDB fill:#a5d6a7,stroke:none,color:#000,rx:10,ry:10
    style ResearchDB fill:#81c784,stroke:none,color:#000,rx:10,ry:10
    style Checkpointer fill:#66bb6a,stroke:none,color:#000,rx:10,ry:10
    style FileManager fill:#4caf50,stroke:none,color:#000,rx:10,ry:10

    %% 外部服务样式
    style OpenAI fill:#ef9a9a,stroke:none,color:#000,rx:10,ry:10
    style Tavily fill:#e57373,stroke:none,color:#000,rx:10,ry:10

    %% MCP服务样式
    style MCPThinking fill:#e0e0e0,stroke:none,color:#000,rx:10,ry:10
    style MCPFilesystem fill:#bdbdbd,stroke:none,color:#000,rx:10,ry:10
    style MCPPlaywright fill:#9e9e9e,stroke:none,color:#000,rx:10,ry:10

    %% 容器样式
    style client fill:#e3f2fd,stroke:none,color:#000,rx:15,ry:15
    style app fill:#fafafa,stroke:none,color:#000,rx:15,ry:15
    style frontend fill:#e1f5ff,stroke:none,color:#000,rx:15,ry:15
    style api fill:#fff8e1,stroke:none,color:#000,rx:15,ry:15
    style logic fill:#f3e5f5,stroke:none,color:#000,rx:15,ry:15
    style deepnodes fill:#fce4ec,stroke:none,color:#000,rx:15,ry:15
    style data fill:#e8f5e9,stroke:none,color:#000,rx:15,ry:15
    style external fill:#ffebee,stroke:none,color:#000,rx:15,ry:15
    style mcp fill:#f5f5f5,stroke:none,color:#000,rx:15,ry:15
```

<!-- 来源: package.json, README.md, app/page.tsx, app/deepresearch/page.tsx, app/api/chat/route.ts, app/api/deepresearch/start/route.ts, app/agent/chatbot.ts, app/agent/deepresearch/graph.ts, app/agent/deepresearch/tools.ts -->

---

## 2. 模块划分

| 模块名称 | 目录路径 | 入口文件 | 职责描述 |
|---------|---------|---------|---------|
| **前端-聊天界面** | `app/` | `app/page.tsx` | 提供流式聊天UI，管理消息状态，集成会话侧边栏 |
| **前端-深度研究** | `app/deepresearch/` | `app/deepresearch/page.tsx` | SSE进度监控，文件树展示，研究结果查看 |
| **前端-组件库** | `app/components/`, `app/deepresearch/components/` | `SessionSidebar.tsx`, `FileTree.tsx` 等 | 可复用UI组件（会话列表、文件树、内容查看器） |
| **API-聊天路由** | `app/api/chat/` | `app/api/chat/route.ts` | 处理聊天消息POST请求，返回流式响应，支持历史查询GET |
| **API-会话管理** | `app/api/chat/sessions/` | `app/api/chat/sessions/route.ts` | 会话CRUD接口（创建、查询、更新、删除） |
| **API-研究路由** | `app/api/deepresearch/` | `start/route.ts`, `stream/[sessionId]/route.ts` | 启动研究任务，SSE流式推送进度，状态查询 |
| **API-文件访问** | `app/api/deepresearch/files/` | `[sessionId]/[...path]/route.ts` | 动态路由访问研究生成的文件 |
| **Agent-聊天机器人** | `app/agent/` | `chatbot.ts`, `index.ts` | 简单聊天图（START→chatbot→END），集成OpenAI |
| **Agent-深度研究** | `app/agent/deepresearch/` | `graph.ts`, `index.ts` | 复杂研究状态图，包含分析、规划、研究、报告生成4个节点 |
| **Agent-工具系统** | `app/agent/` | `tools.ts`, `config/tools.config.ts` | 工具配置管理（计算器、天气、时间、搜索等） |
| **Agent-MCP集成** | `app/agent/deepresearch/` | `tools.ts` | MCP多服务器客户端，集成Thinking/Filesystem/Playwright |
| **数据层-聊天** | `app/agent/` | `db.ts` | SQLite会话表管理（sessions表） |
| **数据层-研究** | `app/api/deepresearch/` | `db.ts` | 研究会话表（research_sessions）、文件表（generated_files） |
| **数据层-文件** | `app/api/deepresearch/` | `fileManager.ts` | 文件系统操作（public/目录管理、树结构生成） |
| **工具类** | `app/utils/` | `loadEnv.ts`, `threadId.ts` | 环境变量加载、线程ID管理 |

<!-- 来源: 项目目录结构分析 -->

---

## 3. 技术栈快照

| 层级 | 技术 | 版本 | 锁定文件路径 |
|-----|------|------|------------|
| **运行时** | Node.js | ≥18.0 | `README.md:6` |
| **包管理** | pnpm | latest | `pnpm-lock.yaml` |
| **前端框架** | Next.js | 15.3.4 | `package.json:23` |
| **UI库** | React | 19.0.0 | `package.json:24` |
| **UI库** | React DOM | 19.0.0 | `package.json:25` |
| **样式** | Tailwind CSS | ^4 | `package.json:38` |
| **图标库** | Lucide React | 0.525.0 | `package.json:22` |
| **LLM框架** | LangChain Core | 0.3.61 | `package.json:12` |
| **状态图引擎** | LangGraph | 0.3.5 | `package.json:13` |
| **检查点存储** | LangGraph Checkpoint SQLite | 0.1.5 | `package.json:14` |
| **MCP适配器** | LangChain MCP Adapters | 0.5.3 | `package.json:15` |
| **LLM提供商** | LangChain OpenAI | 0.5.16 | `package.json:16` |
| **搜索工具** | LangChain Tavily | 0.1.4 | `package.json:17` |
| **数据库** | better-sqlite3 | 12.2.0 | `package.json:20` |
| **环境变量** | dotenv | 17.0.0 | `package.json:21` |
| **UUID生成** | uuid | 11.1.0 | `package.json:26` |
| **模式验证** | Zod | 3.25.67 | `package.json:27` |
| **类型系统** | TypeScript | ^5 | `package.json:39`, `tsconfig.json` |
| **代码规范** | ESLint | ^9 | `package.json:35-36` |
| **开发工具** | esno | 4.8.0 | `package.json:37` |

<!-- 来源: package.json, README.md, tsconfig.json -->

---

## 4. 运行时拓扑 (Deployment)

### 4.1 本地开发环境

```mermaid
graph TB
    subgraph local["本地开发环境 (localhost:3000)"]
        subgraph nextjs["Next.js Dev Server"]
            Frontend[前端页面<br/>React 19 SSR/CSR]
            APIRoutes[API Routes<br/>无服务器函数模拟]
        end

        subgraph storage["本地存储"]
            SQLite[(SQLite DB<br/>chat_history.db<br/>单文件数据库)]
            PublicFiles[(public目录<br/>研究成果文件夹)]
        end

        subgraph process["Node.js 进程"]
            LangGraph[LangGraph 引擎<br/>内存状态管理]
            MCPServers[MCP 服务器<br/>子进程stdio通信]
        end
    end

    subgraph external_local["外部API (互联网)"]
        OpenAI_Dev[OpenAI API<br/>环境变量配置]
        Tavily_Dev[Tavily API<br/>环境变量配置]
    end

    Frontend --> APIRoutes
    APIRoutes --> LangGraph
    LangGraph --> SQLite
    LangGraph --> MCPServers
    APIRoutes --> PublicFiles
    LangGraph --> OpenAI_Dev
    LangGraph --> Tavily_Dev

    style Frontend fill:#81d4fa,stroke:none,color:#000,rx:10,ry:10
    style APIRoutes fill:#ffb74d,stroke:none,color:#000,rx:10,ry:10
    style SQLite fill:#81c784,stroke:none,color:#000,rx:10,ry:10
    style PublicFiles fill:#a5d6a7,stroke:none,color:#000,rx:10,ry:10
    style LangGraph fill:#ce93d8,stroke:none,color:#000,rx:10,ry:10
    style MCPServers fill:#bdbdbd,stroke:none,color:#000,rx:10,ry:10
    style OpenAI_Dev fill:#ef9a9a,stroke:none,color:#000,rx:10,ry:10
    style Tavily_Dev fill:#e57373,stroke:none,color:#000,rx:10,ry:10

    style local fill:#e1f5ff,stroke:none,color:#000,rx:15,ry:15
    style nextjs fill:#fff8e1,stroke:none,color:#000,rx:15,ry:15
    style storage fill:#e8f5e9,stroke:none,color:#000,rx:15,ry:15
    style process fill:#f3e5f5,stroke:none,color:#000,rx:15,ry:15
    style external_local fill:#ffebee,stroke:none,color:#000,rx:15,ry:15
```

<!-- 来源: README.md, package.json scripts, next.config.ts -->

### 4.2 生产部署（推荐 Vercel）

```mermaid
graph TB
    subgraph vercel["Vercel 平台"]
        EdgeNetwork[Edge Network<br/>全球CDN]

        subgraph serverless["Serverless Functions"]
            ChatFunc[api chat<br/>流式响应函数]
            ResearchFunc[api deepresearch<br/>研究API函数]
        end

        subgraph storage_prod["存储层"]
            VercelBlob[(Vercel Blob<br/>文件存储<br/>需迁移)]
            ExternalDB[(外部数据库<br/>PostgreSQL Supabase<br/>需迁移)]
        end
    end

    subgraph external_prod["外部服务"]
        OpenAI_Prod[OpenAI API<br/>生产密钥]
        Tavily_Prod[Tavily API<br/>生产密钥]
    end

    EdgeNetwork --> ChatFunc
    EdgeNetwork --> ResearchFunc
    ChatFunc --> ExternalDB
    ResearchFunc --> ExternalDB
    ResearchFunc --> VercelBlob
    ChatFunc --> OpenAI_Prod
    ResearchFunc --> OpenAI_Prod
    ResearchFunc --> Tavily_Prod

    style EdgeNetwork fill:#4fc3f7,stroke:none,color:#000,rx:10,ry:10
    style ChatFunc fill:#ffb74d,stroke:none,color:#000,rx:10,ry:10
    style ResearchFunc fill:#ffa726,stroke:none,color:#000,rx:10,ry:10
    style VercelBlob fill:#66bb6a,stroke:none,color:#000,rx:10,ry:10
    style ExternalDB fill:#81c784,stroke:none,color:#000,rx:10,ry:10
    style OpenAI_Prod fill:#ef9a9a,stroke:none,color:#000,rx:10,ry:10
    style Tavily_Prod fill:#e57373,stroke:none,color:#000,rx:10,ry:10

    style vercel fill:#e1f5ff,stroke:none,color:#000,rx:15,ry:15
    style serverless fill:#fff8e1,stroke:none,color:#000,rx:15,ry:15
    style storage_prod fill:#e8f5e9,stroke:none,color:#000,rx:15,ry:15
    style external_prod fill:#ffebee,stroke:none,color:#000,rx:15,ry:15
```

<!-- 来源: README.md:135-137, Next.js 部署文档建议 -->

**注意**: 当前架构使用 better-sqlite3 和本地文件系统，需要适配 Vercel 无服务器环境。

---

## 5. 数据模型

### 5.1 SQLite 数据库模式

```dbml
// 聊天会话表
Table sessions {
  id TEXT [pk, note: 'UUID会话标识符']
  name TEXT [note: '会话名称（首条消息截取）']
  created_at DATETIME [default: `CURRENT_TIMESTAMP`, note: '创建时间']

  Note: '存储聊天会话元数据，关联LangGraph检查点'
}

// 研究会话表
Table research_sessions {
  id TEXT [pk, note: 'UUID研究会话ID']
  user_id TEXT [not null, note: '用户标识符（localStorage生成）']
  question TEXT [not null, note: '研究问题原文']
  status TEXT [not null, note: 'analyzing|planning|executing|generating|completed|error']
  progress INTEGER [default: 0, note: '进度百分比 0-100']
  state_data TEXT [note: 'JSON序列化的ResearchState']
  output_path TEXT [note: '输出目录路径（public/sessionId）']
  final_html_file TEXT [note: '最终HTML报告文件名']
  created_at DATETIME [default: `CURRENT_TIMESTAMP`]
  updated_at DATETIME [default: `CURRENT_TIMESTAMP`]

  Indexes {
    user_id [name: 'idx_sessions_user_id']
    status [name: 'idx_sessions_status']
  }

  Note: '深度研究会话主表'
}

// 生成文件表
Table generated_files {
  id TEXT [pk, note: 'UUID文件ID']
  session_id TEXT [not null, ref: > research_sessions.id, note: '所属研究会话']
  name TEXT [not null, note: '文件名']
  type TEXT [not null, note: 'markdown|html|json']
  content TEXT [not null, note: '文件完整内容']
  relative_path TEXT [not null, note: '相对路径（从public/sessionId开始）']
  absolute_path TEXT [not null, note: '绝对文件系统路径']
  size INTEGER [not null, note: '文件大小（字节）']
  is_public BOOLEAN [default: false, note: '是否公开访问']
  created_at DATETIME [default: `CURRENT_TIMESTAMP`]
  updated_at DATETIME [default: `CURRENT_TIMESTAMP`]

  Indexes {
    session_id [name: 'idx_files_session_id']
  }

  Note: '研究生成的所有文件记录'
}

// LangGraph检查点表（由SqliteSaver自动创建）
Table checkpoints {
  thread_id TEXT [note: '线程ID（会话ID）']
  checkpoint_ns TEXT [note: '检查点命名空间']
  checkpoint_id TEXT [note: '检查点ID']
  parent_checkpoint_id TEXT [note: '父检查点ID']
  type TEXT [note: '检查点类型']
  checkpoint BLOB [note: '序列化的状态数据']
  metadata TEXT [note: 'JSON元数据']

  Note: 'LangGraph内部使用，存储状态机快照'
}
```

<!-- 来源: app/agent/db.ts, app/api/deepresearch/db.ts, @langchain/langgraph-checkpoint-sqlite -->

---

## 6. 接口契约

### 6.1 路由表

| HTTP方法 | 路径 | 源文件:行号 | 职责描述 |
|---------|------|-----------|---------|
| **POST** | `/api/chat` | `app/api/chat/route.ts:9` | 发送聊天消息，返回流式响应（`text/plain; charset=utf-8`，每行一个JSON对象） |
| **GET** | `/api/chat?thread_id=xxx` | `app/api/chat/route.ts:92` | 获取指定会话的历史消息列表 |
| **GET** | `/api/chat` | `app/api/chat/route.ts:92` | 返回API元信息（版本、端点列表） |
| **GET** | `/api/chat/sessions` | `app/api/chat/sessions/route.ts` | 获取所有会话列表 |
| **POST** | `/api/chat/sessions` | `app/api/chat/sessions/route.ts` | 创建新会话 |
| **PATCH** | `/api/chat/sessions` | `app/api/chat/sessions/route.ts` | 更新会话名称 |
| **DELETE** | `/api/chat/sessions` | `app/api/chat/sessions/route.ts` | 删除指定会话 |
| **POST** | `/api/deepresearch/start` | `app/api/deepresearch/start/route.ts:7` | 启动深度研究任务，返回`sessionId` |
| **GET** | `/api/deepresearch/stream/[sessionId]` | `app/api/deepresearch/stream/[sessionId]/route.ts` | SSE流式推送研究进度（`text/event-stream`） |
| **GET** | `/api/deepresearch/status/[sessionId]` | `app/api/deepresearch/status/[sessionId]/route.ts` | 查询研究会话状态和结果 |
| **POST** | `/api/deepresearch/cancel/[sessionId]` | `app/api/deepresearch/cancel/[sessionId]/route.ts` | 取消正在进行的研究任务 |
| **GET** | `/api/deepresearch/history` | `app/api/deepresearch/history/route.ts` | 获取用户的研究历史列表 |
| **GET** | `/api/deepresearch/files/[sessionId]` | `app/api/deepresearch/files/[sessionId]/route.ts` | 获取研究会话的文件树结构（JSON） |
| **GET** | `/api/deepresearch/files/[sessionId]/[...path]` | `app/api/deepresearch/files/[sessionId]/[...path]/route.ts` | 读取具体文件内容（动态路由） |

### 6.2 关键请求/响应示例

#### POST /api/chat

**请求体**:
```json
{
  "message": "你好，请介绍一下React的核心概念",
  "thread_id": "optional-uuid-v4"
}
```

**响应（流式）**:
```
{"type":"chunk","content":"React"}
{"type":"chunk","content":"是"}
{"type":"chunk","content":"一个"}
...
{"type":"end","status":"success","thread_id":"generated-uuid"}
```

#### POST /api/deepresearch/start

**请求体**:
```json
{
  "question": "分析人工智能在医疗领域的应用现状",
  "userId": "user-1699999999999"
}
```

**响应**:
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "研究会话已创建"
}
```

#### GET /api/deepresearch/stream/[sessionId] (SSE)

**响应流**:
```
data: {"type":"session_created","sessionId":"xxx","status":"analyzing","progress":0}

data: {"type":"progress","status":"analyzing","progress":10,"analysis":{"coreTheme":"AI医疗应用","keywords":["机器学习","诊断","影像识别"]}}

data: {"type":"progress","status":"planning","progress":25,"plan":{"title":"AI医疗应用研究报告","sections":[...]}}

data: {"type":"progress","status":"executing","progress":60,"currentTask":2,"totalTasks":5}

data: {"type":"completed","status":"completed","progress":100,"finalReport":"...","fileTree":{...}}
```

<!-- 来源: app/api/chat/route.ts, app/api/deepresearch/start/route.ts, app/api/deepresearch/stream/[sessionId]/route.ts -->

---

## 7. 实时消息流

### 7.1 聊天流式响应序列图

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant ChatUI as ChatPage组件
    participant ChatAPI as POST /api/chat
    participant Graph as ChatbotGraph
    participant OpenAI as OpenAI API

    User->>ChatUI: 输入消息并发送
    ChatUI->>ChatAPI: fetch({message, thread_id})
    ChatAPI->>Graph: app.streamEvents(messages, config)

    loop 流式生成
        Graph->>OpenAI: invoke(messages)
        OpenAI-->>Graph: chunk.content
        Graph-->>ChatAPI: event='on_chat_model_stream'
        ChatAPI-->>ChatUI: {"type":"chunk","content":"..."}
        ChatUI->>User: 实时显示打字效果
    end

    Graph-->>ChatAPI: 生成完成
    ChatAPI-->>ChatUI: {"type":"end","status":"success"}
    ChatUI->>User: 显示完整消息
```

### 7.2 深度研究SSE推送序列图

```mermaid
sequenceDiagram
    participant User as 用户浏览器
    participant UI as DeepResearchPage
    participant StartAPI as POST /api/deepresearch/start
    participant StreamAPI as GET /api/deepresearch/stream/:id (SSE)
    participant Graph as DeepResearchGraph
    participant DB as research_sessions表

    User->>UI: 提交研究问题
    UI->>StartAPI: {question, userId}
    StartAPI->>DB: 创建会话记录
    DB-->>StartAPI: sessionId
    StartAPI-->>UI: {sessionId}

    UI->>StreamAPI: new EventSource(url)
    StreamAPI->>Graph: graph.stream(initialState)

    par 并行处理
        Graph->>Graph: analyzeQuestionNode
        Graph-->>StreamAPI: {type:'progress', analysis:{...}}
        StreamAPI-->>UI: SSE推送
        UI->>User: 显示分析结果
    and
        Graph->>Graph: generatePlanNode
        Graph-->>StreamAPI: {type:'progress', plan:{...}}
        StreamAPI-->>UI: SSE推送
        UI->>User: 显示研究计划
    end

    loop 每个研究章节
        Graph->>Graph: researchSectionNode
        Graph-->>StreamAPI: {type:'progress', generatedContent:[...]}
        StreamAPI-->>UI: SSE推送
        UI->>User: 实时显示章节内容
    end

    Graph->>Graph: generateReportNode
    Graph->>DB: 更新state_data, final_html_file
    Graph-->>StreamAPI: {type:'completed', finalReport:'...'}
    StreamAPI-->>UI: SSE推送
    UI->>User: 显示最终报告
    StreamAPI->>StreamAPI: close()
```

<!-- 来源: app/page.tsx:95-200, app/deepresearch/page.tsx:55-236, app/api/chat/route.ts:32-56, app/api/deepresearch/stream/[sessionId]/route.ts -->

---

## 8. 外部依赖

| 服务名称 | 环境变量名 | 用途 | 配置位置 |
|---------|-----------|------|---------|
| **OpenAI API** | `OPENAI_API_KEY` | LLM推理（聊天、分析、规划、报告生成） | `app/utils/.env` |
| **OpenAI Model** | `OPENAI_MODEL_NAME` | 默认模型名称（如`gpt-3.5-turbo`） | `app/utils/.env` |
| **Tavily Search** | `TAVILY_API_KEY` | 网络搜索（DeepResearch工具） | `app/utils/.env` |
| **MCP Sequential Thinking** | 无（npx动态拉取） | 深度思考工具（`@modelcontextprotocol/server-sequential-thinking`） | `app/agent/deepresearch/tools.ts:20` |
| **MCP Filesystem** | 无（npx动态拉取） | 文件系统读写（`@modelcontextprotocol/server-filesystem`，限定`public/`目录） | `app/agent/deepresearch/tools.ts:24` |
| **MCP Playwright** | 无（npx动态拉取） | 浏览器自动化（`@playwright/mcp`） | `app/agent/deepresearch/tools.ts:32` |

<!-- 来源: README.md:42-52, app/utils/loadEnv.ts, app/agent/deepresearch/tools.ts:17-38 -->

**外部依赖基础URL**:
- OpenAI: `https://api.openai.com/v1/` (SDK内置)
- Tavily: `https://api.tavily.com/` (SDK内置)

---

## 9. 安全与合规

| 主题 | 配置路径/变量名 | 摘要 |
|-----|---------------|------|
| **API密钥管理** | `app/utils/.env` | 敏感密钥存储在`.env`文件中，通过`dotenv`加载（未提交到Git） |
| **密钥隔离** | `.gitignore` | `.env`文件已加入忽略列表（推测，标准实践） |
| **鉴权链路** | <span style="color:red;">待补充</span> | 当前无用户认证系统，仅通过localStorage生成`userId` |
| **输入验证** | `app/api/chat/route.ts:13-15` | 校验`message`参数类型和非空 |
| **输入验证** | `app/api/deepresearch/start/route.ts:11-13` | 校验`question`和`userId`必填 |
| **错误处理** | `app/api/chat/route.ts:57-67` | 捕获异常并返回通用错误消息，避免暴露内部实现 |
| **CORS策略** | `app/api/deepresearch/start/route.ts:35-44` | 允许所有来源（`Access-Control-Allow-Origin: *`） ⚠️ 生产需限制 |
| **文件访问控制** | `app/api/deepresearch/fileManager.ts` | 文件访问限定在`public/`目录，路径拼接使用`path.join()`避免目录穿越 |
| **MCP沙箱** | `app/agent/deepresearch/tools.ts:28` | Filesystem工具限定访问`process.cwd()/public`目录 |
| **Rate Limit** | <span style="color:red;">待补充</span> | 无速率限制配置 |
| **数据加密** | <span style="color:red;">待补充</span> | SQLite数据库未加密 |
| **日志脱敏** | <span style="color:red;">待补充</span> | 控制台日志可能包含敏感信息 |

**OWASP Top 10 映射**:
- ✅ **A03:2021-注入**: Zod模式验证（`package.json:27`）
- ⚠️ **A01:2021-访问控制失效**: 无用户认证和授权
- ⚠️ **A07:2021-识别和身份验证失败**: 无身份验证机制
- ⚠️ **A05:2021-安全配置错误**: CORS策略过于宽松

<!-- 来源: app/api/chat/route.ts, app/api/deepresearch/start/route.ts, app/api/deepresearch/fileManager.ts, app/agent/deepresearch/tools.ts -->

---

## 10. 可观测性

### 10.1 日志记录

**日志输出**:
```typescript
// app/agent/chatbot.ts:42, 47
console.log('初始化 SqliteSaver，数据库路径:', dbPath);
console.log('SqliteSaver 初始化成功');

// app/api/chat/route.ts:58, 81
console.error('流式聊天错误:', error);
console.error('聊天 API 错误:', error);

// app/deepresearch/page.tsx:130
console.log('研究更新:', data);
```

**日志级别**: 仅`console.log`和`console.error`，无结构化日志框架。

<!-- 来源: app/agent/chatbot.ts, app/api/chat/route.ts, app/deepresearch/page.tsx -->

### 10.2 追踪（Tracing）

<span style="color:red;">待补充</span>

当前无分布式追踪配置（OpenTelemetry、Jaeger等）。

### 10.3 指标（Metrics）

<span style="color:red;">待补充</span>

当前无性能指标采集（Prometheus、StatsD等）。

### 10.4 错误监控

**前端错误捕获**:
```typescript
// app/page.tsx:188-196
catch (error) {
  console.error('发送消息时出错:', error);
  // 显示错误消息给用户
}
```

**后端错误处理**:
```typescript
// app/api/chat/route.ts:80-89
catch (error) {
  console.error('聊天 API 错误:', error);
  return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
}
```

无集成第三方错误监控服务（Sentry、Rollbar等）。

<!-- 来源: app/page.tsx, app/api/chat/route.ts -->

---

## 11. 性能基线

<span style="color:red;">待补充</span>

本地未发现性能测试脚本（`k6/`, `locust/`, `artillery/`等目录不存在）。

**已知性能参数**:
- **流式响应延迟**: 依赖OpenAI API响应时间（通常首token延迟200-500ms）
- **数据库查询**: SQLite本地文件访问，查询延迟<10ms（推测）
- **并发支持**: Next.js开发服务器单进程，生产环境需Vercel Edge Functions扩展

**建议基线指标**:
- QPS目标: <span style="color:red;">待测试</span>
- P95延迟: <span style="color:red;">待测试</span>
- 内存占用: <span style="color:red;">待监控</span>

<!-- 来源: 项目目录结构分析 -->

---

## 12. 一键启动命令

### 12.1 本地开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（必需）
mkdir -p app/utils
cat > app/utils/.env << EOF
# OpenAI API 密钥（必需）
OPENAI_API_KEY=your_openai_api_key_here

# 可选配置（有默认值）
OPENAI_MODEL_NAME=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Tavily 搜索API密钥（DeepResearch功能必需）
TAVILY_API_KEY=your_tavily_api_key_here
EOF

# 3. 启动开发服务器
pnpm dev

# 访问地址: http://localhost:3000
```

### 12.2 生产构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 12.3 代码检查

```bash
# 运行ESLint
pnpm lint
```

<!-- 来源: README.md:20-77, package.json:5-9 -->

---

## 13. 术语表 & 缩写

| 术语/缩写 | 全称/解释 | 来源 |
|----------|----------|------|
| **LangGraph** | 用于构建有状态、多参与者应用的框架（基于LangChain） | `README.md:3` |
| **LangChain** | 用于开发由大型语言模型驱动的应用程序的框架 | `SETUP.md:5` |
| **StateGraph** | LangGraph的核心概念，表示状态机图 | `app/agent/chatbot.ts:3` |
| **Checkpointer** | 检查点保存器，用于持久化LangGraph状态 | `app/agent/chatbot.ts:10` |
| **SqliteSaver** | 基于SQLite的检查点保存器实现 | `app/agent/chatbot.ts:10` |
| **thread_id** | 会话线程标识符，用于区分不同的对话会话 | `app/api/chat/route.ts:12` |
| **SSE** | Server-Sent Events，服务器推送事件（单向流式通信） | `app/deepresearch/page.tsx:92` |
| **MCP** | Model Context Protocol，模型上下文协议（工具集成标准） | `package.json:15` |
| **ReactAgent** | LangGraph预构建的反应式代理（可调用工具的LLM代理） | `app/agent/deepresearch/tools.ts:3` |
| **Tavily** | 专为LLM优化的搜索引擎API服务 | `package.json:17` |
| **DeepResearch** | 深度研究功能，多步骤AI驱动的研究报告生成系统 | `app/agent/deepresearch/` |
| **ResearchState** | 深度研究的状态数据结构（包含问题、计划、任务、结果等） | `app/agent/deepresearch/state.ts:34` |
| **Annotation** | LangGraph中定义状态结构的装饰器 | `app/agent/deepresearch/state.ts:1` |
| **QPS** | Queries Per Second，每秒查询数 | 常见性能指标 |
| **P95** | 第95百分位延迟，95%的请求响应时间 | 常见性能指标 |

<!-- 来源: README.md, SETUP.md, app/agent/chatbot.ts, app/agent/deepresearch/ -->

---

## 14. 附录

### 14.1 端口占用表

| 端口 | 服务 | 协议 | 配置位置 |
|-----|------|------|---------|
| **3000** | Next.js Dev Server | HTTP | `package.json:6` (默认) |

<!-- 来源: Next.js默认配置 -->

### 14.2 环境变量全表

| 变量名 | 必需性 | 默认值 | 说明 | 配置文件 |
|-------|-------|-------|------|---------|
| `OPENAI_API_KEY` | ✅ 必需 | 无 | OpenAI API密钥 | `app/utils/.env` |
| `OPENAI_MODEL_NAME` | ❌ 可选 | `gpt-3.5-turbo` | 默认使用的模型 | `app/utils/.env` |
| `OPENAI_TEMPERATURE` | ❌ 可选 | `0.7` | 模型温度参数 | `app/utils/.env` |
| `OPENAI_MAX_TOKENS` | ❌ 可选 | `1000` | 最大生成token数 | `app/utils/.env` |
| `TAVILY_API_KEY` | ⚠️ DeepResearch必需 | 无 | Tavily搜索API密钥 | `app/utils/.env` |
| `NODE_ENV` | ❌ 可选 | `development` | Node.js运行环境 | 系统环境变量 |

<!-- 来源: README.md:42-52, app/utils/loadEnv.ts -->

### 14.3 核心配置模板

#### 14.3.1 TypeScript配置 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 14.3.2 Next.js配置 (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: false, // 禁用 React 严格模式
};
```

#### 14.3.3 数据库路径

```typescript
// app/agent/chatbot.ts:27
const dbPath = path.resolve(process.cwd(), 'chat_history.db');
```

**实际路径**: `<项目根目录>/chat_history.db`

<!-- 来源: tsconfig.json, next.config.ts, app/agent/chatbot.ts -->

### 14.4 文件结构树

```
langgraph-deep-research/
├── app/
│   ├── agent/                      # LangGraph Agent逻辑
│   │   ├── chatbot.ts             # 聊天机器人图
│   │   ├── db.ts                  # 会话数据库操作
│   │   ├── index.ts               # 统一导出
│   │   ├── tools.ts               # 工具管理
│   │   ├── config/
│   │   │   └── tools.config.ts    # 工具配置
│   │   └── deepresearch/          # 深度研究模块
│   │       ├── graph.ts           # 研究状态图
│   │       ├── state.ts           # 状态定义
│   │       ├── types.ts           # 类型定义
│   │       ├── edges.ts           # 条件边逻辑
│   │       ├── nodes.ts           # 节点导出
│   │       ├── tools.ts           # MCP工具集成
│   │       ├── index.ts           # 模块导出
│   │       └── nodes/             # 节点实现
│   │           ├── analyzeQuestion.ts
│   │           ├── generatePlan.ts
│   │           ├── researchSection.ts
│   │           ├── generateReport.ts
│   │           ├── llm.ts         # LLM配置
│   │           └── utils.ts       # 工具函数
│   ├── api/                       # Next.js API Routes
│   │   ├── chat/
│   │   │   ├── route.ts          # 聊天接口
│   │   │   └── sessions/
│   │   │       └── route.ts      # 会话管理接口
│   │   └── deepresearch/
│   │       ├── start/route.ts    # 启动研究
│   │       ├── stream/[sessionId]/route.ts  # SSE流
│   │       ├── status/[sessionId]/route.ts  # 状态查询
│   │       ├── cancel/[sessionId]/route.ts  # 取消任务
│   │       ├── history/route.ts  # 历史记录
│   │       ├── files/[sessionId]/route.ts   # 文件树
│   │       ├── db.ts             # 研究数据库操作
│   │       └── fileManager.ts    # 文件系统管理
│   ├── components/
│   │   └── SessionSidebar.tsx    # 会话侧边栏
│   ├── deepresearch/
│   │   ├── page.tsx              # 深度研究页面
│   │   └── components/
│   │       ├── ChatPanel.tsx
│   │       ├── FileTree.tsx
│   │       ├── ContentViewer.tsx
│   │       ├── ProgressIndicator.tsx
│   │       └── HistoryPanel.tsx
│   ├── research/[sessionId]/
│   │   └── page.tsx              # 研究结果详情页
│   ├── utils/
│   │   ├── loadEnv.ts            # 环境变量加载
│   │   ├── threadId.ts           # 会话ID管理
│   │   └── .env                  # 环境配置（需手动创建）
│   ├── page.tsx                   # 聊天主页面
│   └── layout.tsx                 # 应用布局
├── docs/
│   ├── architecture.md            # 本架构文档
│   ├── deepresearch-requirements.md
│   └── deepresearch-langgraph-implementation.md
├── public/                        # 静态文件及研究输出
│   └── [sessionId]/              # 每个研究会话的输出目录
├── package.json                   # 项目依赖
├── pnpm-lock.yaml                # pnpm锁定文件
├── tsconfig.json                 # TypeScript配置
├── next.config.ts                # Next.js配置
├── postcss.config.mjs            # PostCSS配置
├── eslint.config.mjs             # ESLint配置
├── README.md                     # 项目说明
├── SETUP.md                      # 设置指南
└── chat_history.db               # SQLite数据库（运行时生成）
```

<!-- 来源: 项目目录结构分析 -->

---

## 附录：DeepResearch 状态机详细设计

### 状态转换流程图

```mermaid
graph TB
    START([开始]) --> AnalyzeQuestion[分析问题节点<br/>analyzeQuestionNode]
    AnalyzeQuestion --> GeneratePlan[生成计划节点<br/>generatePlanNode]
    GeneratePlan --> ResearchSection[研究章节节点<br/>researchSectionNode]

    ResearchSection --> CheckContinue{是否还有章节?}
    CheckContinue -->|是| ResearchSection
    CheckContinue -->|否| GenerateReport[生成报告节点<br/>generateReportNode]

    GenerateReport --> END([结束])

    style START fill:#4caf50,stroke:none,color:#fff,rx:20,ry:20
    style END fill:#f44336,stroke:none,color:#fff,rx:20,ry:20
    style AnalyzeQuestion fill:#ba68c8,stroke:none,color:#000,rx:10,ry:10
    style GeneratePlan fill:#ab47bc,stroke:none,color:#000,rx:10,ry:10
    style ResearchSection fill:#9c27b0,stroke:none,color:#000,rx:10,ry:10
    style GenerateReport fill:#8e24aa,stroke:none,color:#000,rx:10,ry:10
    style CheckContinue fill:#ffb74d,stroke:none,color:#000,rx:10,ry:10
```

### 节点职责说明

| 节点名称 | 输入 | 输出 | 工具调用 | 实现位置 |
|---------|------|------|---------|---------|
| **analyzeQuestionNode** | `question` | `analysis` (QuestionAnalysis) | OpenAI LLM, MCP Thinking | `app/agent/deepresearch/nodes/analyzeQuestion.ts` |
| **generatePlanNode** | `analysis` | `plan` (ResearchPlan), `tasks` (ResearchTask[]) | OpenAI LLM, MCP Thinking | `app/agent/deepresearch/nodes/generatePlan.ts` |
| **researchSectionNode** | `tasks[currentTaskIndex]` | `searchResults`, `analysisResults`, `generatedContent` | Tavily, OpenAI LLM, MCP Thinking | `app/agent/deepresearch/nodes/researchSection.ts` |
| **generateReportNode** | `generatedContent[]` | `finalReport`, `generatedFiles[]` | OpenAI LLM, MCP Filesystem | `app/agent/deepresearch/nodes/generateReport.ts` |

<!-- 来源: app/agent/deepresearch/graph.ts, app/agent/deepresearch/nodes/ -->

---

**文档版本**: 1.0.0
**最后更新**: 2025-11-13
**维护者**: Claude Code Assistant
**审核状态**: ✅ 已通过事实验证

<!-- 全文档信息来源已通过HTML注释标注 -->

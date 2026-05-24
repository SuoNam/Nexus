# Nexus

Nexus 是一个全栈设备监控与数据可视化仪表盘项目，拥有极客风格（终端风）的动态用户界面。该项目主要用于实时监控主机（如 RK3528 盒子）的系统状态、网络流量、本地天气等信息，并支持通过串口发送设备唤醒指令。

## 🌟 特性

- **极客风 UI 设计**：基于 Vue 3 + Vite 构建，采用炫酷的终端风格界面，支持键盘方向键与触控滑动平滑切换页面。
- **实时系统监控**：
  - **WebSocket 实时通信** (`server/Network.js`)：每秒高频广播系统 CPU 使用率、内存占用、系统负载，以及特定物理网卡的实时上下行速率。
  - **REST API 服务** (`server/wake_server.py`)：基于 FastAPI 提供系统硬件概览接口。
- **智能天气聚合**：深度集成和风天气 API，自动根据客户端真实 IP 逆向解析地理位置，提供昨日、今日及未来 5 天的全面天气数据。
- **底层硬件控制**：支持通过 USB 串口 (`/dev/ttyUSB0`) 向外部单片机或继电器发送唤醒/控制指令。

## 🛠️ 技术栈

- **前端**：Vue 3, Vite, TypeScript, ECharts (数据展示), Element Plus, Pinia (状态管理), Vue Router
- **后端**：
  - Node.js (原生 WebSocket `ws` 模块)
  - Python 3 (FastAPI, uvicorn, psutil, pyserial, httpx)

## 🚀 快速开始

### 1. 前端服务

```sh
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产环境构建
npm run build
```

### 2. 后端服务

**网络与性能监控服务 (WebSocket):**

```sh
cd server
npm install ws
node Network.js
```
*监听 8081 端口*

**API 与控制服务 (FastAPI):**

```sh
cd server
pip install fastapi uvicorn pyserial psutil httpx
python wake_server.py
```
*监听 8100 端口*

## 📁 核心目录结构

- `src/`: 前端核心源码（包含页面组件、组合式 API、路由和样式配置）
- `server/`: 后端微服务
  - `Network.js`: 基于 Node.js 的高频硬件状态抓取脚本
  - `wake_server.py`: 提供 HTTP 接口的 Python 服务（天气、状态、串口唤醒）
- `public/` & `dist/`: 静态资源及构建产物

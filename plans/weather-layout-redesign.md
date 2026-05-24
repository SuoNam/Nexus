# 天气布局改造方案

## 目标

1. **让天气更醒目** — 天气信息从底部面板提升到时钟区域，与时钟平级展示
2. **今天/明天天气放在时钟左右** — 今天天气在时钟左侧，明天天气在时钟右侧，两者都醒目
3. **后天天气不显示** — 移除后天卡片

---

## 当前布局 (Page1.vue)

```
┌──────────────────────────────────────┐
│         TopCountdownBanner           │
├──────────────────────────────────────┤
│                                      │
│           CenterClock                │
│         (large, centered)            │
│                                      │
├──────────────────────────────────────┤
│  WeatherPanel  │  NetworkRadarPanel  │
│  (left-panel)   │   (right-panel)    │
│  今天/明天/后天  │                    │
└──────────────────────────────────────┘
```

## 目标布局

```
┌──────────────────────────────────────────┐
│            TopCountdownBanner             │
├──────────────────────────────────────────┤
│                                          │
│  [今天天气卡片]    CenterClock    [明天天气卡片] │
│   醒目大卡片       大字时钟        醒目大卡片   │
│                                          │
├──────────────────────────────────────────┤
│  (空/预留)          │  NetworkRadarPanel  │
│                     │                     │
└──────────────────────────────────────────┘
```

---

## 修改方案

### 1. WeatherForecastPanel.vue — 数据提取改造

**改动点：**
- 不再渲染模板 UI（改为只提供数据），改为暴露 `todayWeather` 和 `tomorrowWeather` 两个响应式数据
- 修改 `extractThreeDays` 逻辑：由于后端返回顺序是 `[昨天, 今天, 明天, 后天, ...]`，取 `list[1]` 为今天，`list[2]` 为明天
- 移除后天相关逻辑
- 通过 `defineExpose` 暴露数据给父组件

**关键代码变更：**
```typescript
// 提取今天和明天
const todayWeather = ref<DayWeatherDisplay | null>(null)
const tomorrowWeather = ref<DayWeatherDisplay | null>(null)

function extractTodayAndTomorrow(list: DayWeather[]): { today: DayWeatherDisplay | null, tomorrow: DayWeatherDisplay | null } {
  if (!list?.length) return { today: null, tomorrow: null }
  const todayStr = dayjs().format('YYYY-MM-DD')
  
  const today = list.find(d => d.date === todayStr) || null
  const tomorrow = list.find(d => {
    const diff = dayjs(d.date).diff(dayjs(todayStr), 'day')
    return diff === 1
  }) || null
  
  return {
    today: today ? { ...today, label: '今天' } : null,
    tomorrow: tomorrow ? { ...tomorrow, label: '明天' } : null,
  }
}

// onMounted 中赋值
const result = extractTodayAndTomorrow(res.data)
todayWeather.value = result.today
tomorrowWeather.value = result.tomorrow

defineExpose({ todayWeather, tomorrowWeather })
```

### 2. CenterClock.vue — 接收天气 props 并渲染

**改动点：**
- 新增 `props`：`todayWeather` 和 `tomorrowWeather`（类型为 `DayWeatherDisplay | null`）
- 布局改为 flex 行：`[今天卡片] [时钟] [明天卡片]`
- 两个卡片都采用醒目风格：大号温度、发光效果、动态呼吸边框
- 时钟保持居中，占据主要空间

**模板结构：**
```html
<div class="clock-row">
  <div class="weather-side weather-today" v-if="todayWeather">
    <div class="ws-label">{{ todayWeather.label }}</div>
    <i :class="`qi-${todayWeather.iconDay}`"></i>
    <div class="ws-temp">{{ todayWeather.tempMax }}°</div>
    <div class="ws-text">{{ todayWeather.text }}</div>
    <div class="ws-detail">{{ todayWeather.tempMin }}° / {{ todayWeather.windDir }} {{ todayWeather.windScale }}级</div>
  </div>
  
  <div class="clock-center">
    {{ currentTime }}
  </div>
  
  <div class="weather-side weather-tomorrow" v-if="tomorrowWeather">
    <div class="ws-label">{{ tomorrowWeather.label }}</div>
    <i :class="`qi-${tomorrowWeather.iconDay}`"></i>
    <div class="ws-temp">{{ tomorrowWeather.tempMax }}°</div>
    <div class="ws-text">{{ tomorrowWeather.text }}</div>
    <div class="ws-detail">{{ tomorrowWeather.tempMin }}° / {{ tomorrowWeather.windDir }} {{ tomorrowWeather.windScale }}级</div>
  </div>
</div>
```

### 3. Page1.vue — 布局调整

**改动点：**
- WeatherForecastPanel 不再作为独立面板放在 bottom-section
- 改为通过模板 ref 获取 WeatherForecastPanel 实例，读取其暴露的天气数据
- 将数据通过 props 传递给 CenterClock

**新 Page1.vue 布局：**
```html
<template>
  <div class="terminal-container">
    <TopCountdownBanner />
    
    <!-- 时钟 + 天气行 -->
    <div class="clock-weather-row">
      <CenterClock 
        :today-weather="todayWeather"
        :tomorrow-weather="tomorrowWeather"
      />
    </div>

    <div class="bottom-section">
      <div class="left-panel" style="flex: 0.8;">
        <!-- 隐藏的 WeatherForecastPanel 只负责数据获取 -->
        <WeatherForecastPanel ref="weatherPanelRef" style="display: none;" />
      </div>
      <NetworkRadarPanel :download-mbps="latestDownloadMBps" :upload-mbps="latestUploadMBps" />
    </div>
  </div>
</template>
```

### 4. 样式设计 — 让天气醒目

**今天卡片 (左侧)：**
- 温度超大：`font-size: clamp(36px, 4vw, 56px)` 暖色发光 (橙黄)
- 天气图标大：`font-size: clamp(40px, 4.5vw, 64px)`
- 呼吸动画边框：`@keyframes glow-breath` 边框颜色在青绿和亮青之间渐变
- 背景渐变：暖色到透明

**明天卡片 (右侧)：**
- 同样醒目，但色调偏冷（蓝紫色系）以示区分
- 温度大：`font-size: clamp(30px, 3.5vw, 48px)`
- 同样有发光效果，但比今天稍弱一点

**时钟居中：**
- 最大字体：`font-size: clamp(64px, 10vw, 150px)`
- 白色发光，主导视觉

---

## 数据流

```
Page1.vue
  │
  ├── 模板 ref → WeatherForecastPanel (隐藏，只负责 API 调用)
  │     └── expose: todayWeather, tomorrowWeather
  │
  ├──→ CenterClock.vue (props: todayWeather, tomorrowWeather)
  │     渲染：[今天卡片] | 时钟 | [明天卡片]
  │
  └──→ NetworkRadarPanel.vue (不变)
  
TopCountdownBanner.vue (不变)
```

---

## 涉及文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/components/WeatherForecastPanel.vue` | 修改 | 数据提取改为今天+明天，移除后天；defineExpose 暴露数据；隐藏 UI |
| `src/components/CenterClock.vue` | 修改 | 新增 props，渲染左右天气卡片 |
| `src/pages/Page1.vue` | 修改 | 布局调整，通过 ref 获取天气数据传递给 CenterClock |
| `src/App.vue` | 修改（样式） | 新增 `.clock-weather-row` 样式，调整布局 |

---

## 实施步骤

1. 修改 `WeatherForecastPanel.vue` — 数据提取改为今天+明天，移除后天，defineExpose 暴露数据
2. 修改 `CenterClock.vue` — 接收 todayWeather/tomorrowWeather props，渲染左右醒目卡片
3. 修改 `Page1.vue` — 布局重构：隐藏 WeatherForecastPanel（仅数据），CenterClock 接收天气 props
4. 调整 `App.vue` 样式 — 新增 `.clock-weather-row` 布局样式，确保整体协调

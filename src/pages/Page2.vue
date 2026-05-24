<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { wake_up } from '@/api/api.ts'
import { useSystemStats } from '@/composables/useSystemStats'

// ── 系统状态 ──────────────────────────────────────────────
const { cpuUsage, loadAvg, memUsage, connected } = useSystemStats()

// 负载百分比（假设以 4 核为基准，超过 4.0 即满格）
const loadPercent = computed(() => Math.min(100, (loadAvg.value / 4) * 100))
const loadColor   = computed(() => {
  if (loadAvg.value < 1.0) return '#00ffa0'
  if (loadAvg.value < 2.5) return '#ffcc00'
  return '#ff4444'
})

// CPU 颜色
const cpuColor = computed(() => {
  if (cpuUsage.value < 50) return '#00ffa0'
  if (cpuUsage.value < 80) return '#ffcc00'
  return '#ff4444'
})

// 内存颜色
const memColor = computed(() => {
  if (memUsage.value < 60) return '#00ffa0'
  if (memUsage.value < 85) return '#ffcc00'
  return '#ff4444'
})

// ── 唤醒 ──────────────────────────────────────────────────
async function wake() {
  const ok = await wake_up()
  ElMessage[ok ? 'success' : 'error'](ok ? '唤醒成功！' : '唤醒失败！')
}
</script>

<template>
  <div class="terminal-container">
    <!-- 顶部：设备名录 -->
    <div class="top-banner page2-banner">
      <span class="banner-title">设备名录</span>
      <span class="ws-status" :class="{ online: connected }">
        {{ connected ? '● 实时' : '○ 离线' }}
      </span>
    </div>

    <!-- 中间：系统状态面板（尽量高且居中） -->
    <div class="sys-stats-wrapper">
      <div class="sys-stats-card">
        <div class="stats-title">本机系统状态</div>

        <!-- 负载率 -->
        <div class="stat-block">
          <div class="stat-header">
            <span class="stat-name">系统负载 <span class="stat-sub">(1 min avg)</span></span>
            <span class="stat-val" :style="{ color: loadColor }">{{ loadAvg.toFixed(2) }}</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: loadPercent + '%', background: loadColor }"
            />
          </div>
          <div class="stat-hint">
            <span>0</span><span>1.0 (单核满负荷)</span><span>4.0+</span>
          </div>
        </div>

        <!-- CPU 使用率 -->
        <div class="stat-block">
          <div class="stat-header">
            <span class="stat-name">CPU 使用率</span>
            <span class="stat-val" :style="{ color: cpuColor }">{{ cpuUsage.toFixed(1) }} %</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: cpuUsage + '%', background: cpuColor }"
            />
          </div>
          <div class="stat-hint"><span>0 %</span><span>50 %</span><span>100 %</span></div>
        </div>

        <!-- 内存使用率 -->
        <div class="stat-block">
          <div class="stat-header">
            <span class="stat-name">内存使用率</span>
            <span class="stat-val" :style="{ color: memColor }">{{ memUsage.toFixed(1) }} %</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: memUsage + '%', background: memColor }"
            />
          </div>
          <div class="stat-hint"><span>0 %</span><span>60 %</span><span>100 %</span></div>
        </div>

        <div v-if="!connected" class="no-signal">
          ⚠ 无法连接本地监控服务（ws://localhost:8081），请确认 server/Network.js 已启动
        </div>
      </div>
    </div>

    <!-- 底部：唤醒 + 占位面板 -->
    <div class="bottom-section">
      <div class="left-panel" style="border-color: #ff6600;">
        <div class="panel-title" style="color: #ff6600; text-shadow: 0 0 5px #ff6600;">
          唤醒
        </div>
        <div class="device-item">
          <el-button @click="wake()">联想 greek pro G5000</el-button>
        </div>
      </div>

      <div class="right-panel">
        <div class="chart-label" style="top: 8%; color: #444;">NEXUS · 设备管理</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部 banner */
.page2-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-direction: row;
  padding-top: clamp(8px, 1vh, 12px);
  padding-bottom: clamp(8px, 1vh, 12px);
}

.banner-title {
  font-size: clamp(16px, 2vw, 26px);
  font-weight: 700;
  letter-spacing: 4px;
}

.ws-status {
  font-size: clamp(10px, 0.85vw, 13px);
  color: rgba(120, 120, 120, 0.8);
  font-weight: 400;
  letter-spacing: 0.5px;
  transition: color 0.4s;
}

.ws-status.online {
  color: rgba(0, 255, 160, 0.85);
  text-shadow: 0 0 8px rgba(0, 255, 160, 0.4);
}

/* ── 中间面板 ────────────────────────────── */
.sys-stats-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(8px, 1.5vh, 20px) clamp(12px, 2vw, 32px);
  min-height: 0;
}

.sys-stats-card {
  width: 100%;
  max-width: 860px;
  background: linear-gradient(
    160deg,
    rgba(0, 200, 255, 0.05) 0%,
    rgba(0, 0, 0, 0.0) 60%
  );
  border: 1px solid rgba(0, 200, 255, 0.2);
  box-shadow:
    0 0 0 1px rgba(0, 200, 255, 0.06),
    0 0 50px rgba(0, 200, 255, 0.07),
    inset 0 0 30px rgba(0, 200, 255, 0.04);
  border-radius: 18px;
  padding: clamp(22px, 3.5vh, 44px) clamp(24px, 4vw, 56px);
  backdrop-filter: blur(12px);
}

.stats-title {
  text-align: center;
  font-size: clamp(13px, 1.2vw, 18px);
  color: rgba(0, 220, 255, 0.75);
  letter-spacing: 3px;
  margin-bottom: clamp(20px, 3.5vh, 40px);
  text-shadow: 0 0 14px rgba(0, 200, 255, 0.3);
  font-weight: 700;
}

/* ── 每一项指标 ───────────────────────────── */
.stat-block {
  margin-bottom: clamp(18px, 3vh, 36px);
}

.stat-block:last-of-type {
  margin-bottom: 0;
}

.stat-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: clamp(6px, 1vh, 10px);
}

.stat-name {
  font-size: clamp(12px, 1.05vw, 16px);
  color: rgba(200, 230, 255, 0.85);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.stat-sub {
  font-size: 0.78em;
  color: rgba(200, 230, 255, 0.45);
  font-weight: 400;
  margin-left: 4px;
}

.stat-val {
  font-size: clamp(14px, 1.4vw, 22px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px currentColor;
  letter-spacing: 0.5px;
  transition: color 0.4s;
}

/* 进度条轨道 */
.progress-track {
  width: 100%;
  height: clamp(8px, 1.1vh, 14px);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease, background 0.4s ease;
  box-shadow: 0 0 10px currentColor;
  min-width: 2px;
}

/* 刻度提示 */
.stat-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: clamp(9px, 0.7vw, 11px);
  color: rgba(200, 220, 255, 0.28);
  letter-spacing: 0.2px;
}

/* 无信号提示 */
.no-signal {
  margin-top: clamp(16px, 2.5vh, 28px);
  text-align: center;
  font-size: clamp(10px, 0.85vw, 13px);
  color: rgba(255, 180, 60, 0.6);
  border: 1px dashed rgba(255, 140, 40, 0.25);
  border-radius: 8px;
  padding: 8px 12px;
  letter-spacing: 0.3px;
}
</style>

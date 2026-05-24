<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import Page1 from '@/pages/Page1.vue'
import Page2 from '@/pages/Page2.vue'

const pages = [Page1, Page2]
const activeIndex = ref(0)

const canPrev = computed(() => activeIndex.value > 0)
const canNext = computed(() => activeIndex.value < pages.length - 1)

const nextPage = () => {
  if (canNext.value) activeIndex.value++
}

const prevPage = () => {
  if (canPrev.value) activeIndex.value--
}

let touchStartX = 0
let touchStartY = 0

const onTouchStart = (e: TouchEvent) => {
  const t = e.touches.item(0)
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
}

const onTouchEnd = (e: TouchEvent) => {
  const t = e.changedTouches.item(0)
  if (!t) return
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY

  // 横向滑动阈值：更偏“右滑/右箭头切页”
  if (Math.abs(dx) < 60) return
  if (Math.abs(dy) > 80) return

  // 右滑（dx>0） -> 切换到后续页面
  if (dx > 0) nextPage()
  else prevPage()
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') nextPage()
  if (e.key === 'ArrowLeft') prevPage()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="app-shell" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <div class="page-viewport">
      <div
        class="page-track"
        :style="{ transform: `translateX(-${activeIndex * 100}vw)` }"
      >
        <div v-for="(PageComp, idx) in pages" :key="idx" class="page">
          <component :is="PageComp" />
        </div>
      </div>
    </div>

    <button
      class="nav-button nav-left"
      @click="prevPage"
      :disabled="!canPrev"
      aria-label="上一页"
    >
      ‹
    </button>
    <button
      class="nav-button nav-right"
      @click="nextPage"
      :disabled="!canNext"
      aria-label="下一页"
    >
      ›
    </button>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #05070b;
  overflow: hidden;
}

/* 页面切换（单页应用） */
.app-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
  color: rgba(255, 255, 255, 0.88);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(1200px 800px at 30% 20%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(900px 700px at 70% 65%, rgba(255, 102, 0, 0.10), transparent 55%),
    radial-gradient(700px 500px at 60% 20%, rgba(0, 255, 0, 0.07), transparent 55%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.85) 100%);
  filter: saturate(1.1);
}

.app-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  background:
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08) 0px,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 2px,
      transparent 6px
    );
  mix-blend-mode: overlay;
}

.page-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.page-track {
  width: 100%;
  height: 100%;
  display: flex;
  transition: transform 0.35s ease;
  will-change: transform;
}

.page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
}

/* 页面内容容器（Page1/Page2 复用的终端风） */
.terminal-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: clamp(14px, 2.2vw, 24px);
  background: radial-gradient(circle at center, rgba(20, 24, 32, 0.95) 0%, rgba(5, 7, 11, 0.95) 70%);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  position: relative;
  z-index: 1;
}

.top-banner {
  width: 100%;
  text-align: center;
  color: rgba(255, 190, 120, 0.95);
  font-size: clamp(14px, 1.7vw, 22px);
  font-weight: 700;
  padding: clamp(10px, 1.3vh, 14px) clamp(12px, 1.2vw, 18px);
  border: 1px solid rgba(255, 140, 60, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 102, 0, 0.10),
    0 0 30px rgba(255, 102, 0, 0.18),
    inset 0 0 18px rgba(255, 102, 0, 0.08);
  text-shadow: 0 0 14px rgba(255, 102, 0, 0.35);
  letter-spacing: 1.2px;
  border-radius: 12px;
  margin-bottom: clamp(10px, 2vh, 18px);
  background: linear-gradient(180deg, rgba(255, 102, 0, 0.10) 0%, rgba(0, 0, 0, 0.0) 100%);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top-banner .banner-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-section {
  height: clamp(280px, 38vh, 460px);
  display: flex;
  gap: clamp(12px, 1.6vw, 20px);
}

.left-panel {
  flex: 1;
  border: 1px solid rgba(0, 255, 160, 0.35);
  background: linear-gradient(180deg, rgba(0, 255, 160, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
  box-shadow:
    0 0 0 1px rgba(0, 255, 160, 0.10),
    0 0 28px rgba(0, 255, 160, 0.08),
    inset 0 0 24px rgba(0, 255, 160, 0.06);
  padding: clamp(14px, 1.8vw, 22px);
  border-radius: 14px;
  backdrop-filter: blur(10px);
}

.panel-title {
  color: rgba(0, 255, 200, 0.9);
  font-size: clamp(12px, 1.05vw, 16px);
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 0 10px rgba(0, 255, 200, 0.25);
  letter-spacing: 0.6px;
}

.device-item {
  color: rgba(185, 255, 220, 0.92);
  font-size: clamp(11px, 0.95vw, 14px);
  margin-bottom: 10px;
  opacity: 0.95;
  line-height: 1.35;
}

.right-panel {
  flex: 1.5;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.015) 100%);
  border-radius: 14px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 30px rgba(0, 255, 255, 0.05),
    inset 0 0 20px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.chart-label {
  position: absolute;
  left: 10px;
  color: rgba(210, 220, 255, 0.55);
  font-size: clamp(10px, 0.8vw, 12px);
  z-index: 10;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
}

.chart-value {
  position: absolute;
  right: 14px;
  transform: translateY(1px);
  color: rgba(230, 240, 255, 0.70);
  font-size: clamp(10px, 0.85vw, 12px);
  z-index: 10;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.65);
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.nav-button {
  position: absolute;
  bottom: 3vh;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.18);
  background: rgba(10, 12, 18, 0.55);
  color: rgba(120, 255, 255, 0.95);
  font-size: 26px;
  line-height: 42px;
  cursor: pointer;
  user-select: none;
  box-shadow:
    0 0 0 1px rgba(0, 255, 255, 0.05),
    0 12px 35px rgba(0, 0, 0, 0.35),
    0 0 22px rgba(0, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease,
    opacity 0.12s ease;
}

.nav-left {
  left: 3vw;
}

.nav-right {
  right: 3vw;
}

.nav-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(0, 255, 255, 0.32);
  box-shadow:
    0 0 0 1px rgba(0, 255, 255, 0.08),
    0 14px 42px rgba(0, 0, 0, 0.40),
    0 0 26px rgba(0, 255, 255, 0.14);
}

.nav-button:active:not(:disabled) {
  transform: translateY(0px) scale(0.98);
}

.nav-button:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (max-width: 900px) {
  .bottom-section {
    flex-direction: column;
    height: auto;
  }

  .terminal-container {
    overflow: hidden;
  }

  .nav-button {
    bottom: 2vh;
  }
}
</style>

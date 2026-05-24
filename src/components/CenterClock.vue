<script setup lang="ts">
import dayjs from 'dayjs'
import { onMounted, onUnmounted, ref } from 'vue'

/** 天气数据类型（与 WeatherForecastPanel 保持一致） */
interface DayWeatherDisplay {
  date: string
  text: string
  tempMax: string
  tempMin: string
  windDir: string
  windScale: string
  iconDay: string
  label: string
}

const props = defineProps<{
  todayWeather: DayWeatherDisplay | null
  tomorrowWeather: DayWeatherDisplay | null
}>()

const currentTime = ref('')

const updateTime = () => {
  currentTime.value = dayjs().format('HH:mm:ss')
}

let timer: number | null = null

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})
</script>

<template>
  <div class="clock-row">
    <!-- ===== 左侧：今天天气 ===== -->
    <div class="weather-side weather-today" v-if="todayWeather">
      <div class="ws-label">{{ todayWeather.label }}</div>
      <i :class="`qi-${todayWeather.iconDay}`" class="ws-icon"></i>
      <div class="ws-text">{{ todayWeather.text }}</div>
      <div class="ws-temps">
        <div class="ws-temp-max">{{ todayWeather.tempMax }}°</div>
        <div class="ws-temp-divider">/</div>
        <div class="ws-temp-min">{{ todayWeather.tempMin }}°</div>
      </div>
      <div class="ws-detail">
        {{ todayWeather.windDir }} {{ todayWeather.windScale }}级
      </div>
    </div>

    <!-- 今天天气 loading 占位 -->
    <div class="weather-side weather-today weather-placeholder" v-else>
      <div class="ws-label">--</div>
      <div class="ws-icon-placeholder"></div>
      <div class="ws-temps">
        <div class="ws-temp-max">--</div>
      </div>
      <div class="ws-text">加载中</div>
    </div>

    <!-- ===== 中间：时钟 ===== -->
    <div class="clock-center">
      {{ currentTime }}
    </div>

    <!-- ===== 右侧：明天天气 ===== -->
    <div class="weather-side weather-tomorrow" v-if="tomorrowWeather">
      <div class="ws-label">{{ tomorrowWeather.label }}</div>
      <i :class="`qi-${tomorrowWeather.iconDay}`" class="ws-icon"></i>
      <div class="ws-text">{{ tomorrowWeather.text }}</div>
      <div class="ws-temps">
        <div class="ws-temp-max">{{ tomorrowWeather.tempMax }}°</div>
        <div class="ws-temp-divider">/</div>
        <div class="ws-temp-min">{{ tomorrowWeather.tempMin }}°</div>
      </div>
      <div class="ws-detail">
        {{ tomorrowWeather.windDir }} {{ tomorrowWeather.windScale }}级
      </div>
    </div>

    <!-- 明天天气 loading 占位 -->
    <div class="weather-side weather-tomorrow weather-placeholder" v-else>
      <div class="ws-label">--</div>
      <div class="ws-icon-placeholder"></div>
      <div class="ws-temps">
        <div class="ws-temp-max">--</div>
      </div>
      <div class="ws-text">加载中</div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 整体行布局 ===== */
.clock-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: clamp(20px, 3vw, 50px);
}

/* ===== 天气侧边卡片（拉宽） ===== */
.weather-side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(4px, 0.5vh, 10px);
  padding: clamp(14px, 2vh, 28px) clamp(24px, 3vw, 48px);
  border-radius: 16px;
  min-width: clamp(160px, 18vw, 260px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.weather-side:hover {
  transform: translateY(-3px);
}

/* ===== 今天卡片（暖色醒目） ===== */
.weather-today {
  border: 1.5px solid rgba(255, 180, 60, 0.4);
  background: linear-gradient(160deg, rgba(255, 160, 40, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow:
    0 0 0 1px rgba(255, 180, 60, 0.10),
    0 0 30px rgba(255, 160, 40, 0.10),
    inset 0 0 24px rgba(255, 160, 40, 0.06);
  animation: glow-today 3s ease-in-out infinite;
}

@keyframes glow-today {
  0%, 100% {
    border-color: rgba(255, 180, 60, 0.4);
    box-shadow:
      0 0 0 1px rgba(255, 180, 60, 0.10),
      0 0 30px rgba(255, 160, 40, 0.10),
      inset 0 0 24px rgba(255, 160, 40, 0.06);
  }
  50% {
    border-color: rgba(255, 200, 100, 0.7);
    box-shadow:
      0 0 0 1px rgba(255, 200, 100, 0.20),
      0 0 45px rgba(255, 160, 40, 0.20),
      inset 0 0 32px rgba(255, 160, 40, 0.10);
  }
}

.weather-today .ws-label {
  color: rgba(255, 200, 100, 0.95);
  text-shadow: 0 0 12px rgba(255, 180, 60, 0.35);
}

.weather-today .ws-temp-max {
  color: rgba(255, 220, 120, 0.98);
  text-shadow:
    0 0 20px rgba(255, 180, 60, 0.35),
    0 0 40px rgba(255, 160, 40, 0.15);
}

.weather-today .ws-temp-min {
  color: rgba(255, 200, 150, 0.85);
  text-shadow:
    0 0 14px rgba(255, 180, 60, 0.20),
    0 0 28px rgba(255, 160, 40, 0.08);
}

.weather-today .ws-icon {
  filter: drop-shadow(0 0 12px rgba(255, 180, 60, 0.30));
}

/* ===== 明天卡片（冷色醒目） ===== */
.weather-tomorrow {
  border: 1.5px solid rgba(80, 180, 255, 0.35);
  background: linear-gradient(160deg, rgba(60, 160, 255, 0.10) 0%, rgba(255, 255, 255, 0.03) 100%);
  box-shadow:
    0 0 0 1px rgba(80, 180, 255, 0.08),
    0 0 30px rgba(60, 160, 255, 0.08),
    inset 0 0 24px rgba(60, 160, 255, 0.05);
  animation: glow-tomorrow 3s ease-in-out infinite;
}

@keyframes glow-tomorrow {
  0%, 100% {
    border-color: rgba(80, 180, 255, 0.35);
    box-shadow:
      0 0 0 1px rgba(80, 180, 255, 0.08),
      0 0 30px rgba(60, 160, 255, 0.08),
      inset 0 0 24px rgba(60, 160, 255, 0.05);
  }
  50% {
    border-color: rgba(120, 210, 255, 0.6);
    box-shadow:
      0 0 0 1px rgba(120, 210, 255, 0.18),
      0 0 45px rgba(60, 160, 255, 0.18),
      inset 0 0 32px rgba(60, 160, 255, 0.09);
  }
}

.weather-tomorrow .ws-label {
  color: rgba(120, 210, 255, 0.9);
  text-shadow: 0 0 12px rgba(80, 180, 255, 0.30);
}

.weather-tomorrow .ws-temp-max {
  color: rgba(160, 220, 255, 0.95);
  text-shadow:
    0 0 20px rgba(80, 180, 255, 0.30),
    0 0 40px rgba(60, 160, 255, 0.12);
}

.weather-tomorrow .ws-temp-min {
  color: rgba(140, 200, 240, 0.80);
  text-shadow:
    0 0 14px rgba(80, 180, 255, 0.18),
    0 0 28px rgba(60, 160, 255, 0.06);
}

.weather-tomorrow .ws-icon {
  filter: drop-shadow(0 0 12px rgba(80, 180, 255, 0.25));
}

/* ===== 占位样式 ===== */
.weather-placeholder {
  opacity: 0.4;
  border-style: dashed;
  animation: none;
}

.weather-placeholder:hover {
  transform: none;
}

.ws-icon-placeholder {
  width: clamp(32px, 3.5vw, 48px);
  height: clamp(32px, 3.5vw, 48px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

/* ===== 天气卡片内各字段 ===== */
.ws-label {
  font-size: clamp(14px, 1.3vw, 20px);
  font-weight: 800;
  letter-spacing: 1px;
}

.ws-icon {
  font-size: clamp(36px, 4vw, 60px);
  line-height: 1;
  margin: clamp(2px, 0.3vh, 6px) 0;
}

.ws-text {
  font-size: clamp(13px, 1.1vw, 17px);
  font-weight: 600;
  color: rgba(220, 240, 255, 0.9);
}

/* ===== 最高/最低温并排显示 ===== */
.ws-temps {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: clamp(4px, 0.5vw, 10px);
  line-height: 1;
}

.ws-temp-max {
  font-size: clamp(36px, 4.2vw, 62px);
  font-weight: 800;
  letter-spacing: 1px;
}

.ws-temp-min {
  font-size: clamp(28px, 3.2vw, 48px);
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.85;
}

.ws-temp-divider {
  font-size: clamp(22px, 2.5vw, 36px);
  font-weight: 300;
  opacity: 0.35;
}

.ws-detail {
  font-size: clamp(11px, 0.85vw, 14px);
  color: rgba(200, 220, 240, 0.6);
  white-space: nowrap;
}

/* ===== 时钟居中 ===== */
.clock-center {
  flex: 0 0 auto;
  font-size: clamp(64px, 12vw, 170px);
  font-weight: 800;
  color: rgba(255, 255, 255, 0.96);
  text-shadow:
    0 0 36px rgba(255, 255, 255, 0.14),
    0 0 18px rgba(255, 255, 255, 0.16),
    0 0 6px rgba(255, 255, 255, 0.18);
  letter-spacing: clamp(2px, 0.55vw, 6px);
  filter: drop-shadow(0 12px 45px rgba(0, 0, 0, 0.35));
  line-height: 1;
}
</style>

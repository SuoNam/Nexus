<script setup lang="ts">
import { onMounted } from 'vue'

import { useNetworkSpeed } from '@/composables/useNetworkSpeed'
import { useWeatherStore } from '@/stores/weather'
import CenterClock from '@/components/CenterClock.vue'
import WeatherForecastPanel from '@/components/WeatherForecastPanel.vue'
import NetworkRadarPanel from '@/components/NetworkRadarPanel.vue'
import TopCountdownBanner from '@/components/TopCountdownBanner.vue'

const { latestDownloadMBps, latestUploadMBps, start } = useNetworkSpeed()

/** 直接从 store 获取天气数据（响应式） */
const weatherStore = useWeatherStore()

onMounted(() => {
  start()
})
</script>

<template>
  <div class="terminal-container">
    <TopCountdownBanner />

    <!-- 时钟 + 天气行 -->
    <div class="clock-weather-row">
      <CenterClock
        :today-weather="weatherStore.todayWeather"
        :tomorrow-weather="weatherStore.tomorrowWeather"
      />
    </div>

    <div class="bottom-section">
      <!-- 隐藏的 WeatherForecastPanel：只负责获取天气数据 -->
      <WeatherForecastPanel />
      <NetworkRadarPanel :download-mbps="latestDownloadMBps" :upload-mbps="latestUploadMBps" />
    </div>
  </div>
</template>

<style scoped>
.clock-weather-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: clamp(4px, 0.8vh, 10px);
}
</style>

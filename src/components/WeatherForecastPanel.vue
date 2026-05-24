<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useWeatherStore } from '@/stores/weather'

const weatherStore = useWeatherStore()

onMounted(async () => {
  // 首次拉取数据
  await weatherStore.refresh()
  // 启动每 30 分钟自动刷新
  weatherStore.startAutoRefresh()
})

onUnmounted(() => {
  // 组件卸载时停止定时器
  weatherStore.stopAutoRefresh()
})

/** 暴露数据给父组件 */
defineExpose({
  todayWeather: weatherStore.todayWeather,
  tomorrowWeather: weatherStore.tomorrowWeather,
  loading: weatherStore.loading,
  error: weatherStore.error,
})
</script>

<template>
  <!-- 隐藏的数据获取组件，不渲染任何 UI -->
</template>

<style scoped>
/* 所有样式已迁移到 CenterClock.vue */
</style>

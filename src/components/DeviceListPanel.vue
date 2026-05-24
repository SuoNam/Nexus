<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  downloadMbps: number | null
  uploadMbps: number | null
}>()

const formatSpeed = (mbps: number | null) => {
  if (mbps == null) return '--'
  if (mbps < 1) return `${Math.round(mbps * 1024)} KB/s`
  return `${mbps.toFixed(2)} MB/s`
}

const devices = computed(() => [
  {
    name: 'eth0 (有线) -> 大笔记本',
    battery: '—',
  },
  {
    name: 'wlan0 (无线) -> 移动设备',
    battery: '—',
  },
])
</script>

<template>
  <div class="left-panel">
    <div class="panel-title">[云端服务器中继 - 活动设备]</div>
    <div v-for="dev in devices" :key="dev.name" class="device-item">
      &gt; {{ dev.name }} | 电量: {{ dev.battery }} | 下载: {{ formatSpeed(downloadMbps) }} | 上传:
      {{ formatSpeed(uploadMbps) }}
    </div>
  </div>
</template>


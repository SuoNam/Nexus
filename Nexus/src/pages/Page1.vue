<script setup lang="ts">
import { onMounted } from 'vue'

import { useNetworkSpeed } from '@/composables/useNetworkSpeed'
import CenterClock from '@/components/CenterClock.vue'
import DeviceListPanel from '@/components/DeviceListPanel.vue'
import NetworkRadarPanel from '@/components/NetworkRadarPanel.vue'
import TopCountdownBanner from '@/components/TopCountdownBanner.vue'

const { latestDownloadMBps, latestUploadMBps, start } = useNetworkSpeed()

onMounted(() => {
  start()
})
</script>

<template>
  <div class="terminal-container">
    <TopCountdownBanner />
    <CenterClock />

    <div class="bottom-section">
      <DeviceListPanel :download-mbps="latestDownloadMBps" :upload-mbps="latestUploadMBps" />
      <NetworkRadarPanel :download-mbps="latestDownloadMBps" :upload-mbps="latestUploadMBps" />
    </div>
  </div>
</template>


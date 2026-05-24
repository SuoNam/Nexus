<script setup lang="ts">
import dayjs from 'dayjs'
import { onMounted, onUnmounted, ref } from 'vue'

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
  <div class="center-clock">
    {{ currentTime }}
  </div>
</template>


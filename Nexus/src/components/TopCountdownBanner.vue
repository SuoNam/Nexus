<script setup lang="ts">
import dayjs from 'dayjs'
import { onMounted, onUnmounted, ref } from 'vue'

const countdownStr = ref('')
const cet6CountdownStr = ref('')

const updateCountdown = () => {
  // 设定 2027 届初试预估时间为 2026年12月19日 上午8:30
  const target = dayjs('2026-12-19T08:30:00')
  const now = dayjs()
  const diff = target.diff(now)

  if (diff > 0) {
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const m = Math.floor((diff / 1000 / 60) % 60)
    const s = Math.floor((diff / 1000) % 60)
    countdownStr.value = `${d} 天 ${h} 小时 ${m} 分 ${s} 秒`
  } else {
    countdownStr.value = '考试已开始！保持冷静！'
  }

  // 英语六级：6/13（默认按本地时区 09:00 开始）
  const cet6Target = dayjs('2026-06-13T09:00:00')
  const cet6Diff = cet6Target.diff(now)
  if (cet6Diff > 0) {
    const d = Math.floor(cet6Diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((cet6Diff / (1000 * 60 * 60)) % 24)
    const m = Math.floor((cet6Diff / 1000 / 60) % 60)
    const s = Math.floor((cet6Diff / 1000) % 60)
    cet6CountdownStr.value = `${d} 天 ${h} 小时 ${m} 分 ${s} 秒`
  } else {
    cet6CountdownStr.value = '六级已开始/已结束'
  }
}

let timer: number | null = null

onMounted(() => {
  updateCountdown()
  timer = window.setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})
</script>

<template>
  <div class="top-banner">
    <div class="banner-row">距离 2027 考研初试还有：{{ countdownStr }}</div>
    <div class="banner-row">距离 英语六级 (6/13) 还有：{{ cet6CountdownStr }}</div>
  </div>
</template>


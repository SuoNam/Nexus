<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  downloadMbps: number | null
  uploadMbps: number | null
}>()

const HISTORY_LEN = 60

const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const xAxisData = Array.from({ length: HISTORY_LEN }, () => '')

const dataEth0Down: Array<number | null> = Array.from({ length: HISTORY_LEN }, () => props.downloadMbps ?? null)
const dataEth0Up: Array<number | null> = Array.from({ length: HISTORY_LEN }, () => props.uploadMbps ?? null)
const dataWlanDown: Array<number | null> = Array.from({ length: HISTORY_LEN }, () => props.downloadMbps ?? null)
const dataWlanUp: Array<number | null> = Array.from({ length: HISTORY_LEN }, () => props.uploadMbps ?? null)

let tickTimer: number | null = null
let currentDown: number | null = props.downloadMbps ?? null
let currentUp: number | null = props.uploadMbps ?? null

const formatSpeed = (mbps: number | null) => {
  if (mbps == null) return '--'
  if (mbps < 1) return `${Math.round(mbps * 1024)} KB/s`
  return `${mbps.toFixed(2)} MB/s`
}

const eth0ValueText = computed(() => `↓ ${formatSpeed(props.downloadMbps)}   ↑ ${formatSpeed(props.uploadMbps)}`)
const wlan0ValueText = computed(() => `↓ ${formatSpeed(props.downloadMbps)}   ↑ ${formatSpeed(props.uploadMbps)}`)

watch(
  () => props.downloadMbps,
  (v) => {
    currentDown = v
  },
  { immediate: true },
)

watch(
  () => props.uploadMbps,
  (v) => {
    currentUp = v
  },
  { immediate: true },
)

const yAxisMax = ref(15)

const computeDesiredMax = (value: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return yAxisMax.value
  const next = Math.ceil(value * 1.2 * 10) / 10
  return Math.max(15, next)
}

const resizeHandler = () => {
  chart?.resize()
}

onMounted(() => {
  if (!chartEl.value) return

  chart = echarts.init(chartEl.value, 'dark')

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: [
      { top: '10%', height: '35%', left: 56, right: 16, containLabel: true },
      { top: '55%', height: '35%', left: 56, right: 16, containLabel: true },
    ],
    xAxis: [
      { type: 'category', data: xAxisData, gridIndex: 0, show: false },
      { type: 'category', data: xAxisData, gridIndex: 1, show: false },
    ],
    yAxis: [
      {
        type: 'value',
        gridIndex: 0,
        show: true,
        max: yAxisMax.value,
        name: 'MB/s',
        nameGap: 10,
        nameTextStyle: { color: 'rgba(210,220,255,0.55)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(210,220,255,0.55)',
          fontSize: 11,
          formatter: (v: number) => (Number.isFinite(v) ? `${v}` : ''),
        },
        splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      {
        type: 'value',
        gridIndex: 1,
        show: true,
        max: yAxisMax.value,
        name: 'MB/s',
        nameGap: 10,
        nameTextStyle: { color: 'rgba(210,220,255,0.55)', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(210,220,255,0.55)',
          fontSize: 11,
          formatter: (v: number) => (Number.isFinite(v) ? `${v}` : ''),
        },
        splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
    ],
    series: [
      {
        name: 'eth0 下行',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: dataEth0Down,
        smooth: true,
        itemStyle: { color: '#00ffff' },
        areaStyle: { color: 'rgba(0,255,255,0.1)' },
      },
      {
        name: 'eth0 上行',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: dataEth0Up,
        smooth: true,
        itemStyle: { color: '#ff8800' },
      },
      {
        name: 'wlan0 下行',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: dataWlanDown,
        smooth: true,
        itemStyle: { color: '#00ffff' },
        areaStyle: { color: 'rgba(0,255,255,0.1)' },
      },
      {
        name: 'wlan0 上行',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: dataWlanUp,
        smooth: true,
        itemStyle: { color: '#ff8800' },
      },
    ],
  }

  chart.setOption(option)
  window.addEventListener('resize', resizeHandler)

  tickTimer = window.setInterval(() => {
    const nextDown = typeof currentDown === 'number' ? currentDown : null
    const nextUp = typeof currentUp === 'number' ? currentUp : null

    dataEth0Down.shift()
    dataEth0Down.push(nextDown)
    dataEth0Up.shift()
    dataEth0Up.push(nextUp)
    dataWlanDown.shift()
    dataWlanDown.push(nextDown)
    dataWlanUp.shift()
    dataWlanUp.push(nextUp)

    const candidateMax = Math.max(nextDown ?? 0, nextUp ?? 0)
    const desiredMax = computeDesiredMax(candidateMax)
    // 尽量少更新 y 轴，避免每秒重新重算
    if (desiredMax > yAxisMax.value * 1.05) yAxisMax.value = desiredMax

    chart?.setOption({
      yAxis: [{ max: yAxisMax.value }, { max: yAxisMax.value }],
      series: [
        { data: dataEth0Down },
        { data: dataEth0Up },
        { data: dataWlanDown },
        { data: dataWlanUp },
      ],
    })
  }, 1000)
})

onUnmounted(() => {
  if (tickTimer != null) window.clearInterval(tickTimer)
  window.removeEventListener('resize', resizeHandler)
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="right-panel">
    <div class="chart-label" style="top: 2%;">
      本地有线网络 (eth0 -> 大笔记本) &nbsp;&nbsp;<span style="color: #00ffff;">■ 下行</span>
      <span style="color: #ff8800;">■ 上行</span>
    </div>
    <div class="chart-value" style="top: 2%;">{{ eth0ValueText }}</div>
    <div class="chart-label" style="top: 48%;">无线热点网络 (wlan0 -> 移动设备)</div>
    <div class="chart-value" style="top: 48%;">{{ wlan0ValueText }}</div>
    <div
      ref="chartEl"
      class="radar-chart"
      id="radar-chart"
      style="width: 100%; height: 100%;"
    ></div>
  </div>
</template>


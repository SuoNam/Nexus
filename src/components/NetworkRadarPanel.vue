<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, computed } from 'vue'

const HISTORY_LEN = 60
const chartEl = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

// 核心数据状态：实时 MB/s 数值
const wiredDown = ref(0)
const wiredUp = ref(0)
const hotspotDown = ref(0)
const hotspotUp = ref(0)

// 历史数据数组（用于画折线）
const dataWiredDown = Array.from({ length: HISTORY_LEN }, () => 0)
const dataWiredUp = Array.from({ length: HISTORY_LEN }, () => 0)
const dataHotspotDown = Array.from({ length: HISTORY_LEN }, () => 0)
const dataHotspotUp = Array.from({ length: HISTORY_LEN }, () => 0)

const xAxisData = Array.from({ length: HISTORY_LEN }, () => '')

// 格式化文字显示（MB/s 或 KB/s）
const formatSpeed = (mbps: number) => {
  if (mbps < 1) return `${Math.round(mbps * 1024)} KB/s`
  return `${mbps.toFixed(2)} MB/s`
}

const wiredValueText = computed(() => `↓ ${formatSpeed(wiredDown.value)}   ↑ ${formatSpeed(wiredUp.value)}`)
const hotspotValueText = computed(() => `↓ ${formatSpeed(hotspotDown.value)}   ↑ ${formatSpeed(hotspotUp.value)}`)

onMounted(() => {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value, 'dark')

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    grid: [
      { top: '10%', height: '35%', left: 60, right: 20, containLabel: true },
      { top: '55%', height: '35%', left: 60, right: 20, containLabel: true },
    ],
    xAxis: [
      { type: 'category', data: xAxisData, gridIndex: 0, show: false },
      { type: 'category', data: xAxisData, gridIndex: 1, show: false },
    ],
    yAxis: [
      {
        type: 'value', gridIndex: 0, name: 'MB/s',
        splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        min: 0, max: (v) => Math.max(10, Math.ceil(v.max * 1.2)) // 动态缩放，保底10MB/s
      },
      {
        type: 'value', gridIndex: 1, name: 'MB/s',
        splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        min: 0, max: (v) => Math.max(10, Math.ceil(v.max * 1.2))
      },
    ],
    series: [
      { name: '有线下行', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: dataWiredDown, smooth: true, itemStyle: { color: '#00ffff' }, areaStyle: { color: 'rgba(0,255,255,0.1)' } },
      { name: '有线上行', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: dataWiredUp, smooth: true, itemStyle: { color: '#ff8800' } },
      { name: '热点下行', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dataHotspotDown, smooth: true, itemStyle: { color: '#00ffff' }, areaStyle: { color: 'rgba(0,255,255,0.1)' } },
      { name: '热点上行', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dataHotspotUp, smooth: true, itemStyle: { color: '#ff8800' } },
    ],
  }
  chart.setOption(option)

  // 通过 nginx 反代 /ws，自动适配任意部署地址
  const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${wsProto}//${location.host}/ws`)
  ws.onmessage = (event) => {
    const res = JSON.parse(event.data)
    
    // 更新实时数值（用于文字显示）
    wiredDown.value = res.wiredDown; wiredUp.value = res.wiredUp
    hotspotDown.value = res.hotspotDown; hotspotUp.value = res.hotspotUp

    // 滚动更新数组数据（用于画图）
    dataWiredDown.shift(); dataWiredDown.push(res.wiredDown)
    dataWiredUp.shift();   dataWiredUp.push(res.wiredUp)
    dataHotspotDown.shift(); dataHotspotDown.push(res.hotspotDown)
    dataHotspotUp.shift();   dataHotspotUp.push(res.hotspotUp)

    // 刷新图表
    chart?.setOption({
      series: [
        { data: dataWiredDown }, { data: dataWiredUp },
        { data: dataHotspotDown }, { data: dataHotspotUp }
      ]
    })
  }

  window.addEventListener('resize', () => chart?.resize())
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<template>
  <div class="right-panel" style="position: relative; width: 100%; height: 100%;">
    <div style="position: absolute; top: 2%; left: 10px; color: #888; font-size: 12px; z-index: 10;">
      笔记本有线  <span style="color:#00ffff; margin-left:10px;">■ 下载</span> <span style="color:#ff8800;">■ 上传</span>
    </div>
    <div style="position: absolute; top: 2%; right: 20px; color: #00ffff; font-family: monospace; z-index: 10;">
      {{ wiredValueText }}
    </div>

    <div style="position: absolute; top: 48%; left: 10px; color: #888; font-size: 12px; z-index: 10;">
      手机热点 
    </div>
    <div style="position: absolute; top: 48%; right: 20px; color: #00ffff; font-family: monospace; z-index: 10;">
      {{ hotspotValueText }}
    </div>

    <div ref="chartEl" style="width: 100%; height: 100%;"></div>
  </div>
</template>
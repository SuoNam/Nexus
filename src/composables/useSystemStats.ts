import { onMounted, onUnmounted, ref } from 'vue'

export function useSystemStats() {
  const cpuUsage = ref<number>(0)   // 0-100 %
  const loadAvg = ref<number>(0)    // 1-min load average
  const memUsage = ref<number>(0)   // 0-100 %
  const connected = ref(false)

  let ws: WebSocket | null = null

  const connect = () => {
    try {
      const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${wsProto}//${location.host}/ws`)

      ws.onopen = () => {
        connected.value = true
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string)
          if (data.cpuUsage !== undefined) cpuUsage.value = data.cpuUsage
          if (data.loadAvg  !== undefined) loadAvg.value  = data.loadAvg
          if (data.memUsage !== undefined) memUsage.value = data.memUsage
        } catch {
          // 忽略解析错误
        }
      }

      ws.onclose = () => {
        connected.value = false
        ws = null
      }

      ws.onerror = () => {
        connected.value = false
      }
    } catch {
      connected.value = false
    }
  }

  const disconnect = () => {
    ws?.close()
    ws = null
    connected.value = false
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return { cpuUsage, loadAvg, memUsage, connected }
}

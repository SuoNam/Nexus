import { onUnmounted, ref } from 'vue'

declare global {
  interface Navigator {
    connection?: {
      downlink?: number // Mbps
      effectiveType?: string
      rtt?: number
    }
  }
}

type DownloadSource = 'estimate' | 'download-test'
type UploadSource = 'upload-test' | 'unavailable'

const DOWNLOAD_TEST_PATH = '/favicon.ico'
// CORS 允许的公开回显接口（用于测上传速度；若失败则不填充假数据）
const UPLOAD_ECHO_URL = 'https://postman-echo.com/post'

export function useNetworkSpeed() {
  // 单位：MB/s（十进制 1MB = 1e6 bytes）
  const latestDownloadMBps = ref<number | null>(null)
  const latestUploadMBps = ref<number | null>(null)

  const downloadSource = ref<DownloadSource>('estimate')
  const uploadSource = ref<UploadSource>('unavailable')

  let downloadTimer: number | null = null
  let uploadTimer: number | null = null
  let downloadInFlight = false
  let uploadInFlight = false

  const updateFromNavigatorConnection = () => {
    const downlinkMbps = navigator.connection?.downlink
    if (typeof downlinkMbps === 'number' && downlinkMbps > 0) {
      // Mbps -> MB/s: 8 bits per byte
      latestDownloadMBps.value = downlinkMbps / 8
      downloadSource.value = 'estimate'
    }
  }

  const runDownloadTest = async () => {
    if (downloadInFlight) return
    downloadInFlight = true

    try {
      const url = `${DOWNLOAD_TEST_PATH}?ts=${Date.now()}`
      const start = performance.now()
      const res = await fetch(url, { cache: 'no-store' })
      const buf = await res.arrayBuffer()
      const elapsedSec = (performance.now() - start) / 1000
      if (!res.ok || elapsedSec <= 0) return

      const bytes = buf.byteLength
      const mbps = bytes / elapsedSec / 1e6
      if (Number.isFinite(mbps) && mbps >= 0) {
        latestDownloadMBps.value = mbps
        downloadSource.value = 'download-test'
      }
    } catch {
      // 不填充假数据：下载测试失败时保留旧值或维持为 null
    } finally {
      downloadInFlight = false
    }
  }

  const runUploadTest = async () => {
    if (uploadInFlight) return
    uploadInFlight = true

    try {
      const sizeBytes = 64 * 1024
      const blob = new Blob([new Uint8Array(sizeBytes)])

      const start = performance.now()
      const res = await fetch(UPLOAD_ECHO_URL, {
        method: 'POST',
        // 不依赖 FormData，避免 multipart 额外开销
        body: blob,
        headers: { 'Content-Type': 'application/octet-stream' },
      })

      const elapsedSec = (performance.now() - start) / 1000
      if (!res.ok || elapsedSec <= 0) throw new Error(`Upload failed: ${res.status}`)

      // 这里用“发送的字节数 / 请求耗时”粗略估算上传速率
      const mbps = sizeBytes / elapsedSec / 1e6
      if (Number.isFinite(mbps) && mbps >= 0) {
        latestUploadMBps.value = mbps
        uploadSource.value = 'upload-test'
      }
    } catch {
      // 不填充假数据：上传测不到就保持 null
      latestUploadMBps.value = null
      uploadSource.value = 'unavailable'
    } finally {
      uploadInFlight = false
    }
  }

  const start = () => {
    updateFromNavigatorConnection()

    // 让图表很快有值：先测一次下载
    void runDownloadTest()

    downloadTimer = window.setInterval(() => {
      void runDownloadTest()
    }, 2500)

    // 上传相对慢：间隔更长
    uploadTimer = window.setInterval(() => {
      void runUploadTest()
    }, 10000)
  }

  const stop = () => {
    if (downloadTimer != null) window.clearInterval(downloadTimer)
    if (uploadTimer != null) window.clearInterval(uploadTimer)
    downloadTimer = null
    uploadTimer = null
  }

  onUnmounted(stop)

  return {
    latestDownloadMBps,
    latestUploadMBps,
    downloadSource,
    uploadSource,
    start,
    stop,
  }
}


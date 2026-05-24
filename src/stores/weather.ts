import { ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { getWeather } from '@/api/api'

/** 单日天气数据类型 */
export interface DayWeather {
    date: string
    text: string
    tempMax: string
    tempMin: string
    windDir: string
    windScale: string
    iconDay: string
}

/** 带显示标签的天气数据 */
export interface DayWeatherDisplay extends DayWeather {
    label: string
}

/** 刷新间隔：30 分钟 */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000

export const useWeatherStore = defineStore('weather', () => {
    const todayWeather = ref<DayWeatherDisplay | null>(null)
    const tomorrowWeather = ref<DayWeatherDisplay | null>(null)
    const loading = ref(false)
    const error = ref('')
    const lastUpdated = ref<string>('')

    let refreshTimer: ReturnType<typeof setInterval> | null = null

    /**
     * 从列表中提取今天和明天的数据
     */
    function extractTodayAndTomorrow(list: DayWeather[]): {
        today: DayWeatherDisplay | null
        tomorrow: DayWeatherDisplay | null
    } {
        if (!list?.length) return { today: null, tomorrow: null }

        const todayStr = dayjs().format('YYYY-MM-DD')

        const today = list.find((d) => d.date === todayStr) || null
        const tomorrow =
            list.find((d) => {
                const diff = dayjs(d.date).diff(dayjs(todayStr), 'day')
                return diff === 1
            }) || null

        return {
            today: today ? { ...today, label: '今天' } : null,
            tomorrow: tomorrow ? { ...tomorrow, label: '明天' } : null,
        }
    }

    /** 拉取天气数据（不传 IP，让后端从请求头 X-Forwarded-For 自动获取客户端真实 IP） */
    async function refresh() {
        loading.value = true
        error.value = ''
        try {
            // 不再需要前端获取 IP，后端会从请求头中获取客户端真实 IP
            const res = await getWeather()
            if (res.code !== 200 || !res.data) {
                throw new Error('天气接口返回异常')
            }

            const result = extractTodayAndTomorrow(res.data)
            todayWeather.value = result.today
            tomorrowWeather.value = result.tomorrow
            lastUpdated.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
        } catch (e: any) {
            error.value = e?.message || '获取天气信息失败'
        } finally {
            loading.value = false
        }
    }

    /** 启动定时刷新（每 30 分钟） */
    function startAutoRefresh() {
        stopAutoRefresh()
        refreshTimer = setInterval(() => {
            refresh()
        }, REFRESH_INTERVAL_MS)
    }

    /** 停止定时刷新 */
    function stopAutoRefresh() {
        if (refreshTimer !== null) {
            clearInterval(refreshTimer)
            refreshTimer = null
        }
    }

    return {
        todayWeather,
        tomorrowWeather,
        loading,
        error,
        lastUpdated,
        refresh,
        startAutoRefresh,
        stopAutoRefresh,
    }
})

<script setup lang="ts">
import dayjs from 'dayjs'
import { onMounted, onUnmounted, ref } from 'vue'

interface CountdownItem {
  id: string
  label: string
  targetTime: string
  suffix: string
}

const DEFAULT_COUNTDOWNS: CountdownItem[] = [
  {
    id: 'kaoyan-2027',
    label: '距离 2027 考研初试还有',
    targetTime: '2026-12-19T08:30:00',
    suffix: '考试已开始！保持冷静！',
  },
  {
    id: 'cet6-2026',
    label: '距离 英语六级 (6/13) 还有',
    targetTime: '2026-06-13T09:00:00',
    suffix: '六级已开始/已结束',
  },
]

const loadItems = (): CountdownItem[] => {
  try {
    const raw = localStorage.getItem('nexus-countdowns')
    if (raw) return JSON.parse(raw) as CountdownItem[]
  } catch {}
  return DEFAULT_COUNTDOWNS.map((c) => ({ ...c }))
}

const saveItems = (items: CountdownItem[]) => {
  localStorage.setItem('nexus-countdowns', JSON.stringify(items))
}

const items = ref<CountdownItem[]>(loadItems())
const texts = ref<string[]>(items.value.map(() => ''))

// ---- 对话框状态 ----
const dialogVisible = ref(false)
const formLabel = ref('')
const formTarget = ref('')
const formSuffix = ref('已到时！')

const openDialog = () => {
  formLabel.value = ''
  formTarget.value = ''
  formSuffix.value = '已到时！'
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const addItem = () => {
  if (!formLabel.value.trim() || !formTarget.value) return
  const newItem: CountdownItem = {
    id: Date.now().toString(),
    label: formLabel.value.trim(),
    targetTime: formTarget.value,
    suffix: formSuffix.value.trim() || '已到时！',
  }
  items.value.push(newItem)
  texts.value.push('')
  saveItems(items.value)
  closeDialog()
  tick()
}

const removeItem = (id: string) => {
  const idx = items.value.findIndex((c) => c.id === id)
  if (idx >= 0) {
    items.value.splice(idx, 1)
    texts.value.splice(idx, 1)
    saveItems(items.value)
  }
}

// ---- 倒计时计算 ----
const tick = () => {
  texts.value = items.value.map((item) => {
    const diff = dayjs(item.targetTime).diff(dayjs())
    if (diff <= 0) return item.suffix
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff / 3600000) % 24)
    const m = Math.floor((diff / 60000) % 60)
    const s = Math.floor((diff / 1000) % 60)
    return `${d} 天 ${h} 小时 ${m} 分 ${s} 秒`
  })
}

let timer: number | null = null

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})
</script>

<template>
  <div class="top-banner countdown-banner">
    <!-- 倒计时列表 -->
    <div v-for="(item, i) in items" :key="item.id" class="banner-row countdown-row">
      <span class="countdown-text">{{ item.label }}：{{ texts[i] }}</span>
      <button class="remove-btn" @click="removeItem(item.id)" title="删除此倒计时">✕</button>
    </div>

    <!-- 添加按钮 -->
    <div class="add-row">
      <button class="add-btn" @click="openDialog">＋ 添加倒计时</button>
    </div>

    <!-- 添加对话框 -->
    <Teleport to="body">
      <div v-if="dialogVisible" class="cd-overlay" @click.self="closeDialog">
        <div class="cd-dialog">
          <div class="cd-dialog-title">添加倒计时</div>

          <div class="cd-field">
            <label class="cd-label">事件名称</label>
            <input
              v-model="formLabel"
              class="cd-input"
              placeholder="例：期末考试"
              maxlength="30"
            />
          </div>

          <div class="cd-field">
            <label class="cd-label">目标时间</label>
            <input v-model="formTarget" class="cd-input" type="datetime-local" />
          </div>

          <div class="cd-field">
            <label class="cd-label">到时提示语</label>
            <input
              v-model="formSuffix"
              class="cd-input"
              placeholder="已到时！"
              maxlength="20"
            />
          </div>

          <div class="cd-actions">
            <button class="cd-btn cancel" @click="closeDialog">取消</button>
            <button class="cd-btn confirm" @click="addItem">确认添加</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* banner-row 继承全局 top-banner 样式，这里只补充新增部分 */
.countdown-banner {
  gap: 4px;
}

.countdown-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.countdown-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: center;
}

.remove-btn {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid rgba(255, 100, 80, 0.4);
  color: rgba(255, 120, 100, 0.7);
  border-radius: 4px;
  width: 20px;
  height: 20px;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
}

.remove-btn:hover {
  border-color: rgba(255, 80, 60, 0.8);
  color: rgba(255, 80, 60, 1);
  background: rgba(255, 60, 40, 0.1);
}

.add-row {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

.add-btn {
  background: transparent;
  border: 1px dashed rgba(255, 190, 120, 0.45);
  color: rgba(255, 190, 120, 0.75);
  border-radius: 6px;
  padding: 2px 14px;
  font-size: clamp(11px, 1vw, 13px);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.5px;
}

.add-btn:hover {
  border-color: rgba(255, 190, 120, 0.85);
  color: rgba(255, 210, 140, 1);
  background: rgba(255, 140, 40, 0.08);
}

/* 对话框覆盖层 */
.cd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-dialog {
  background: rgba(16, 20, 30, 0.97);
  border: 1px solid rgba(255, 140, 60, 0.45);
  box-shadow:
    0 0 0 1px rgba(255, 102, 0, 0.12),
    0 0 40px rgba(255, 102, 0, 0.18),
    inset 0 0 30px rgba(255, 102, 0, 0.05);
  border-radius: 14px;
  padding: 28px 32px;
  width: clamp(280px, 38vw, 420px);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: rgba(255, 210, 150, 0.95);
}

.cd-dialog-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  color: rgba(255, 190, 120, 1);
  text-shadow: 0 0 12px rgba(255, 102, 0, 0.4);
  letter-spacing: 1px;
}

.cd-field {
  margin-bottom: 14px;
}

.cd-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 190, 120, 0.65);
  margin-bottom: 5px;
  letter-spacing: 0.4px;
}

.cd-input {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 140, 60, 0.35);
  border-radius: 7px;
  padding: 7px 10px;
  color: rgba(255, 220, 170, 0.95);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.cd-input:focus {
  border-color: rgba(255, 140, 60, 0.75);
  box-shadow: 0 0 10px rgba(255, 102, 0, 0.15);
}

/* datetime-local 颜色修复 */
.cd-input[type='datetime-local']::-webkit-calendar-picker-indicator {
  filter: invert(0.75) sepia(1) saturate(2) hue-rotate(10deg);
  cursor: pointer;
}

.cd-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.cd-btn {
  padding: 7px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  letter-spacing: 0.3px;
}

.cd-btn.cancel {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.cd-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
}

.cd-btn.confirm {
  background: rgba(255, 102, 0, 0.22);
  border-color: rgba(255, 140, 60, 0.55);
  color: rgba(255, 190, 120, 1);
}

.cd-btn.confirm:hover {
  background: rgba(255, 102, 0, 0.35);
  box-shadow: 0 0 14px rgba(255, 102, 0, 0.22);
}
</style>

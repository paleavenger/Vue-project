<template>
  <div class="palette-page">
    <section class="palette-header">
      <h2>Генератор цветовых палитр</h2>
      <p>
        Создавайте случайные палитры, закрепляйте понравившиеся цвета, копируйте значения и
        просматривайте их в примере интерфейса.
      </p>
    </section>

    <section class="palette-controls">
      <div class="control-group">
        <label for="color-count">Количество цветов:</label>
        <select
          id="color-count"
          v-model.number="colorCount"
          class="select-input"
        >
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="7">7</option>
        </select>
      </div>

      <div class="control-group">
        <label for="format">Формат отображения:</label>
        <select
          id="format"
          v-model="colorFormat"
          class="select-input"
        >
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
        </select>
      </div>

      <div class="control-group control-group-button">
        <button
          type="button"
          class="primary-button"
          @click="generatePalette"
        >
          Случайная палитра
        </button>
      </div>
    </section>

    <section class="palette-strip" aria-label="Текущая палитра">
      <div
        v-for="(color, index) in colors"
        :key="color.id"
        class="color-card"
        :style="{ backgroundColor: color.hex }"
      >
        <div class="color-card-top">
          <span class="color-index">#{{ index + 1 }}</span>
          <button
            type="button"
            class="lock-button"
            @click.stop="toggleLock(color.id)"
            :aria-pressed="color.locked ? 'true' : 'false'"
          >
            <span v-if="color.locked">🔒 Закреплён</span>
            <span v-else>🔓 Свободен</span>
          </button>
        </div>

        <div class="color-value">
          <span>{{ getDisplayValue(color.hex) }}</span>
        </div>

        <button
          type="button"
          class="copy-button"
          @click="copyColor(color.hex)"
        >
          Копировать
        </button>
      </div>
    </section>

    <transition name="toast-fade">
      <div
        v-if="copyMessage"
        class="toast"
        role="status"
      >
        {{ copyMessage }}
      </div>
    </transition>

    <section class="preview-section">
      <div class="preview-header">
        <h3>Превью интерфейса</h3>
        <button
          type="button"
          class="secondary-button"
          @click="isDarkPreview = !isDarkPreview"
        >
          Тема: {{ isDarkPreview ? 'тёмная' : 'светлая' }}
        </button>
      </div>

      <div
        class="preview-mockup"
        :class="{ 'preview-dark': isDarkPreview }"
      >
        <div class="preview-header-bar" :style="previewStyles.header">
          <span class="preview-title">Заголовок интерфейса</span>
        </div>

        <div class="preview-content">
          <div class="preview-card" :style="previewStyles.card">
            <h4 :style="previewStyles.cardTitle">Карточка контента</h4>
            <p :style="previewStyles.cardText">
              Здесь вы видите пример того, как текущая палитра может выглядеть в реальном
              интерфейсе: фон, акценты и текст.
            </p>
            <button
              type="button"
              class="preview-button"
              :style="previewStyles.button"
            >
              Акцентная кнопка
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'palette-generator-current'

export default {
  name: 'PaletteGenerator',
  setup() {
    const colorCount = ref(5)
    const colorFormat = ref('hex') // 'hex' | 'rgb'
    const colors = ref([])
    const copyMessage = ref('')
    const isDarkPreview = ref(false)
    let copyTimeoutId = null

    const generateRandomColor = () => {
      // Гармоничная палитра на основе одного тона (HSL)
      const baseHue = Math.floor(Math.random() * 360)
      const step = Math.floor(360 / Math.max(colorCount.value, 3))

      const used = new Set()

      const nextHue = (index) => {
        const h = (baseHue + step * index) % 360
        if (used.has(h)) {
          return (h + 15) % 360
        }
        used.add(h)
        return h
      }

      const index = colors.value.length
      const hue = nextHue(index)
      return hslToHex(hue, 70, 55)
    }

    const regenerateColors = () => {
      const newColors = []
      const existing = colors.value

      for (let i = 0; i < colorCount.value; i++) {
        const existingColor = existing[i]

        if (existingColor && existingColor.locked) {
          newColors.push(existingColor)
        } else {
          newColors.push({
            id: Date.now() + i,
            hex: generateRandomColor(),
            locked: false,
          })
        }
      }

      colors.value = newColors
    }

    const generatePalette = () => {
      regenerateColors()
    }

    const toggleLock = (id) => {
      colors.value = colors.value.map((color) =>
        color.id === id ? { ...color, locked: !color.locked } : color,
      )
    }

    const copyColor = async (hex) => {
      try {
        await navigator.clipboard.writeText(hex)
        showCopyMessage(`Цвет ${hex} скопирован в буфер обмена`)
      } catch (e) {
        showCopyMessage('Не удалось скопировать цвет')
      }
    }

    const showCopyMessage = (message) => {
      copyMessage.value = message
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId)
      }
      copyTimeoutId = setTimeout(() => {
        copyMessage.value = ''
      }, 1500)
    }

    const getDisplayValue = (hex) => {
      if (colorFormat.value === 'hex') {
        return hex.toUpperCase()
      }
      const { r, g, b } = hexToRgb(hex)
      return `rgb(${r}, ${g}, ${b})`
    }

    const primaryColor = computed(() => (colors.value[0] ? colors.value[0].hex : '#667eea'))
    const accentColor = computed(() => (colors.value[1] ? colors.value[1].hex : '#764ba2'))
    const backgroundColor = computed(() => (colors.value[2] ? colors.value[2].hex : '#f5f5f5'))

    const textColorOn = (hex) => {
      const { r, g, b } = hexToRgb(hex)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.6 ? '#111827' : '#f9fafb'
    }

    const previewStyles = computed(() => {
      const baseBg = isDarkPreview.value ? '#111827' : '#f3f4f6'
      const baseText = isDarkPreview.value ? '#e5e7eb' : '#111827'

      return {
        header: {
          backgroundColor: primaryColor.value,
          color: textColorOn(primaryColor.value),
        },
        card: {
          backgroundColor: backgroundColor.value,
          color: textColorOn(backgroundColor.value),
          boxShadow: isDarkPreview.value
            ? '0 10px 25px rgba(0,0,0,0.6)'
            : '0 10px 25px rgba(15,23,42,0.15)',
        },
        cardTitle: {
          color: baseText,
        },
        cardText: {
          color: baseText,
        },
        button: {
          backgroundColor: accentColor.value,
          color: textColorOn(accentColor.value),
        },
        baseBg,
        baseText,
      }
    })

    const saveToStorage = () => {
      const payload = {
        colorCount: colorCount.value,
        colors: colors.value,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch {
        // ignore storage errors
      }
    }

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          return false
        }
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed.colors) || !parsed.colors.length) {
          return false
        }
        colorCount.value = parsed.colorCount || parsed.colors.length
        colors.value = parsed.colors.map((c) => ({
          id: c.id || Date.now(),
          hex: c.hex,
          locked: Boolean(c.locked),
        }))
        return true
      } catch {
        return false
      }
    }

    onMounted(() => {
      const restored = loadFromStorage()
      if (!restored) {
        regenerateColors()
      }
    })

    watch(
      colorCount,
      () => {
        regenerateColors()
        saveToStorage()
      },
    )

    watch(
      colors,
      () => {
        saveToStorage()
      },
      { deep: true },
    )

    return {
      colorCount,
      colorFormat,
      colors,
      copyMessage,
      isDarkPreview,
      previewStyles,
      generatePalette,
      toggleLock,
      copyColor,
      getDisplayValue,
    }
  },
}

function hslToHex(h, s, l) {
  s /= 100
  l /= 100

  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * color)
  }

  const r = f(0)
  const g = f(8)
  const b = f(4)

  return rgbToHex(r, g, b)
}

function rgbToHex(r, g, b) {
  const toHex = (c) => c.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex) {
  let cleaned = hex.replace('#', '')
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  const num = parseInt(cleaned, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return { r, g, b }
}
</script>

<style scoped>
.palette-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.palette-header h2 {
  font-size: 1.8rem;
  margin-bottom: 0.4rem;
}

.palette-header p {
  color: #555;
  max-width: 640px;
}

.palette-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 160px;
}

.control-group-button {
  margin-left: auto;
  align-items: flex-end;
  justify-content: flex-end;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
}

.select-input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.primary-button {
  padding: 0.6rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.45);
}

.palette-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.color-card {
  border-radius: 14px;
  padding: 0.85rem 0.9rem;
  color: #f9fafb;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
}

.color-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.color-index {
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(15, 23, 42, 0.4);
}

.lock-button {
  border: none;
  background: rgba(15, 23, 42, 0.2);
  color: #f9fafb;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.color-value {
  font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.95rem;
  margin-top: 0.9rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.copy-button {
  align-self: flex-start;
  margin-top: auto;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: none;
  background-color: rgba(15, 23, 42, 0.75);
  color: #f9fafb;
  font-size: 0.8rem;
  cursor: pointer;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  background-color: #111827;
  color: #f9fafb;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  font-size: 0.9rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.7);
  z-index: 50;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 5px);
}

.preview-section {
  margin-top: 0.5rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}

.preview-header h3 {
  font-size: 1.2rem;
}

.secondary-button {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

.preview-mockup {
  border-radius: 18px;
  background-color: #f3f4f6;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
}

.preview-mockup.preview-dark {
  background-color: #0f172a;
}

.preview-header-bar {
  padding: 0.75rem 1.2rem;
}

.preview-title {
  font-weight: 600;
}

.preview-content {
  padding: 1.2rem 1.3rem 1.4rem;
}

.preview-card {
  border-radius: 14px;
  padding: 1.1rem 1.2rem 1.3rem;
}

.preview-card h4 {
  margin-bottom: 0.4rem;

  font-size: 1.05rem;
}

.preview-card p {
  margin-bottom: 0.9rem;
  font-size: 0.9rem;
}

.preview-button {
  padding: 0.55rem 1.15rem;
  border-radius: 999px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .palette-controls {
    flex-direction: column;
  }

  .control-group-button {
    margin-left: 0;
    align-items: stretch;
  }

  .primary-button {
    width: 100%;
    justify-content: center;
  }
}
</style>



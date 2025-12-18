<template>
  <div class="palette-page">
    <section class="palette-header">
      <h2>Генератор цветовых палитр</h2>
    </section>

    <section class="palette-controls">
      <div class="control-group">
        <label for="base-color">Базовый цвет:</label>
        <input
          id="base-color"
          v-model="baseColor"
          type="color"
          class="color-input"
        />
      </div>

      <div class="control-group">
        <label for="palette-type">Тип палитры:</label>
        <select
          id="palette-type"
          v-model="paletteType"
          class="select-input"
        >
          <option value="random">Случайная</option>
          <option value="analogous">Аналогичная</option>
          <option value="monochrome">Монохромная</option>
          <option value="triad">Триада</option>
          <option value="complementary">Комплементарная</option>
        </select>
      </div>

      <div class="control-group">
        <label for="mood">Настроение палитры:</label>
        <select
          id="mood"
          v-model="mood"
          class="select-input"
        >
          <option value="none">Без настроения</option>
          <option value="calm">Спокойная</option>
          <option value="energetic">Энергичная</option>
          <option value="professional">Профессиональная</option>
        </select>
      </div>

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
          Сгенерировать палитру
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

    <section class="analysis-section">
      <div class="analysis-header">
        <h3>Анализ доступности (WCAG)</h3>
        <p class="analysis-subtitle">
          Контраст текста и фона, рекомендации по уровням AA / AAA и акцентным цветам.
        </p>
      </div>

      <div class="analysis-grid">
        <div class="analysis-block">
          <h4>Контраст заголовка</h4>
          <p>Коэффициент: {{ headerContrast.ratio.toFixed(2) }}:1</p>
          <p>Уровень: {{ headerContrast.level }}</p>
        </div>

        <div class="analysis-block">
          <h4>Контраст текста на карточке</h4>
          <p>Коэффициент: {{ cardContrast.ratio.toFixed(2) }}:1</p>
          <p>Уровень: {{ cardContrast.level }}</p>
        </div>

        <div class="analysis-block">
          <h4>Название базового цвета</h4>
          <p v-if="baseColorName.loading">Загрузка названия из внешнего API...</p>
          <p v-else-if="baseColorName.error">Не удалось получить название цвета.</p>
          <p v-else>Цвет {{ baseColor }} — {{ baseColorName.name }}</p>
        </div>

        <div class="analysis-block">
          <h4>Рекомендуемый акцент</h4>
          <div class="accent-preview">
            <div
              class="accent-color-sample"
              :style="{ backgroundColor: recommendedAccent.hex, color: recommendedAccent.textColor }"
            >
              {{ recommendedAccent.hex }}
            </div>
            <p>Контраст с фоном: {{ recommendedAccent.contrast.toFixed(2) }}:1</p>
          </div>
        </div>
      </div>

      <div class="color-wheel-wrapper">
        <h4>Цветовой круг</h4>
        <div class="color-wheel">
          <div
            v-for="color in colors"
            :key="color.id + '-marker'"
            class="color-wheel-marker"
            :style="getWheelMarkerStyle(color.hex)"
          ></div>
        </div>
        <p class="color-wheel-caption">
          Маркеры показывают оттенки текущей палитры на цветовом круге.
        </p>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, onActivated, ref, watch } from 'vue'

const STORAGE_KEY = 'palette-generator-current'

export default {
  name: 'PaletteGenerator',
  setup() {
    const colorCount = ref(5)
    const colorFormat = ref('hex') // 'hex' | 'rgb'
    const baseColor = ref('#667eea')
    const paletteType = ref('random')
    const mood = ref('none')
    const colors = ref([])
    const copyMessage = ref('')
    const isDarkPreview = ref(false)
    let copyTimeoutId = null
    const baseColorName = ref({
      loading: false,
      error: false,
      name: '',
    })
    
    let isInitializing = false

    const generateColorForIndex = (index) => {
      const base = hexToHsl(baseColor.value)
      let h = base.h
      let s = base.s
      let l = base.l

      // Добавляем случайные вариации для разнообразия
      const randomVariation = () => (Math.random() - 0.5) * 20

      const applyMood = () => {
        if (mood.value === 'calm') {
          s = Math.max(25, s - 20)
          l = Math.min(80, l + 10)
        } else if (mood.value === 'energetic') {
          s = Math.min(90, s + 15)
          l = Math.min(70, l + 5)
        } else if (mood.value === 'professional') {
          s = Math.max(20, Math.min(60, s))
          l = Math.max(35, Math.min(70, l))
        }
      }

      switch (paletteType.value) {
        case 'analogous':
          h = (base.h + (index - Math.floor(colorCount.value / 2)) * 25 + randomVariation() + 360) % 360
          s = Math.max(20, Math.min(100, s + randomVariation() * 0.5))
          l = Math.max(20, Math.min(80, l + randomVariation() * 0.3))
          break
        case 'monochrome':
          l = Math.min(85, Math.max(15, base.l + (index - 2) * 12 + randomVariation() * 0.5))
          s = Math.max(10, Math.min(100, s + randomVariation() * 0.3))
          break
        case 'triad':
          h = (base.h + index * 120 + randomVariation()) % 360
          s = Math.max(30, Math.min(100, s + randomVariation() * 0.5))
          l = Math.max(25, Math.min(75, l + randomVariation() * 0.3))
          break
        case 'complementary':
          h = index % 2 === 0 ? (base.h + randomVariation() * 0.5 + 360) % 360 : (base.h + 180 + randomVariation() * 0.5) % 360
          l = Math.min(80, Math.max(20, base.l + (index - 1) * 8 + randomVariation() * 0.3))
          s = Math.max(30, Math.min(100, s + randomVariation() * 0.5))
          break
        case 'random':
        default:
          h = Math.floor(Math.random() * 360)
          s = Math.max(30, Math.min(100, 50 + Math.random() * 50))
          l = Math.max(25, Math.min(75, 40 + Math.random() * 35))
          break
      }

      applyMood()
      return hslToHex(h, s, l)
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
            hex: generateColorForIndex(i),
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

    const contrastRatio = (hex1, hex2) => {
      const l1 = relativeLuminance(hex1)
      const l2 = relativeLuminance(hex2)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    const wcagLevel = (ratio, isLargeText = false) => {
      if (ratio >= 7) return 'AAA'
      if (ratio >= 4.5) return isLargeText ? 'AAA (крупный текст)' : 'AA'
      if (ratio >= 3 && isLargeText) return 'AA (крупный текст)'
      return 'Недостаточно'
    }

    const headerContrast = computed(() => {
      const ratio = contrastRatio(primaryColor.value, textColorOn(primaryColor.value))
      return {
        ratio,
        level: wcagLevel(ratio, true),
      }
    })

    const cardContrast = computed(() => {
      const bg = backgroundColor.value
      const text = previewStyles.value.cardText.color
      const ratio = contrastRatio(bg, text)
      return {
        ratio,
        level: wcagLevel(ratio, false),
      }
    })

    const recommendedAccent = computed(() => {
      const bg = backgroundColor.value
      let best = colors.value[0] ? colors.value[0].hex : '#111827'
      let bestRatio = contrastRatio(bg, best)
      colors.value.forEach((c) => {
        const r = contrastRatio(bg, c.hex)
        if (r > bestRatio) {
          best = c.hex
          bestRatio = r
        }
      })
      return {
        hex: best,
        contrast: bestRatio,
        textColor: textColorOn(best),
      }
    })

    const getWheelMarkerStyle = (hex) => {
      const { h } = hexToHsl(hex)
      return {
        transform: `rotate(${h}deg) translate(0, -50%)`,
        backgroundColor: hex,
      }
    }

    const fetchBaseColorName = async () => {
      try {
        baseColorName.value = { loading: true, error: false, name: '' }
        const hex = baseColor.value.replace('#', '')
        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`)
        if (!response.ok) throw new Error('Network error')
        const data = await response.json()
        baseColorName.value = {
          loading: false,
          error: false,
          name: data?.name?.value || 'неизвестно',
        }
      } catch {
        baseColorName.value = { loading: false, error: true, name: '' }
      }
    }

    const saveToStorage = () => {
      const payload = {
        colorCount: colorCount.value,
        colors: colors.value,
        baseColor: baseColor.value,
        paletteType: paletteType.value,
        mood: mood.value,
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
        if (parsed.baseColor) baseColor.value = parsed.baseColor
        if (parsed.paletteType) paletteType.value = parsed.paletteType
        if (parsed.mood) mood.value = parsed.mood
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

    const initFromStorage = () => {
      isInitializing = true
      const restored = loadFromStorage()
      if (!restored) {
        regenerateColors()
      }
      fetchBaseColorName()
      // Даём Vue обработать изменения, потом снимаем флаг
      setTimeout(() => {
        isInitializing = false
      }, 0)
    }

    onMounted(() => {
      initFromStorage()
    })

    // Для перезагрузки при возврате на вкладку (если используется keep-alive)
    onActivated(() => {
      initFromStorage()
    })

    watch(
      colorCount,
      () => {
        if (!isInitializing) {
          regenerateColors()
          saveToStorage()
        }
      },
    )

    watch(
      [colors, baseColor, paletteType, mood],
      () => {
        if (!isInitializing) {
          saveToStorage()
          fetchBaseColorName()
        }
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
      headerContrast,
      cardContrast,
      recommendedAccent,
      baseColorName,
      baseColor,
      paletteType,
      mood,
      generatePalette,
      toggleLock,
      copyColor,
      getDisplayValue,
      getWheelMarkerStyle,
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

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h
  let s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)
        break
      case gNorm:
        h = (bNorm - rNorm) / d + 2
        break
      default:
        h = (rNorm - gNorm) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
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

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
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

.color-input {
  width: 56px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #fff;
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
  background-color: #f9fafb;
  color: #374151;
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

.analysis-section {
  margin-top: 1.5rem;
  padding: 1.25rem 1.3rem 1.5rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.analysis-header h3 {
  margin-bottom: 0.3rem;
}

.analysis-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
}

.analysis-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.8rem;
}

.analysis-block {
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.accent-preview {
  margin-top: 0.4rem;
}

.accent-color-sample {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.color-wheel-wrapper {
  margin-top: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.color-wheel {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: conic-gradient(
    red,
    yellow,
    lime,
    cyan,
    blue,
    magenta,
    red
  );
  margin-top: 0.5rem;
}

.color-wheel-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform-origin: 0 0;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.color-wheel-caption {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #6b7280;
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



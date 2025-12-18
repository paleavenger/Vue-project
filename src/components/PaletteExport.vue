<template>
  <div class="export-page">
    <section class="export-header">
      <h2>Экспорт палитр</h2>
      <p>
        Экспортируйте текущую палитру в CSS-переменные, SCSS и конфигурацию Tailwind, а также
        просматривайте её в разных UI-компонентах и делитесь ссылкой.
      </p>
    </section>

    <section class="export-share">
      <div class="control-group">
        <label>Текущая палитра:</label>
        <div class="swatches-row">
          <div
            v-for="(color, index) in colors"
            :key="index"
            class="swatch"
            :style="{ backgroundColor: color }"
          >
            <span class="swatch-label">{{ color }}</span>
          </div>
        </div>
      </div>

      <div class="control-group">
        <label>Шаринговая ссылка:</label>
        <div class="share-row">
          <input
            v-model="shareUrl"
            type="text"
            class="text-input"
            readonly
          />
          <button
            type="button"
            class="secondary-button"
            @click="copyShareUrl"
          >
            Копировать ссылку
          </button>
        </div>
        <p class="hint">Ссылка кодирует палитру в параметре URL. Откройте её, чтобы загрузить палитру.</p>
      </div>
    </section>

    <section class="export-code">
      <div class="export-block">
        <h3>CSS-переменные</h3>
        <textarea
          readonly
          class="code-area"
        >{{ cssVariables }}</textarea>
      </div>

      <div class="export-block">
        <h3>SCSS-переменные</h3>
        <textarea
          readonly
          class="code-area"
        >{{ scssVariables }}</textarea>
      </div>

      <div class="export-block">
        <h3>Tailwind config (colors)</h3>
        <textarea
          readonly
          class="code-area"
        >{{ tailwindConfig }}</textarea>
      </div>
    </section>

    <section class="export-preview">
      <h3>Превью UI-компонентов</h3>
      <div class="components-grid">
        <div class="component-card">
          <h4>Кнопки</h4>
          <button
            v-for="(color, index) in colors"
            :key="'btn-' + index"
            class="preview-button"
            :style="{ backgroundColor: color, color: textColorOn(color) }"
          >
            Кнопка {{ index + 1 }}
          </button>
        </div>

        <div class="component-card">
          <h4>Карточки</h4>
          <div
            v-for="(color, index) in colors"
            :key="'card-' + index"
            class="preview-card"
            :style="{ backgroundColor: color, color: textColorOn(color) }"
          >
            <h5>Карточка {{ index + 1 }}</h5>
            <p>Фон этой карточки использует цвет {{ color }}</p>
          </div>
        </div>

        <div class="component-card">
          <h4>Чипы</h4>
          <span
            v-for="(color, index) in colors"
            :key="'chip-' + index"
            class="chip"
            :style="{ backgroundColor: color, color: textColorOn(color) }"
          >
            {{ color }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const CURRENT_STORAGE_KEY = 'palette-generator-current'

export default {
  name: 'PaletteExport',
  setup() {
    const colors = ref([])
    const shareUrl = ref('')
    const route = useRoute()
    const router = useRouter()

    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem(CURRENT_STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.colors) && parsed.colors.length) {
          colors.value = parsed.colors.map((c) => c.hex)
        }
      } catch {
        // ignore
      }
    }

    const encodePaletteToQuery = () => {
      if (!colors.value.length) return ''
      const encoded = encodeURIComponent(colors.value.join(','))
      return `palette=${encoded}`
    }

    const buildShareUrl = () => {
      const query = encodePaletteToQuery()
      const base = window.location.origin + router.resolve({ name: 'export' }).href
      shareUrl.value = query ? `${base}?${query}` : base
    }

    const applyPaletteFromQuery = () => {
      const encoded = route.query.palette
      if (!encoded || typeof encoded !== 'string') return
      const parts = decodeURIComponent(encoded).split(',')
      if (parts.length) {
        colors.value = parts
        // записываем как текущую палитру для генератора/библиотеки
        const payload = {
          colorCount: parts.length,
          colors: parts.map((hex, idx) => ({
            id: Date.now() + idx,
            hex,
            locked: false,
          })),
        }
        localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(payload))
      }
    }

    const cssVariables = computed(() => {
      if (!colors.value.length) return ''
      const lines = colors.value.map((c, i) => `  --color-${i + 1}: ${c};`)
      return `:root {\n${lines.join('\n')}\n}`
    })

    const scssVariables = computed(() => {
      if (!colors.value.length) return ''
      return colors.value.map((c, i) => `$color-${i + 1}: ${c};`).join('\n')
    })

    const tailwindConfig = computed(() => {
      if (!colors.value.length) return ''
      const entries = colors.value
        .map((c, i) => `      "${i + 1}": "${c}"`)
        .join(',\n')
      return `module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${entries}
        }
      }
    }
  }
}`
    })

    const textColorOn = (hex) => {
      const { r, g, b } = hexToRgb(hex)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      return luminance > 0.6 ? '#111827' : '#f9fafb'
    }

    const copyShareUrl = async () => {
      if (!shareUrl.value) return
      try {
        await navigator.clipboard.writeText(shareUrl.value)
        alert('Ссылка скопирована в буфер обмена')
      } catch {
        alert('Не удалось скопировать ссылку')
      }
    }

    onMounted(() => {
      if (route.query.palette) {
        applyPaletteFromQuery()
      } else {
        loadFromStorage()
      }
      buildShareUrl()
    })

    return {
      colors,
      shareUrl,
      cssVariables,
      scssVariables,
      tailwindConfig,
      copyShareUrl,
      textColorOn,
    }
  },
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
.export-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.export-header h2 {
  font-size: 1.8rem;
  margin-bottom: 0.3rem;
}

.export-header p {
  color: #555;
  max-width: 720px;
}

.export-share {
  padding: 1rem 1.25rem 1.2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.swatches-row {
  display: flex;
  gap: 0.3rem;
}

.swatch {
  flex: 1;
  border-radius: 8px;
  min-height: 44px;
  position: relative;
  overflow: hidden;
}

.swatch-label {
  position: absolute;
  bottom: 4px;
  left: 6px;
  font-size: 0.7rem;
  color: #f9fafb;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.share-row {
  display: flex;
  gap: 0.5rem;
}

.text-input {
  flex: 1;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.secondary-button {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #6366f1;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
}

.hint {
  font-size: 0.85rem;
  color: #6b7280;
}

.export-code {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.export-block {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  padding: 0.9rem 1rem 1rem;
}

.code-area {
  width: 100%;
  min-height: 160px;
  margin-top: 0.5rem;
  padding: 0.6rem 0.7rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 0.8rem;
  resize: vertical;
}

.export-preview {
  padding: 1rem 1.25rem 1.2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 0.7rem;
}

.component-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 0.7rem 0.8rem;
}

.preview-button {
  display: inline-block;
  margin: 0.2rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
}

.preview-card {
  border-radius: 8px;
  padding: 0.6rem 0.7rem;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.chip {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  margin: 0.15rem;
}

@media (max-width: 768px) {
  .share-row {
    flex-direction: column;
  }
}
</style>



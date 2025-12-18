<template>
  <div class="library-page">
    <section class="library-header">
      <h2>Библиотека палитр</h2>
      <p>Сохраняйте палитры, задавайте им названия и теги, ищите и отмечайте избранные.</p>
    </section>

    <section class="library-controls">
      <div class="control-group">
        <label for="search">Поиск по названию и тегам:</label>
        <input
          id="search"
          v-model="searchQuery"
          type="text"
          class="text-input"
          placeholder="Например: фирменная, спокойная..."
        />
      </div>

      <div class="control-group">
        <label for="filter-favorite">Фильтр:</label>
        <select
          id="filter-favorite"
          v-model="filterMode"
          class="select-input"
        >
          <option value="all">Все</option>
          <option value="favorites">Только избранные</option>
        </select>
      </div>
    </section>

    <section class="save-current">
      <h3>Сохранить текущую палитру</h3>
      <p class="hint">
        Сохраняется палитра, которую вы последней редактировали в генераторе.
      </p>
      <form
        class="save-form"
        @submit.prevent="saveCurrentPalette"
      >
        <div class="save-form-main">
          <input
            v-model="newPaletteName"
            type="text"
            class="text-input"
            placeholder="Название палитры"
            required
          />
          <TagInput v-model="newPaletteTags" />
        </div>
        <button
          type="submit"
          class="primary-button"
        >
          Сохранить палитру
        </button>
      </form>
      <p
        v-if="saveMessage"
        class="save-message"
      >
        {{ saveMessage }}
      </p>
    </section>

    <section class="library-list">
      <div
        v-if="filteredPalettes.length === 0"
        class="empty-state"
      >
        <p>Пока нет сохранённых палитр. Сохраните палитру из генератора.</p>
      </div>
      <div
        v-else
        class="palette-cards"
      >
        <article
          v-for="palette in filteredPalettes"
          :key="palette.id"
          class="palette-card"
        >
          <header class="palette-card-header">
            <div>
              <input
                v-model="palette.name"
                type="text"
                class="text-input name-input"
                @change="updatePalette(palette)"
              />
              <p class="palette-meta">
                {{ formatDate(palette.createdAt) }}
              </p>
            </div>
            <button
              type="button"
              class="favorite-btn"
              :class="{ 'is-favorite': palette.favorite }"
              @click="toggleFavorite(palette)"
              :title="palette.favorite ? 'Убрать из избранного' : 'Добавить в избранное'"
            >
              {{ palette.favorite ? '★' : '☆' }}
            </button>
          </header>

          <div class="palette-swatches">
            <div
              v-for="(color, index) in palette.colors"
              :key="palette.id + '-' + index"
              class="swatch"
              :style="{ backgroundColor: color }"
            >
              <span class="swatch-label">{{ color }}</span>
            </div>
          </div>

          <div class="palette-tags">
            <div class="tags-display" v-if="palette.tags && palette.tags.length">
              <span class="tag-label">Теги:</span>
              <span
                v-for="tag in palette.tags"
                :key="tag"
                class="tag-badge"
              >
                {{ tag }}
              </span>
            </div>
            <TagInput v-model="palette.tags" />
          </div>

          <footer class="palette-actions">
            <button
              type="button"
              class="secondary-button"
              @click="loadToGenerator(palette)"
            >
              Загрузить в генератор
            </button>
            <button
              type="button"
              class="remove-button"
              @click="removePalette(palette.id)"
            >
              Удалить
            </button>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import TagInput from './TagInput.vue'

const LIB_STORAGE_KEY = 'palette-library'
const CURRENT_STORAGE_KEY = 'palette-generator-current'

export default {
  name: 'PaletteLibrary',
  components: {
    TagInput,
  },
  setup() {
    const palettes = ref([])
    const searchQuery = ref('')
    const filterMode = ref('all')
    const newPaletteName = ref('')
    const newPaletteTags = ref([])
    const saveMessage = ref('')

    const loadLibrary = () => {
      try {
        const raw = localStorage.getItem(LIB_STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          palettes.value = parsed
        }
      } catch {
        // ignore
      }
    }

    const saveLibrary = () => {
      try {
        localStorage.setItem(LIB_STORAGE_KEY, JSON.stringify(palettes.value))
      } catch {
        // ignore
      }
    }

    const saveCurrentPalette = () => {
      try {
        const raw = localStorage.getItem(CURRENT_STORAGE_KEY)
        if (!raw) {
          saveMessage.value = 'Нет текущей палитры в генераторе.'
          return
        }
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed.colors) || parsed.colors.length === 0) {
          saveMessage.value = 'Некорректная палитра.'
          return
        }

        const palette = {
          id: Date.now(),
          name: newPaletteName.value.trim() || 'Без названия',
          colors: parsed.colors.map((c) => c.hex),
          tags: [...newPaletteTags.value],
          favorite: false,
          createdAt: new Date().toISOString(),
        }
        palettes.value.unshift(palette)
        newPaletteName.value = ''
        newPaletteTags.value = []
        saveMessage.value = 'Палитра сохранена.'
        saveLibrary()
      } catch {
        saveMessage.value = 'Ошибка при сохранении палитры.'
      }
    }

    const filteredPalettes = computed(() => {
      const q = searchQuery.value.toLowerCase().trim()
      return palettes.value.filter((p) => {
        if (filterMode.value === 'favorites' && !p.favorite) return false
        if (!q) return true
        const inName = p.name.toLowerCase().includes(q)
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q))
        return inName || inTags
      })
    })

    const toggleFavorite = (palette) => {
      const idx = palettes.value.findIndex((p) => p.id === palette.id)
      if (idx !== -1) {
        palettes.value[idx] = { ...palettes.value[idx], favorite: !palettes.value[idx].favorite }
        saveLibrary()
      }
    }

    const updatePalette = (palette) => {
      const idx = palettes.value.findIndex((p) => p.id === palette.id)
      if (idx !== -1) {
        palettes.value[idx] = { ...palette }
        saveLibrary()
      }
    }

    const removePalette = (id) => {
      palettes.value = palettes.value.filter((p) => p.id !== id)
      saveLibrary()
    }

    const loadToGenerator = (palette) => {
      // сохраняем палитру как текущую для генератора
      const payload = {
        colorCount: palette.colors.length,
        colors: palette.colors.map((hex, idx) => ({
          id: Date.now() + idx,
          hex,
          locked: false,
        })),
      }
      localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(payload))
      saveMessage.value = 'Палитра загружена в генератор. Перейдите на вкладку "Генератор".'
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString('ru-RU')
    }

    onMounted(() => {
      loadLibrary()
    })

    watch(
      palettes,
      () => {
        saveLibrary()
      },
      { deep: true },
    )

    return {
      palettes,
      searchQuery,
      filterMode,
      newPaletteName,
      newPaletteTags,
      saveMessage,
      filteredPalettes,
      saveCurrentPalette,
      toggleFavorite,
      updatePalette,
      removePalette,
      loadToGenerator,
      formatDate,
    }
  },
}
</script>

<style scoped>
.library-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.library-header h2 {
  font-size: 1.8rem;
  margin-bottom: 0.3rem;
}

.library-header p {
  color: #555;
  max-width: 640px;
}

.library-controls {
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
  min-width: 220px;
}

.text-input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.select-input {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.save-current {
  padding: 1rem 1.25rem 1.2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
}

.save-current h3 {
  margin-bottom: 0.3rem;
}

.hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.7rem;
}

.save-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: flex-end;
}

.save-form-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.save-message {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #059669;
}

.library-list {
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
}

.palette-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.palette-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  padding: 0.9rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.palette-card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.name-input {
  font-weight: 600;
}

.palette-meta {
  font-size: 0.8rem;
  color: #6b7280;
}

.favorite-btn {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  color: #d1d5db;
  transition: transform 0.15s ease, color 0.15s ease;
  padding: 0.25rem;
  margin: 0;
  outline: none;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.favorite-btn:hover {
  transform: scale(1.1);
  color: #f59e0b;
}

.favorite-btn:focus {
  outline: none;
}

.favorite-btn.is-favorite {
  color: #f59e0b;
}

.palette-swatches {
  display: flex;
  gap: 0.3rem;
}

.swatch {
  flex: 1;
  border-radius: 8px;
  min-height: 48px;
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

.palette-tags {
  margin-top: 0.3rem;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.tag-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.tag-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 500;
}

.palette-actions {
  margin-top: 0.3rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
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

.remove-button {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: none;
  background-color: #ef4444;
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .library-controls {
    flex-direction: column;
  }

  .save-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>



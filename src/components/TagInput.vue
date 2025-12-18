<template>
  <div class="tag-input">
    <div class="tags">
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="tag"
      >
        {{ tag }}
        <button
          type="button"
          class="remove-btn"
          @click="removeTag(tag)"
        >
          ×
        </button>
      </span>
    </div>
    <input
      v-model="inputValue"
      type="text"
      class="tag-input-field"
      placeholder="Добавьте тег и нажмите Enter"
      @keyup.enter.prevent="addTag"
    />
  </div>
</template>

<script>
export default {
  name: 'TagInput',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      inputValue: '',
    }
  },
  methods: {
    addTag() {
      const trimmed = this.inputValue.trim()
      if (!trimmed || this.modelValue.includes(trimmed)) return
      this.$emit('update:modelValue', [...this.modelValue, trimmed])
      this.inputValue = ''
    },
    removeTag(tag) {
      this.$emit(
        'update:modelValue',
        this.modelValue.filter((t) => t !== tag),
      )
    },
  },
}
</script>

<style scoped>
.tag-input {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background-color: #e5e7eb;
  font-size: 0.8rem;
}

.remove-btn {
  margin-left: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
}

.tag-input-field {
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 0.87rem;
}
</style>



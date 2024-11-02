<script setup lang="ts">
import { ref, watch } from 'vue'

export type TaskSearchEmits = { search: [term: string | null] }
export interface TaskSearchProps {
  searchable?: boolean
}

defineProps<TaskSearchProps>()
const emit = defineEmits<TaskSearchEmits>()

const term = ref('')

watch(term, (value) => {
  emit('search', value.trim() ?? null)
})

const resetSearchTerm = () => (term.value = '')
</script>

<template>
  <IconField>
    <InputIcon class="pi pi-search" />
    <InputText
      type="search"
      class="s-search"
      placeholder="Search"
      v-model="term"
      :disabled="!searchable && !term.trim()"
      :style="{ width: '100%' }"
    />
    <InputIcon
      class="pi pi-times"
      :style="{ fontSize: '0.85rem', visibility: term ? 'visible' : 'hidden' }"
      @click="resetSearchTerm"
    />
  </IconField>
</template>

<style scoped>
.s-search {
  box-shadow: none;
  border: 1px solid transparent;
  background: var(--s-surface-elevated);
  background: rgba(from var(--s-surface-elevated) r g b / 0.68);
}

.s-search:focus-visible {
  border: 1px solid var(--p-inputtext-focus-border-color);
}
</style>

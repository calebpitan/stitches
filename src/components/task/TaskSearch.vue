<script setup lang="ts">
import { ref, watch } from 'vue'

export interface TaskSearchProps {
  searchable?: boolean
  onSearch: (term: string | null) => void
}

const term = ref('')
const props = defineProps<TaskSearchProps>()

watch(term, (value) => {
  props.onSearch(value.trim() ?? null)
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
  background: var(--s-surface-ground);
}

.s-search:focus-visible {
  border: 1px solid var(--p-inputtext-focus-border-color);
}
</style>

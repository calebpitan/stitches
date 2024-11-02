<script setup lang="ts">
import type { BaseTaskListItem } from '@/interfaces/task'

import TaskAdd, { type TaskAddEmits } from './TaskAdd.vue'
import TaskSearch, { type TaskSearchEmits, type TaskSearchProps } from './TaskSearch.vue'
import TaskSort, { type TaskSortConfig, type TaskSortEmits } from './TaskSort.vue'

interface TaskToolbarProps extends TaskSearchProps {
  searchable?: boolean
}

defineProps<TaskToolbarProps>()
const emit = defineEmits<TaskSearchEmits & TaskAddEmits & TaskSortEmits>()

function addItem(item: BaseTaskListItem) {
  emit('add', item)
}

function searchTerm(term: string | null) {
  emit('search', term)
}

function sortItems(config: TaskSortConfig) {
  emit('sort', config)
}
</script>

<template>
  <div class="s-toolbar">
    <TaskSearch class="s-toolbar-search" :searchable="searchable" @search="searchTerm($event)" />

    <div class="s-tools">
      <TaskAdd @add="addItem($event)" />
      <TaskSort @sort="sortItems($event)" />
    </div>
  </div>
</template>

<style scoped>
.s-toolbar {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.s-toolbar > * + * {
  margin-left: 0rem;
}

.s-toolbar-search {
  flex: 1 1 auto;
}

.s-tools {
  --p-button-icon-only-width: var(--s-base-padding);

  display: inline-flex;
  place-items: center;
  gap: 0.5rem;
  flex: 0 1 auto;
  margin-inline-start: auto;
}
</style>

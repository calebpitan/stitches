<script setup lang="ts">
import TaskAdd, { type TaskAddProps } from './TaskAdd.vue'
import TaskSearch, { type TaskSearchProps } from './TaskSearch.vue'
import TaskSort, { type TaskSortProps } from './TaskSort.vue'

interface TaskToolbarProps extends TaskSearchProps, TaskAddProps, TaskSortProps {
  searchable?: boolean
}

defineProps<TaskToolbarProps>()
</script>

<template>
  <div class="s-toolbar">
    <TaskSearch class="s-toolbar-search" :searchable="searchable" @search="onSearch" />

    <div class="s-tools">
      <TaskAdd @add="onAdd" />
      <TaskSort @sort="onSort" />
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

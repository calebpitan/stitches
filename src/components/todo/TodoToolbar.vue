<script setup lang="ts">
import TodoAdd, { type TaskAddProps } from './TodoAdd.vue'
import TodoSearch, { type TaskSearchProps } from './TodoSearch.vue'

interface TaskToolbarProps extends TaskSearchProps, TaskAddProps {
  searchable?: boolean
}

defineProps<TaskToolbarProps>()
</script>

<template>
  <div class="s-toolbar">
    <TodoSearch class="s-toolbar-search" :onSearch="onSearch" :searchable="searchable" />
    <div class="s-tools">
      <TodoAdd :onAdd="onAdd" />
    </div>
  </div>
</template>

<style scoped>
.s-toolbar {
  display: flex;
  flex-direction: row;
}

.s-toolbar > * + * {
  margin-left: 0rem;
}

.s-toolbar-search {
  flex: 0 1 auto;
}

.s-tools {
  flex: 1 0 auto;
}
</style>

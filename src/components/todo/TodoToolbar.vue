<script setup lang="ts">
import TodoSearch, { type TodoSearchProps } from './TodoSearch.vue'
import TodoAdd, { type TodoAddProps } from './TodoAdd.vue'

interface TodoToolbarProps extends TodoSearchProps, TodoAddProps {
  searchable?: boolean
}

defineProps<TodoToolbarProps>()
</script>

<template>
  <div class="s-toolbar">
    <TodoSearch class="s-toolbar-search" :onSearchTodos="onSearchTodos" :searchable="searchable" />
    <div class="s-tools">
      <TodoAdd :onAddTodo="onAddTodo" />
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

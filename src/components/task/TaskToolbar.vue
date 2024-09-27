<script setup lang="ts">
import TaskAdd, { type TaskAddProps } from './TaskAdd.vue'
import TaskSearch, { type TaskSearchProps } from './TaskSearch.vue'

interface TaskToolbarProps extends TaskSearchProps, TaskAddProps {
  searchable?: boolean
}

defineProps<TaskToolbarProps>()
</script>

<template>
  <div class="s-toolbar">
    <TaskSearch class="s-toolbar-search" :searchable="searchable" @search="onSearch" />

    <div class="s-tools">
      <TaskAdd @add="onAdd" />
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

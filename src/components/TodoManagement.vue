<script setup lang="ts">
import { useTodoStore } from '@/stores/todo'
import { computed } from 'vue'
import ManagementPresentation from './management/ManagementPresentation.vue'
import { useTodoTagStore } from '@/stores/tag'
import ManagementSchedule from './management/ManagementSchedule.vue'

const todoTagStore = useTodoTagStore()
const todoStore = useTodoStore()
const selectedTodo = computed(() => {
  const selected = todoStore.todos.find((t) => t.id === todoStore.selected)
  return selected ?? null
})

const reviewTodo = todoStore.updateItem
const cretateTodoTag = todoTagStore.createTag
</script>

<template>
  <div class="s-todo-management-container">
    <div class="s-todo-management">
      <div v-if="selectedTodo">
        <ManagementPresentation
          :key="selectedTodo.id"
          :todo="selectedTodo"
          :tags="todoTagStore.tags"
          @review="reviewTodo"
          @create-tag="cretateTodoTag"
        />

        <ManagementSchedule />
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-todo-management-container {
  color: inherit;
}

.s-todo-management {
  padding: 2rem;
}
</style>

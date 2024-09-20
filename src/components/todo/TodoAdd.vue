<script setup lang="ts">
import type { BaseTodoListItem } from '@/interfaces/todo'

export interface TodoAddProps {
  onAddTodo: (item: BaseTodoListItem) => void
}

const props = defineProps<TodoAddProps>()

function addEmptyTodo() {
  props.onAddTodo({ title: '', summary: '' })
}
</script>

<template>
  <Button type="button" id="new-todo-button" icon="pi pi-plus" aria-label="Add" @click="addEmptyTodo" rounded text />
</template>

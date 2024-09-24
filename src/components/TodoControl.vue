<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { $dt } from '@primevue/themes'

import Fuse from 'fuse.js'
import type { MeterItem } from 'primevue/metergroup'

import type { TodoListItem } from '@/interfaces/todo'
import { useTodoStore } from '@/stores/todo'

import EmptyTasks from './empty/EmptyTasks.vue'
import TodoGroup from './todo/TodoGroup.vue'
import TodoHeader from './todo/TodoHeader.vue'
import TodoList from './todo/TodoList.vue'
import TodoToolbar from './todo/TodoToolbar.vue'

type Filters = 'Completed' | 'Pending' | 'Recent' | 'Due' | 'Scheduled' | 'Today'

const todoStore = useTodoStore()

const storedTodos = computed(() => todoStore.todos)

const tasks = ref(todoStore.todos)
const filter = ref<Filters | null>(null)
const activeSearchTerm = ref<string | null>(null)
const fuse = new Fuse(todoStore.todos, { keys: ['title', 'description'], threshold: 0.5 })

watch(todoStore.todos, (latestTodos) => {
  fuse.setCollection(latestTodos)
})

const maxAddedAt = computed(() => {
  return storedTodos.value
    .map((t) => t.addedAt.setHours(0, 0, 0, 0).valueOf())
    .reduce((prev, next) => Math.max(prev.valueOf(), next.valueOf()))
})

const grouped = computed<{ [P in Lowercase<Filters>]: TodoListItem[] }>(() => {
  const completed = storedTodos.value.filter((t) => t.completed)
  const pending = storedTodos.value.filter((t) => !t.completed)
  const recent = storedTodos.value.filter((t) => {
    return t.addedAt.setHours(0, 0, 0, 0).valueOf() === maxAddedAt.value
  })

  return {
    completed,
    pending,
    recent,
    due: [],
    scheduled: [],
    today: []
  }
})

const groups = computed<MeterItem[]>(() => {
  const group = grouped.value
  const done = group.completed.length
  const pending = group.pending.length
  const recent = group.recent.length
  const total = storedTodos.value.length
  const percent = (ratio: number) => ratio * 100

  return [
    {
      label: 'Completed',
      value: done && percent(done / total),
      color: $dt('green.500').value,
      icon: 'pi pi-check-circle'
    },
    {
      label: 'Pending',
      value: pending && percent(pending / total),
      color: $dt('amber.500').value,
      icon: 'pi pi-circle'
    },
    {
      label: 'Recent',
      value: recent && percent(recent / total),
      color: $dt('blue.500').value,
      icon: 'pi pi-history'
    },
    {
      label: 'Due',
      value: 0,
      color: $dt('zinc.500').value,
      icon: 'pi pi-calendar-clock'
    },
    {
      label: 'Scheduled',
      value: 0,
      color: $dt('red.600').value,
      icon: 'pi pi-clock'
    },
    {
      label: 'Today',
      value: 0,
      color: $dt('stone.950').value,
      icon: 'pi pi-calendar'
    }
  ]
})

const addTodo = todoStore.addItem
const toggleTodo = todoStore.toggleItem
const removeTodo = todoStore.removeItem
const reviewTodo = todoStore.updateItem
const selectTodo = todoStore.selectItem

function searchTodos(term: string | null) {
  activeSearchTerm.value = term
  if (!term) return void (tasks.value = todoStore.todos)

  const results = fuse.search(term)
  tasks.value = results.map((res) => res.item)
}

function filterTodos(label: Filters | null) {
  filter.value = label
}

watch(filter, () => {
  if (!filter.value) return (tasks.value = todoStore.todos)
  const label = filter.value.toLowerCase() as Lowercase<Filters>
  tasks.value = grouped.value[label]
})
</script>

<template>
  <div class="s-todo-control">
    <div class="s-todo-control-bar">
      <TodoHeader class="s-todo-header-customize">
        <h1 class="s-title">{{ filter ?? 'Organizer' }}</h1>
        <TodoToolbar
          @search-todos="searchTodos"
          @add-todo="addTodo"
          :searchable="tasks.length > 0"
        />
      </TodoHeader>
      <TodoList
        :items="tasks"
        @add-todo="addTodo"
        @search-todos="searchTodos"
        @toggle="toggleTodo"
        @delete="removeTodo"
        @review="reviewTodo"
        @select-item="selectTodo"
      >
        <template #empty>
          <EmptyTasks style="margin-block-start: 10rem;">
            <template v-if="activeSearchTerm" #message>
              <span>No tasks matching "{{ activeSearchTerm }}"</span>
            </template>
          </EmptyTasks>
        </template>
      </TodoList>
    </div>

    <TodoGroup
      class="s-todo-control-group"
      :groups="groups"
      :total="storedTodos.length"
      :filter="filter"
      @filter="filterTodos"
    />
  </div>
</template>

<style scoped>
.s-todo-control {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.s-todo-control-bar {
  width: 100%;
  padding: 2rem;
  overflow-y: auto;
  order: 1;
  flex: 1 1 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.s-todo-header-customize {
  margin-inline: -2rem;
  padding: 0rem 2rem 1rem;
  position: relative;
  z-index: 1;
  min-width: 100%;
  width: auto;
  background-color: var(--s-surface-middle);
}

.s-todo-control-group {
  max-width: 370px;
  height: 100%;
  padding: 2rem;
  background-color: var(--s-surface-ground);
  flex: 0 1 100%;
  height: 100%;
}

.s-title {
  font-weight: 700;
  margin-block-start: 0;
  margin-block-end: 1rem;
}
</style>

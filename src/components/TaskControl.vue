<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { $dt } from '@primevue/themes'

import Fuse from 'fuse.js'
import type { MeterItem } from 'primevue/metergroup'

import type { TaskListItem } from '@/interfaces/task'
import { useTaskScheduleStore } from '@/stores/schedule'
import { useTaskStore } from '@/stores/task'
import { evaluate } from '@/utils'

import EmptyTasks from './empty/EmptyTasks.vue'
import TaskGroup from './task/TaskGroup.vue'
import TaskHeader from './task/TaskHeader.vue'
import TaskList from './task/TaskList.vue'
import TaskToolbar from './task/TaskToolbar.vue'

type Filters = 'Completed' | 'Pending' | 'Recent' | 'Due' | 'Scheduled' | 'Today'

const taskStore = useTaskStore()
const taskScheduleStore = useTaskScheduleStore()

const storedTasks = computed(() => taskStore.tasks)
const scheduledTasks = computed(() => taskScheduleStore.schedules)

const tasks = ref(taskStore.tasks)
const filter = ref<Filters | null>(null)
const activeSearchTerm = ref<string | null>(null)
const fuse = new Fuse(taskStore.tasks, { keys: ['title', 'summary'], threshold: 0.5 })

watch(taskStore.tasks, (latest) => {
  fuse.setCollection(latest)
})

const maxAddedAt = computed(() => {
  return storedTasks.value
    .map((t) => t.addedAt.setHours(0, 0, 0, 0).valueOf())
    .reduce((prev, next) => Math.max(prev.valueOf(), next.valueOf()))
})

const grouped = computed<{ [P in Lowercase<Filters>]: TaskListItem[] }>(() => {
  const completed = storedTasks.value.filter((t) => t.completed)
  const pending = storedTasks.value.filter((t) => !t.completed)
  const recent = storedTasks.value.filter((t) => {
    return t.addedAt.setHours(0, 0, 0, 0).valueOf() === maxAddedAt.value
  })

  const scheduled = evaluate(() => {
    const map = new Map(scheduledTasks.value.map((s) => [s.taskId, s.id]))
    return storedTasks.value.filter((t) => map.has(t.id))
  })

  return {
    completed,
    pending,
    recent,
    due: [],
    scheduled,
    today: []
  }
})

const groups = computed<MeterItem[]>(() => {
  const group = grouped.value
  const done = group.completed.length
  const pending = group.pending.length
  const recent = group.recent.length
  const scheduled = group.scheduled.length
  const total = storedTasks.value.length
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
      value: scheduled && percent(scheduled / total),
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

const addTask = taskStore.addTask
const toggleTask = taskStore.toggleTask
const removeTask = taskStore.removeTask
const reviewTask = taskStore.updateTask
const selectTask = taskStore.selectTask

function searchTasks(term: string | null) {
  activeSearchTerm.value = term
  if (!term) return void (tasks.value = taskStore.tasks)

  const results = fuse.search(term)
  tasks.value = results.map((res) => res.item)
}

function filterTasks(label: Filters | null) {
  filter.value = label
}

watch(filter, () => {
  if (!filter.value) return (tasks.value = taskStore.tasks)
  const label = filter.value.toLowerCase() as Lowercase<Filters>
  tasks.value = grouped.value[label]
})
</script>

<template>
  <div class="s-task-control">
    <div class="s-task-control-bar">
      <TaskHeader class="s-task-header-customize">
        <h1 class="s-title">{{ filter ?? 'Organizer' }}</h1>

        <TaskToolbar @search="searchTasks" @add="addTask" :searchable="tasks.length > 0" />
      </TaskHeader>

      <TaskList
        :items="tasks"
        @toggle="toggleTask"
        @delete="removeTask"
        @review="reviewTask"
        @select="selectTask"
      >
        <template #empty>
          <EmptyTasks style="margin-block-start: 10rem">
            <template v-if="activeSearchTerm" #message>
              <span>No tasks matching "{{ activeSearchTerm }}"</span>
            </template>
          </EmptyTasks>
        </template>
      </TaskList>
    </div>

    <TaskGroup
      class="s-task-control-group"
      :groups="groups"
      :total="storedTasks.length"
      :filter="filter"
      @filter="filterTasks"
    />
  </div>
</template>

<style scoped>
.s-task-control {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.s-task-control-bar {
  width: 100%;
  padding: 2rem;
  overflow-y: auto;
  order: 1;
  flex: 1 1 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.s-task-header-customize {
  margin-inline: -2rem;
  padding: 0rem 2rem 1rem;
  position: relative;
  z-index: 1;
  min-width: 100%;
  width: auto;
  background-color: var(--s-surface-middle);
}

.s-task-control-group {
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

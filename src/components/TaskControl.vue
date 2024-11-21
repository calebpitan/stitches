<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { $dt } from '@primevue/themes'
import { useElementBounding } from '@vueuse/core'

import Fuse from 'fuse.js'
import type { MeterItem } from 'primevue/metergroup'

import type { TaskListItem } from '@/interfaces/task'
import { useTaskScheduleStore } from '@/stores/schedule'
import { useTaskStore } from '@/stores/task'
import { evaluate } from '@/utils'

import SidebarControl from './bars/SidebarControl.vue'
import EmptyTasks from './empty/EmptyTasks.vue'
import TaskGroup from './task/TaskGroup.vue'
import TaskHeader from './task/TaskHeader.vue'
import TaskList from './task/TaskList.vue'
import TaskToolbar from './task/TaskToolbar.vue'

type Filters = 'Completed' | 'Pending' | 'Recent' | 'Due' | 'Scheduled' | 'Today'
type GroupedTask = { [P in Lowercase<Filters>]: TaskListItem[] } & {
  get(label: Lowercase<Filters>): TaskListItem[]
}

export type TaskGroupbarViewChangeEvent = {
  /**
   * The type of visibility change; where `shifted` represents
   * out of the viewport and `unshifted` represents within the
   * viewport.
   */
  type: 'shifted' | 'unshifted'
  /**
   * The x-offset which is the inline size of the taskgroup bar
   */
  offset: number
}

interface TaskControlProps {
  onGroupbarViewChange?(event: TaskGroupbarViewChangeEvent): void
}

const props = withDefaults(defineProps<TaskControlProps>(), {})

const taskStore = useTaskStore()
const taskScheduleStore = useTaskScheduleStore()

const storedTasks = computed(() => taskStore.tasks)
const scheduledTasks = computed(() => taskScheduleStore.schedules)

const tasks = ref(taskStore.tasks)
const filter = ref<Filters | null>(null)
const activeSearchTerm = ref<string | null>(null)
const fuse = new Fuse(taskStore.tasks, { keys: ['title', 'summary'], threshold: 0.5 })

const taskGroupbarRef = ref<HTMLElement | null>(null)
const taskGroupBarIsOpen = ref(true)
const taskGroupbarRect = useElementBounding(taskGroupbarRef)

const maxAddedAt = computed(() => {
  return storedTasks.value
    .map((t) => t.addedAt.setHours(0, 0, 0, 0).valueOf())
    .reduce((prev, next) => Math.max(prev.valueOf(), next.valueOf()))
})

const grouped = computed<GroupedTask>(() => {
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
    today: [],
    get(label: Lowercase<Filters>) {
      return this[label]
    },
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
      icon: 'pi pi-check-circle',
    },
    {
      label: 'Pending',
      value: pending && percent(pending / total),
      color: $dt('amber.500').value,
      icon: 'pi pi-circle',
    },
    {
      label: 'Recent',
      value: recent && percent(recent / total),
      color: $dt('blue.500').value,
      icon: 'pi pi-history',
    },
    {
      label: 'Due',
      value: 0,
      color: $dt('zinc.500').value,
      icon: 'pi pi-calendar-clock',
    },
    {
      label: 'Scheduled',
      value: scheduled && percent(scheduled / total),
      color: $dt('red.600').value,
      icon: 'pi pi-clock',
    },
    {
      label: 'Today',
      value: 0,
      color: $dt('stone.950').value,
      icon: 'pi pi-calendar',
    },
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

watch(taskStore.tasks, (latest) => {
  fuse.setCollection(latest)
})

watch(filter, () => {
  if (!filter.value) return (tasks.value = taskStore.tasks)
  const label = filter.value.toLowerCase() as Lowercase<Filters>
  tasks.value = grouped.value.get(label)
})

watch(taskGroupBarIsOpen, (isOpen) => {
  if (isOpen) {
    return props.onGroupbarViewChange?.({
      type: 'unshifted',
      offset: 0,
    })
  }

  return props.onGroupbarViewChange?.({
    type: 'shifted',
    offset: -1 * taskGroupbarRect.width.value,
  })
})
</script>

<template>
  <div class="s-task-control">
    <div
      :class="['s-task-control-bar', { unshifted: !taskGroupBarIsOpen }]"
      :style="{ '--s-taskgroupbar-width': `${taskGroupbarRect.width.value.toFixed(2)}px` }"
    >
      <div class="s-task-control-header">
        <SidebarControl
          class="s-task-control-sidebar-control"
          :style="{ visibility: taskGroupBarIsOpen ? 'hidden' : undefined }"
          :open="taskGroupBarIsOpen"
          @toggle="taskGroupBarIsOpen = $event"
        />
        <TaskHeader class="s-task-header-customize">
          <h1 class="s-title">{{ filter ?? 'Organizer' }}</h1>

          <TaskToolbar
            @search="searchTasks"
            @add="addTask"
            @sort="console.log($event)"
            :searchable="tasks.length > 0"
          />
        </TaskHeader>
      </div>

      <div class="s-task-control-bar-items">
        <TaskList
          :items="tasks"
          @toggle="toggleTask"
          @delete="removeTask"
          @review="reviewTask"
          @select="selectTask"
        >
          <template #empty>
            <EmptyTasks
              style="margin-block-start: 10rem"
              @empty-action="addTask({ title: '', summary: '' })"
            >
              <template v-if="activeSearchTerm" #message>
                <span>No tasks matching "{{ activeSearchTerm }}"</span>
              </template>
            </EmptyTasks>
          </template>
        </TaskList>
      </div>
    </div>

    <div
      ref="taskGroupbarRef"
      :class="['s-task-control-group-bar', { shifted: !taskGroupBarIsOpen }]"
      :aria-hidden="!taskGroupBarIsOpen ? true : undefined"
    >
      <SidebarControl
        class="s-task-control-sidebar-control"
        :style="{ visibility: !taskGroupBarIsOpen ? 'hidden' : undefined }"
        :open="taskGroupBarIsOpen"
        @toggle="taskGroupBarIsOpen = $event"
      />
      <TaskGroup
        class="s-task-control-group"
        :groups="groups"
        :total="storedTasks.length"
        :filter="filter"
        @filter="filterTasks"
      />
    </div>
  </div>
</template>

<style scoped>
.s-task-control {
  --s-transition-timing: 0.35s ease;

  display: flex;
  flex-direction: row;
  height: 100%;
  position: relative;
}

.s-task-control-bar {
  width: 100%;
  overflow-y: auto;
  order: 1;
  flex: 1 1 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-inline-start: var(--s-taskgroupbar-width);
  transition: margin-inline-start var(--s-transition-timing);

  &.unshifted {
    margin-inline-start: 0;
  }
}

.s-task-control-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(from var(--s-surface-ground) r g b / 0.37);
  backdrop-filter: blur(15px);
  filter: saturate(180%);
}

.s-task-control-bar-items {
  padding: 0 var(--s-base-padding) var(--s-base-padding);
  flex: 1 1 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.s-task-control-sidebar-control {
  padding: 0 calc(var(--s-base-padding) - (var(--p-button-icon-only-width) - 1em) / 2);
}

.s-task-header-customize {
  /* margin-inline: calc(-1 * var(--s-base-padding)); */
  /* padding: 0rem var(--s-base-padding) 2.5rem; */
  padding: var(--s-base-padding);
  position: relative;
  min-width: 100%;
  width: auto;
}

.s-task-control-group-bar {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 0 1 auto;
  background-color: var(--s-surface-elevated);
  position: absolute;
  z-index: calc(var(--s-sidebar-zindex) * 2);
  transition: transform var(--s-transition-timing);

  &.shifted {
    transform: translate(-100%);
  }

  @media (--lg-viewport-min) and (--lg-viewport-max) {
    max-width: 250px;
  }

  @media (--xl-viewport-min) {
    max-width: 370px;
  }
}

.s-task-control-group {
  height: 100%;
  padding: var(--s-base-padding);
  /* flex: 0 1 100%; */
  height: 100%;
}

.s-title {
  font-weight: 700;
  margin-block-start: 0;
  margin-block-end: 1rem;
  line-height: 1;
}
</style>

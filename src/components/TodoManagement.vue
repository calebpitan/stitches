<script setup lang="ts">
import { computed } from 'vue'

import type { BaseTaskSchedule } from '@/interfaces/schedule'
import { useTaskScheduleStore } from '@/stores/schedule'
import { useTodoTagStore } from '@/stores/tag'
import { useTaskStore } from '@/stores/task'

import ManagementPresentation from './management/ManagementPresentation.vue'
import ManagementSchedule from './management/ManagementSchedule.vue'

const taskTagStore = useTodoTagStore()
const taskStore = useTaskStore()
const taskScheduleStore = useTaskScheduleStore()

const selectedTask = computed(() => taskStore.findSelected())

const taskSchedule = computed(() => {
  if (!selectedTask.value) return null
  return taskScheduleStore.findSchedule(selectedTask.value.id)
})

function createSchedule(schedule: BaseTaskSchedule) {
  if (!selectedTask.value) return
  taskScheduleStore.upsertSchedule(selectedTask.value.id, schedule)
}

const reviewTask = taskStore.updateTask
const createTaskTag = taskTagStore.createTag
</script>

<template>
  <div class="s-task-management-container">
    <div class="s-task-management">
      <div v-if="selectedTask" style="display: flex; flex-direction: column">
        <ManagementPresentation
          class="s-task-management-presentation"
          :key="selectedTask.id"
          :task="selectedTask"
          :tags="taskTagStore.tags"
          @review="reviewTask"
          @create-tag="createTaskTag"
        />

        <ManagementSchedule
          class="s-task-management-schedule"
          :key="selectedTask.id"
          :task-id="selectedTask.id"
          :schedule="taskSchedule"
          @schedule="createSchedule"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-task-management-container {
  color: inherit;
}

.s-task-management {
  padding: 2rem;
  --s-presentation-thread-height: 100px;
}

.s-task-management-presentation {
  position: static;
}

.s-task-management-schedule {
  position: relative;
  align-self: flex-start;
}
</style>

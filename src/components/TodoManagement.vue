<script setup lang="ts">
import { computed } from 'vue'

import { useTaskScheduleStore } from '@/stores/schedule'
import { useTodoTagStore } from '@/stores/tag'
import { useTaskStore } from '@/stores/task'

import ManagementPresentation from './management/ManagementPresentation.vue'
import ManagementSchedule from './management/ManagementSchedule.vue'

const taskTagStore = useTodoTagStore()
const taskStore = useTaskStore()
const taskScheduleStore = useTaskScheduleStore()

const selectedTask = computed(() => {
  const selected = taskStore.tasks.find((t) => t.id === taskStore.selected)
  return selected ?? null
})

const taskSchedule = computed(() => {
  return taskScheduleStore.schedules.find((s) => s.taskId === selectedTask.value?.id)
})

const reviewTask = taskStore.updateItem
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

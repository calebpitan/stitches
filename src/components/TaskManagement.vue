<script setup lang="ts">
import { computed } from 'vue'

import type { BaseTaskSchedule } from '@/interfaces/schedule'
import { useTaskScheduleStore } from '@/stores/schedule'
import { useTaskTagStore } from '@/stores/tag'
import { useTaskStore } from '@/stores/task'
import { SchedulerWorker } from '@/worker'

import MgmtPresentation from './management/MgmtPresentation.vue'
import MgmtScheduler from './management/MgmtScheduler.vue'

const taskTagStore = useTaskTagStore()
const taskStore = useTaskStore()
const taskScheduleStore = useTaskScheduleStore()

const selectedTask = computed(() => taskStore.findSelected())
const controller = SchedulerWorker()

const taskSchedule = computed(() => {
  if (!selectedTask.value) return null
  return taskScheduleStore.findSchedule(selectedTask.value.id)
})

function createSchedule(schedule: BaseTaskSchedule) {
  if (!selectedTask.value) return
  taskScheduleStore.upsertSchedule(selectedTask.value.id, schedule)
  // controller.add(JSON.p)
}

function clearSchedule(id: string) {
  if (!selectedTask.value) return
  taskScheduleStore.deleteSchedule(id)
}

const reviewTask = taskStore.updateTask
const createTaskTag = taskTagStore.createTag

console.log(controller)
</script>

<template>
  <div class="s-task-mgmt-container">
    <div class="s-task-mgmt">
      <div v-if="selectedTask" style="display: flex; flex-direction: column">
        <MgmtPresentation
          class="s-task-mgmt-presentation"
          :key="selectedTask.id"
          :task="selectedTask"
          :tags="taskTagStore.tags"
          @review="reviewTask"
          @create-tag="createTaskTag"
        />

        <MgmtScheduler
          class="s-task-mgmt-schedule"
          :key="selectedTask.id"
          :task-id="selectedTask.id"
          :schedule="taskSchedule"
          @schedule="createSchedule"
          @clear-schedule="clearSchedule"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-task-mgmt-container {
  color: inherit;
}

.s-task-mgmt {
  padding: var(--s-base-padding);
}

.s-task-mgmt-presentation {
  position: static;
}

.s-task-mgmt-schedule {
  position: relative;
  align-self: flex-start;
}
</style>

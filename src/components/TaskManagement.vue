<script setup lang="ts">
import { computed, watch } from 'vue'

import type { BaseTaskSchedule } from '@stitches/common'

import type { TaskListItem, TaskTag } from '@/interfaces/task'
import { useClearSchedule, useReplaceSchedule } from '@/services/schedule'
import { useTagsQuery } from '@/services/tags'
import {
  useAddTagToTask,
  useRemoveTagFromTask,
  useReviewTask,
  useTaskQuery,
  useTasksSchedulesQuery,
  useTasksTagsQuery,
} from '@/services/task'
import type { Patch } from '@/services/types'
import { SchedulerWorker } from '@/services/worker/scheduler'
import { useTaskStore } from '@/stores/task'

import Dynamic from './dynamic/Dynamic.vue'
import MgmtPresentation from './management/MgmtPresentation.vue'
import MgmtScheduler from './management/MgmtScheduler.vue'

const controller = SchedulerWorker()

const taskStore = useTaskStore()

const taskQuery = useTaskQuery()
const tasksSchedulesQuery = useTasksSchedulesQuery()
const taskTagsQuery = useTasksTagsQuery()
const tagsQuery = useTagsQuery()
const updateTaskMutation = useReviewTask()
const addTagToTaskMutation = useAddTagToTask()
const removeTagFromTaskMutation = useRemoveTagFromTask()
const clearScheduleMutation = useClearSchedule()
const replaceScheduleMutation = useReplaceSchedule()

const selectedTask = computed(() => taskQuery.task.value.data || null)
const tagsSuggestions = computed(() => tagsQuery.tags.value.data || [])

function replaceSchedule(schedule: BaseTaskSchedule) {
  if (!selectedTask.value) return
  replaceScheduleMutation.mutate(schedule)
}

function clearSchedule(id: string) {
  if (!selectedTask.value) return
  clearScheduleMutation.mutate(id)
}

function addTag(tag: Pick<TaskTag, 'id'> | Pick<TaskTag, 'label'>) {
  if (!selectedTask.value) return
  addTagToTaskMutation.mutate({ id: selectedTask.value.id, data: tag })
}

function removeTag(tag: Pick<TaskTag, 'id'> | Pick<TaskTag, 'label'>) {
  if (!selectedTask.value) return
  removeTagFromTaskMutation.mutate({ id: selectedTask.value.id, data: tag })
}

const reviewTask = (patch: Patch<Partial<TaskListItem>>) => updateTaskMutation.mutate(patch)

watch(
  () => taskStore.selected,
  (selected) => {
    selected ??= ''
    taskQuery.variables.id = selected
    taskTagsQuery.variables.taskIDs = [taskQuery.variables.id]
    tasksSchedulesQuery.variables.taskIDs = [taskQuery.variables.id]
  },
  {
    immediate: true,
  },
)

Object.assign(window, {
  temp1: controller,
  a: {
    id: '01JBF7042PBC1HCSY90JW4W9SC',
    taskId: '01J8SMNWZ5N0CWSD1008K9YN90',
    frequency: {
      type: 'custom',
      until: new Date('2024-11-10T23:00:00.000Z'),
      crons: [
        {
          expression: '18,20 9 * * *',
          frequency: 'day',
        },
        {
          expression: '*/1 * * * *',
          frequency: 'year',
        },
      ],
    },
    timestamp: new Date('2024-10-21T14:16:38.000Z'),
  },
})
</script>

<template>
  <div class="s-task-mgmt-container">
    <div class="s-task-mgmt">
      <div v-if="selectedTask" style="display: flex; flex-direction: column">
        <Dynamic :state="taskQuery.task.value">
          <template #success="{ data: task }">
            <Dynamic :state="taskTagsQuery.tags.value">
              <template #success="{ data: tags }">
                <MgmtPresentation
                  class="s-task-mgmt-presentation"
                  :key="task.id"
                  :task="task"
                  :tags="tags[task.id]"
                  :suggestions="tagsSuggestions"
                  @review="reviewTask"
                  @remove-tag="removeTag($event)"
                  @add-tag="addTag($event)"
                />
              </template>
            </Dynamic>
          </template>
        </Dynamic>

        <Dynamic :state="tasksSchedulesQuery.schedules.value">
          <template #pending>
            <Skeleton height="380px" style="margin-block-start: 2rem" />
          </template>
          <template #success="{ data }">
            <MgmtScheduler
              class="s-task-mgmt-schedule"
              :key="selectedTask.id"
              :task-id="selectedTask.id"
              :schedule="data.at(0) ?? null"
              @schedule="replaceSchedule"
              @clear-schedule="clearSchedule"
            />
          </template>
        </Dynamic>
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

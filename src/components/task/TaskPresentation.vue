<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import type { TaskListItem } from '@/interfaces/task'

import EditableText from '../editable/EditableText.vue'
import OverflowBox from '../overflow/OverflowBox.vue'

type TaskPresentationEmits = {
  toggle: [id: string, completed: boolean]
  review: [id: string, patch: Partial<Pick<TaskListItem, 'title' | 'summary'>>]
  delete: [id: string]
}

interface TaskPresentationProps {
  task: TaskListItem
  focusable: boolean
}

const props = defineProps<TaskPresentationProps>()
const emit = defineEmits<TaskPresentationEmits>()

const completed = ref(props.task.completed ?? false)
const titleRef = ref<InstanceType<typeof EditableText> | null>(null)
const summaryRef = ref<InstanceType<typeof EditableText> | null>(null)
const focusInitiator = ref<HTMLElement | null>(null)
const blurInitiator = ref<HTMLElement | null>(null)

function handleTitleModification(title: string) {
  // console.log(focusInitiator.value)
  // console.log(blurInitiator.value)
  {
    const titleIsEmpty = !props.task.title
    const atLeastOneInitiatorIsset = focusInitiator.value || blurInitiator.value
    const initiatorReceivedFocus = focusInitiator.value === blurInitiator.value
    const isFocusedFromOffCanvas = focusInitiator.value === null
    const shouldPreventRevertAddItemAction =
      titleIsEmpty && atLeastOneInitiatorIsset && (initiatorReceivedFocus || isFocusedFromOffCanvas)

    if (shouldPreventRevertAddItemAction) {
      return titleRef.value?.$el.focus()
    }
  }

  // If this task presentation comes from adding a new empty task, since
  // EditableText only emits the `modify` event when the input loses focus
  // and saving a task with an empty title deletes the task, then we make
  // sure above that whenever the input loses focus to the
  // initiator (add task button, probably), we return the focus back to the
  // input without deleting the empty task yet and removing the inline editor
  // from the screen.
  return emit('review', props.task.id, { title })
}

function handleSummaryModification(summary: string) {
  emit('review', props.task.id, { summary })
}

watch(completed, (latest) => emit('toggle', props.task.id, latest))

onMounted(() => {
  // Whenever a task presentation is mounted with an empty title, focus it.
  if (!props.task.title) {
    titleRef.value?.$el.focus()
  }
})
</script>

<template>
  <div class="s-task-presentation" v-focustrap="{ disabled: !focusable }">
    <div class="s-task-controls">
      <Checkbox
        v-model="completed"
        :name="task.title"
        :aria-label="task.title"
        :tabindex="focusable ? undefined : -1"
        :binary="true"
      />
    </div>

    <div class="s-task-contents">
      <EditableText
        ref="titleRef"
        class="s-task-title"
        placeholder="Title"
        :key="task.title"
        :text="task.title"
        :multiline="false"
        @blur="blurInitiator = $event.relatedTarget"
        @focus="focusInitiator = $event.relatedTarget"
        @modify="handleTitleModification"
      />

      <OverflowBox :fade-color="'var(--s-surface-middle)'">
        <EditableText
          ref="summaryRef"
          class="s-task-summary"
          placeholder="summary..."
          :key="task.summary"
          :text="task.summary"
          :multiline="true"
          :lines="3"
          @modify="handleSummaryModification"
        />
      </OverflowBox>
    </div>

    <div class="s-task-actions">
      <Button
        aria-label="Delete"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        :text="true"
        :rounded="true"
        @click="emit('delete', task.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.s-task-presentation {
  display: flex;
  align-items: center;
  width: 100%;
  flex: 1 1 100%;
  padding: 1rem 0.375rem;
  border-radius: 0.375rem;

  &:hover .s-task-actions {
    opacity: 1;
    visibility: visible;
  }
}

.s-task-controls,
.s-task-contents {
  display: flex;
  flex-direction: column;
}

.s-task-contents {
  margin-inline-start: 1rem;
  width: 100%;
}

.s-task-title {
  font-weight: 600;
  max-height: calc(1.6em * 1);
}

.s-task-summary {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--s-script-secondary);
  max-height: calc(1.6em * 3);
}

.s-task-title,
.s-task-summary {
  position: relative;
  width: fit-content;
  min-width: 100px;
  outline: none;

  &[contenteditable='true']:focus {
    outline: none;
  }
}

.s-task-actions {
  display: flex;
  flex-direction: column;
  opacity: 0.3;
  visibility: hidden;
  transition: opacity 0.4s ease-in;
}
</style>

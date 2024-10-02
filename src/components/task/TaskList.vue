<script setup lang="ts">
import { ref, watch } from 'vue'
import Draggable from 'vuedraggable'

import { type TaskListItem } from '@/interfaces/task'

import DragHandle from '../icons/DragHandle.vue'
import TaskPresentation from './TaskPresentation.vue'

type DraggableItem = { element: TaskListItem; index: number }

interface TaskListProps {
  items: TaskListItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onReview: (id: string, review: Record<string, any>) => void
  onSelect: (id: string) => void
}

const props = defineProps<TaskListProps>()

const draggableRef = ref<InstanceType<typeof Draggable> | null>()
const dragging = ref(false)
const handling = ref(false)

const activeIndex = ref(0)

function getActiveListItem() {
  const draggable = draggableRef.value
  const ul = draggable?.$el as HTMLElement | undefined
  const li = ul?.children.item(activeIndex.value) as HTMLElement | null | undefined

  return li ?? null
}

function handleArrowDown(event: KeyboardEvent) {
  const activeListItem = getActiveListItem()
  if (activeListItem && activeListItem !== document.activeElement) return
  if (activeIndex.value < props.items.length - 1) activeIndex.value += 1
  event.preventDefault()
}

function handleArrowUp(event: KeyboardEvent) {
  const activeListItem = getActiveListItem()
  if (activeListItem && activeListItem !== document.activeElement) return
  if (activeIndex.value > 0) activeIndex.value -= 1
  event.preventDefault()
}

function handleEscape(_event: KeyboardEvent) {
  const li = getActiveListItem()
  if (!li?.contains(document.activeElement)) return

  li.focus()
}

function handleEnter(_event: KeyboardEvent) {
  props.onSelect(props.items[activeIndex.value].id)
}

// function handleDoubleClick(event: PointerEvent) {

// }

watch(activeIndex, () => getActiveListItem()?.focus())
watch([dragging, handling], ([isDragging, isHandling], _, onCleanup) => {
  const style = document.documentElement.style
  const cursor = style.cursor
  if (isDragging) {
    style.cursor = 'grabbing'
  } else if (isHandling) {
    style.cursor = 'grab'
  }

  return onCleanup(() => (style.cursor = cursor))
})
</script>

<template>
  <div class="s-tasklist-container">
    <Draggable
      tag="transition-group"
      item-key="id"
      ref="draggableRef"
      class="s-tasklist"
      ghost-class="s-draggable-ghost"
      :component-data="{ tag: 'ul', name: 'list' }"
      :animation="250"
      :list="items"
      :disabled="!handling"
      @start="dragging = true"
      @end="dragging = false"
      @keydown.capture.enter="handleEnter"
      @keydown.capture.arrow-up="handleArrowUp"
      @keydown.capture.arrow-down="handleArrowDown"
      @keydown.capture.prevent.escape="handleEscape"
    >
      <template #item="{ element, index }: DraggableItem">
        <li
          class="s-taskitem"
          :tabindex="index === activeIndex ? 0 : -1"
          @click="activeIndex = index"
          @dblclick.capture.stop.prevent="onSelect(element.id)"
        >
          <div
            class="s-handle"
            @mouseenter.stop="handling = true"
            @mouseleave.stop="handling = false"
          >
            <DragHandle style="opacity: 0.1" />
          </div>
          <TaskPresentation
            :task="element"
            :focusable="index === activeIndex"
            @review="onReview"
            @toggle="onToggle"
            @delete="onDelete"
          />
        </li>
      </template>
    </Draggable>

    <div v-if="items.length === 0" class="s-tasklist-empty">
      <slot name="empty" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.s-tasklist-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.s-tasklist-empty {
  height: 100%;
}

.s-tasklist {
  list-style-type: none;
  display: block;
  padding: 0;
  position: relative;
}

.s-draggable-ghost {
  opacity: 0.35;
  background-color: var(--s-surface-lower);
}

.s-taskitem {
  z-index: 1;
  display: flex;
  position: relative;
  padding: 0 0 0 1.625rem;
  margin-inline: -2rem;
  background-color: var(--s-surface-middle);

  &[draggable='true'] {
    background-color: var(--s-surface-ground);
  }

  &:focus {
    outline: none;
    background-color: var(--s-surface-ground);
  }

  &:not(:last-of-type) {
    border-bottom: 1px solid var(--p-content-border-color);
  }
}

.s-handle {
  width: 1.625rem;
  height: 100%;
  left: 0rem;
  position: absolute;
  display: inline-flex;
  align-items: center;
}

.list-enter-from,
.list-leave-to {
  transform: translateY(-100%);
  opacity: 0.3;
}

.list-enter-active,
.list-leave-active {
  z-index: 0;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.4s ease;
}

.list-leave-active {
  position: absolute;
}
</style>

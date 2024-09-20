<script setup lang="ts">
import Draggable from 'vuedraggable'

import { type TodoListItem } from '@/interfaces/todo'

import TodoPresentation from './TodoPresentation.vue'
import { ref, watch } from 'vue'

type DraggableItem = { element: TodoListItem; index: number }

interface TodoListProps {
  items: TodoListItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onReview: (id: string, review: Record<string, any>) => void
  onSelectItem: (id: string) => void
}

const props = defineProps<TodoListProps>()

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
  props.onSelectItem(props.items[activeIndex.value].id)
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
  <Draggable
    tag="transition-group"
    item-key="id"
    ref="draggableRef"
    class="s-todo-list"
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
        class="s-todo-item"
        :tabindex="index === activeIndex ? 0 : -1"
        @click="activeIndex = index"
        @dblclick.prevent="onSelectItem(element.id)"
      >
        <div
          class="s-handle"
          @mouseenter.stop="handling = true"
          @mouseleave.stop="handling = false"
        />
        <TodoPresentation
          :todo="element"
          @review="onReview"
          @toggle="onToggle"
          @delete="onDelete"
        />
      </li>
    </template>
  </Draggable>
</template>

<style lang="css" scoped>
.s-todo-list {
  list-style-type: none;
  display: block;
  padding: 0;
  position: relative;
}

.s-draggable-ghost {
  opacity: 0.35;
  background-color: var(--s-surface-lower);
}

.s-todo-item {
  z-index: 1;
  display: flex;
  position: relative;
  padding: 0 0 0 1.625rem;
  margin-inline: -2rem;
  background-color: var(--s-surface-middle);
}

.s-todo-item:focus {
  outline: none;
  background-color: var(--s-surface-ground);
}

.s-todo-item[draggable='true'] {
  background-color: var(--s-surface-ground);
}

.s-todo-item:not(:last-of-type) {
  border-bottom: 1px solid var(--p-content-border-color);
}

.s-handle {
  width: 1.625rem;
  height: 100%;
  left: 0rem;
  position: absolute;
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

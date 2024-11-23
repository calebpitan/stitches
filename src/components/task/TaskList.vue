<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'

import Draggable from 'vuedraggable'

import { type TaskListItem } from '@/interfaces/task'

import IconDragHandle from '../icons/IconDragHandle.vue'
import TaskPresentation from './TaskPresentation.vue'

type DraggableItem = { element: TaskListItem; index: number }

type TaskListEmits = {
  toggle: [id: string]
  delete: [id: string]
  review: [id: string, review: Record<string, any>]
  select: [id: string]
}

interface TaskListProps {
  items: TaskListItem[]
}

const props = defineProps<TaskListProps>()
const emit = defineEmits<TaskListEmits>()

const draggableRef = ref<InstanceType<typeof Draggable> | null>()
const dragging = ref(false)
const handling = ref(false)

const active = reactive({ id: null as string | null, idx: -1 })

function setActive(id: string | null | undefined) {
  if (!id) {
    active.id = null
    active.idx = -1
    return
  }

  active.id = id
  active.idx = props.items.findIndex((v) => v.id === id)
}

function getList() {
  return (draggableRef.value?.$el ?? null) as HTMLElement | null
}

function getActiveListItem() {
  const li = (getList()?.children.item(active.idx) ?? null) as HTMLElement | null
  return li
}

function focusActiveListItem() {
  const list = getList()
  const activeListItem = getActiveListItem()
  activeListItem?.focus({ preventScroll: true })
  activeListItem?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  if (!activeListItem) {
    setTimeout(() => {
      if (document.activeElement !== list) {
        return list?.focus()
      }
      return (list?.nextElementSibling as HTMLElement).focus()
    }, 150)
  }
}

function handleArrowDown(event: KeyboardEvent) {
  const activeListItem = getActiveListItem()
  // Ensure the active listitem has focus otherwise return
  if (activeListItem && activeListItem !== document.activeElement) return
  if (active.idx < props.items.length - 1) setActive(props.items[active.idx + 1].id)

  event.preventDefault()
}

function handleArrowUp(event: KeyboardEvent) {
  const activeListItem = getActiveListItem()
  // Ensure the active listitem has focus otherwise return
  if (activeListItem && activeListItem !== document.activeElement) return
  if (active.idx > 0) setActive(props.items[active.idx - 1].id)

  event.preventDefault()
}

function handleEscape(event: KeyboardEvent) {
  const activeListItem = getActiveListItem()
  // if (!activeListItem?.contains(document.activeElement)) return
  // activeListItem.focus()

  // When the active listitem has focus and `ESC` is hit, make it inactive so it can lose focus
  if (activeListItem === document.activeElement) {
    event.preventDefault()
    setActive(null)
  }
}

function handleEnter(_event: KeyboardEvent) {
  emit('select', props.items[active.idx].id)
}

function handleTab(event: KeyboardEvent) {
  // Ignore if `SHIFT + TAB`
  if (event.shiftKey) return
  if (active.idx < 0) setActive(props.items.at(0)?.id)
  else focusActiveListItem()

  event.preventDefault()
}

// prettier-ignore
{
  watch(() => active.idx, () => focusActiveListItem())
  // watch(() => active.id, (id) => (active.idx = props.items.findIndex(v => v.id === id)))
  watch(() => [props.items.length], () => {
    const index = props.items.findIndex((v) => v.id === active.id)
    active.idx = index === -1 ? 0 : index;
    queueMicrotask(() => getList()?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  })
}

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

onMounted(() => {
  queueMicrotask(() => getList()?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
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
      :component-data="{ tag: 'ul', name: 'list', tabindex: -1 }"
      :animation="250"
      :list="items"
      :disabled="!handling"
      @start="dragging = true"
      @end="dragging = false"
      @keydown.self.tab="handleTab"
      @keydown.enter="handleEnter"
      @keydown.capture.arrow-up="handleArrowUp"
      @keydown.capture.arrow-down="handleArrowDown"
      @keydown.prevent.escape="handleEscape"
    >
      <template #item="{ element }: DraggableItem">
        <li
          class="s-taskitem"
          :tabindex="element.id === active.id ? 0 : -1"
          @focusin="items.some((v) => v.id === element.id) && setActive(element.id)"
          @click="setActive(element.id)"
          @dblclick.capture.stop.prevent="emit('select', element.id)"
        >
          <div
            class="s-handle"
            @mouseenter.stop="handling = true"
            @mouseleave.stop="handling = false"
          >
            <IconDragHandle style="opacity: 0.2" />
          </div>
          <TaskPresentation
            :task="element"
            :focusable="element.id === active.id"
            @review="(id, patch) => emit('review', id, patch)"
            @toggle="emit('toggle', $event)"
            @delete="emit('delete', $event)"
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
  border: 1px solid transparent;

  &:focus-visible {
    outline: none;
    border-radius: 6px;
    border: 1px solid var(--p-primary-color);
    margin-block: 2px;
  }
}

.s-draggable-ghost {
  opacity: 0.35;
  background-color: var(--s-surface-lower);
}

.s-taskitem {
  --s-taskitem-margin: calc(-0.75 * var(--s-base-padding));
  --s-taskitem-ground: var(--s-surface-ground);
  &:focus {
    --s-taskitem-ground: var(--s-surface-elevated);
  }

  z-index: 1;
  display: flex;
  position: relative;
  padding: 0 0 0 1.625rem;
  margin-inline: var(--s-taskitem-margin);
  background-color: var(--s-surface-middle);
  background-color: var(--s-taskitem-ground);
  border-radius: 10px;
  margin-top: calc(var(--s-base-padding) + var(--s-taskitem-margin));

  &:last-child {
    margin-bottom: calc(var(--s-base-padding) + var(--s-taskitem-margin));
  }

  &[draggable='true'] {
    background-color: var(--s-surface-middle);
  }

  &:focus {
    outline: none;
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
  width: calc(100% - 2 * var(--s-taskitem-margin));
}
</style>

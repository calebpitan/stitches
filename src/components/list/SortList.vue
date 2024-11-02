<script setup lang="ts" generic="Item extends IListItem">
import { ref, watch } from 'vue'

import type { SortableOptions } from 'sortablejs'
import Draggable from 'vuedraggable'

export type IListItem = string | string[] | Record<string, unknown>[] | Record<string, unknown>
export interface SortListProps<Item extends IListItem> {
  items: Array<Item>
  itemKey?: string | ((item: Item) => string)
  listitemClass?: string
  draggable?: boolean
  /** Draggable options */
  draggableOptions?: SortableOptions
}
type DraggableItem = { element: Item; index: number }

const props = withDefaults(defineProps<SortListProps<Item>>(), { draggable: true })

const dragging = ref(false)
const handling = ref(props.draggable)
const draggableRef = ref<InstanceType<typeof Draggable> | null>(null)

watch(props, (p) => (handling.value = p.draggable))
watch([dragging, handling], ([dragging, handling], _, onCleanup) => {
  const style = document.documentElement.style
  const cursor = style.cursor
  if (dragging) {
    style.cursor = 'grabbing'
  } else if (handling) {
    style.cursor = 'grab'
  } else {
    style.cursor = cursor
  }

  return onCleanup(() => (style.cursor = cursor))
})
</script>

<template>
  <Draggable
    ref="draggableRef"
    tag="transition-group"
    class="s-sortlist"
    ghost-class="s-draggable-ghost"
    :disabled="draggable === false"
    :item-key="itemKey"
    :component-data="{ tag: 'ul', name: 's-sortlist' }"
    :animation="250"
    :list="items"
    @start="dragging = true"
    @end="dragging = false"
    v-bind="draggableOptions"
  >
    <template #item="{ element, index }: DraggableItem">
      <li :class="[listitemClass]">
        <slot name="content" :element :index />
      </li>
    </template>
  </Draggable>
</template>

<style scoped>
.s-sortlist {
  padding: 0;
  position: relative;
  list-style-type: none;
}

.s-draggable-ghost {
  opacity: 0.35;
  background-color: var(--s-surface-lower);
}

.s-sortlist-enter-from,
.s-sortlist-leave-to {
  transform: translateY(-100%);
  opacity: 0.3;
}

.s-sortlist-enter-active,
.s-sortlist-leave-active {
  z-index: 0;
}

.s-sortlist-move,
.s-sortlist-enter-active,
.s-sortlist-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.4s ease;
}

.s-sortlist-leave-active {
  position: absolute;
}
</style>

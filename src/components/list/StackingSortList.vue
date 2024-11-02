<script setup lang="ts" generic="Item extends IListItem">
import { type TransitionGroupProps, computed, ref, watch } from 'vue'

import type { SortableOptions } from 'sortablejs'
import Draggable from 'vuedraggable'

export type IListItem = string | string[] | Record<string, unknown>[] | Record<string, unknown>
export interface StackingSortListProps<Item extends IListItem> {
  items: Array<Item>
  itemKey?: string | ((item: Item) => string)
  draggable?: boolean
  stacked?: boolean
  reversed?: boolean
  maxStacks?: number
  listitemClass?: string
  /** The duration of the stacking/unstacking transition */
  animationDuration?: number
  /** The delay before the stacking/unstacking transition kicks in */
  animationDelay?: number
  /** The percentage by which to diminish successive items in the stack */
  stackingStep?: number
  /** Draggable options */
  draggableOptions?: SortableOptions
  style?: any
}

type DraggableItem = { element: Item; index: number }

const props = withDefaults(defineProps<StackingSortListProps<Item>>(), {
  draggable: true,
  stacked: true,
  reversed: false,
  maxStacks: 3,
  animationDuration: 0.375,
  animationDelay: 0,
  stackingStep: 5
})

const dragging = ref(false)
const handling = ref(props.draggable)
const list = ref(props.items?.slice())
const tag = ref<'transition-group' | 'ul'>('ul')
const draggableRef = ref<InstanceType<typeof Draggable> | null>(null)

const size = ref(props.items.length)

const listComponentData = computed<TransitionGroupProps>(() => {
  return {
    tag: 'ul',
    name: 's-sortlist',
    style: {
      '--max-stacking-index': props.maxStacks - 1,
      '--stacking-step': props.stackingStep / 100,
      '--duration': `${props.animationDuration}s`,
      '--delay': `${props.animationDelay}s`,
      ...props.style
    }
  }
})

watch(props, (p) => (handling.value = p.draggable))
watch([dragging, handling], ([dragging, handling], _, onCleanup) => {
  const style = document.documentElement.style
  if (dragging) {
    style.cursor = 'grabbing'
  } else if (handling) {
    style.cursor = 'grab'
  } else {
    style.cursor = ''
  }

  return onCleanup(() => (style.cursor = ''))
})
</script>

<template>
  <Draggable
    ref="draggableRef"
    class="s-stacking-sortlist"
    ghost-class="s-draggable-ghost"
    :key="tag"
    :tag="tag"
    :list="list"
    :animation="250"
    :item-key="itemKey"
    :component-data="listComponentData"
    :disabled="tag === 'ul'"
    v-bind="draggableOptions"
    @start="dragging = true"
    @end="dragging = false"
    @add="size = $event.to.children.length"
    @remove="size = $event.from.children.length - 1"
  >
    <template #item="{ element, index }: DraggableItem">
      <li
        :class="['s-stacking-listitem', listitemClass, { stacked, reversed }]"
        :data-index="index"
        :style="{
          '--i': size,
          '--n-index': size - 1 - index,
          '--s-index': index
        }"
        @transitionend.stop="stacked ? (tag = 'ul') : (tag = 'transition-group')"
      >
        <slot name="content" :element :index />
      </li>
    </template>
  </Draggable>
</template>

<style scoped>
.s-stacking-sortlist {
  padding: 0;
  position: relative;
  list-style-type: none;
  height: 100%;
}

.s-stacking-listitem {
  --list-bound: calc(var(--s-index) + var(--n-index));

  position: relative;
  user-select: none;
  /* transform: translate3d(0, 0, 0) scale(1); */
  z-index: calc(var(--n-index) * 1);
  transition:
    transform var(--duration) ease-out,
    z-index var(--duration),
    margin-block-end var(--duration) ease-out;
  transition-delay: var(--delay);
  will-change: transform;

  &.stacked {
    --center-point: var(--max-stacking-index);
    --factor: min(var(--s-index), var(--center-point));

    --dy: 0.5em;

    --tx: 0;
    --ty: calc(var(--dy) * var(--factor) - 100% * var(--s-index));
    --tz: calc(-1px * var(--s-index));
    --scale: calc(1 - (var(--stacking-step, 0.05) * var(--s-index)));

    margin-block-end: 0;
    z-index: calc(var(--n-index) * 1);
    transform: translate3d(var(--tx), var(--ty), var(--tz)) scale(var(--scale));

    &.reversed {
      --center-point: calc(var(--list-bound) - var(--max-stacking-index));
      --factor: max(var(--s-index), var(--center-point));

      --scale: calc(1 - (var(--stacking-step, 0.05) * var(--n-index)));

      z-index: calc(var(--s-index) * 1);
      transform: translate3d(var(--tx), var(--ty), var(--tz)) scale(var(--scale));
    }

    &.reversed {
      --alpha: clamp(0.4, calc(var(--n-index) / var(--list-bound)), 0.9);
    }

    &:not(.reversed) {
      --alpha: clamp(0.4, calc(var(--s-index) / var(--list-bound)), 0.9);
    }

    &:not(.reversed):nth-child(1),
    &:nth-last-child(1) {
      --bg: var(--s-surface-elevated);
      @media (prefers-color-scheme: dark) {
        --bg: var(--s-surface-elevated);
      }
    }

    &:not(.reversed):nth-child(2),
    &:nth-last-child(2) {
      --bg: #e2eaf0;
      --bg-rgb: 226 234 240; /* #e2eaf0 */
      @media (prefers-color-scheme: dark) {
        --bg: #393838;
        --bg-rgb: 57 56 56; /* #393838 */
      }
    }

    &:not(.reversed):nth-child(3),
    &:nth-last-child(3) {
      --bg: #cfd4da;
      --bg: #d7dee4;
      --bg-rgb: 216 222 228; /* #d7dee4 */
      @media (prefers-color-scheme: dark) {
        --bg: #555454; /* #626262; */
        --bg-rgb: 85 84 84; /* #555454; */
      }
    }
  }
}

.s-draggable-ghost {
  opacity: 0.35;
}

:not(.stacked).s-sortlist-enter-from,
:not(.stacked).s-sortlist-leave-to {
  opacity: 0.3;
}

:not(.stacked).s-sortlist-enter-active,
:not(.stacked).s-sortlist-leave-active {
  z-index: 0;
}

:not(.stacked).s-sortlist-move,
:not(.stacked).s-sortlist-enter-active,
:not(.stacked).s-sortlist-leave-active {
  transition:
    transform 0.375s ease-out,
    opacity 0.375s ease;
}

:not(.stacked).s-sortlist-leave-active {
  position: absolute;
}
</style>

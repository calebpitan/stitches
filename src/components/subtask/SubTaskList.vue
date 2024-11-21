<script setup lang="ts">
import { ref } from 'vue'

import { range } from '@stitches/common'

import { emptyTaskList } from '@/utils/assets'

import List from '../list/List.vue'
import SortListHandle from '../list/SortListHandle.vue'
import StackingSortList from '../list/StackingSortList.vue'
import SubTask from './SubTask.vue'

export interface SubTaskListProps {
  items: { name: string; completed: boolean }[]
  stacked: boolean
  onUnStack: () => void
}

const props = withDefaults(defineProps<SubTaskListProps>(), { stacked: true })

const handling = ref(false)
const list = ref(split(props.items, 2).map((v, i) => ({ id: `${i}`, items: v })))

function split<T>(items: Array<T>, into: number) {
  const result: T[][] = Array.from({ length: into }, () => [])

  for (let j = 0; j < items.length; j += into) {
    const cf = j - j / into // correction factor
    for (const i of range(into - (((j + into) % items.length) % into))) {
      // `(((j + into) % items.length) % into))` is to make sure `i + j` never passes `items.length`
      result[i][j - cf] = items[i + j]
    }
  }

  return result
}

function handleUnStack() {
  props.onUnStack()
}
</script>

<template>
  <div :class="['s-subtasklist-container', { stacked }]">
    <List class="s-subtasklist" :items="list" :item-key="(i) => i.id">
      <template #listitem="{ element }">
        <li>
          <StackingSortList
            class="s-subtask-sortlist"
            :draggable="handling"
            :items="element.items"
            :item-key="(i) => i.name"
            :stacked="stacked"
            :reversed="true"
            :style="{ '--empty-image-url': `url(${emptyTaskList})` }"
            :draggable-options="{ group: 'subtasks', handle: '.s-handle' }"
          >
            <template #content="{ element: item }">
              <SubTask
                class="s-subtask-element"
                :title="item.name"
                :completed="item.completed"
                @click="handleUnStack()"
              >
                <template #drag-handle>
                  <SortListHandle class="s-handle-horizontal" @discovery="handling = $event" />
                </template>
              </SubTask>
            </template>
          </StackingSortList>
        </li>
      </template>
    </List>

    <div class="s-subtasklist-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.s-subtasklist-container {
  --radius: calc(var(--s-base-padding) / 2);

  width: 100%;
  display: flex;
  margin-block: 1rem;
  flex-direction: column;
  padding: var(--s-base-padding);
  background-color: var(--s-surface-ground);
  border-radius: var(--radius) 0 0 var(--radius);
  margin-inline: var(--s-base-padding) calc(-1 * var(--s-base-padding));

  &.stacked {
    & .s-subtasklist {
      height: 160px;
      max-height: 100%;
    }

    & .s-subtask-sortlist {
      gap: 0;
    }

    & .s-subtask-element {
      backdrop-filter: blur(15px);
    }
  }

  & .stacked:not(.reversed) > .s-subtask-element {
    border-width: 0 0 1px 0;
  }

  & .stacked.reversed > .s-subtask-element {
    border-width: 1px 0 0 0;
  }

  & :not(.stacked) > .s-subtask-element {
    --bg: var(--s-surface-elevated);
  }

  & .s-subtask-element {
    background-color: rgba(var(--bg-rgb) / var(--alpha, 1));
    background-color: rgba(from var(--bg) r g b / var(--alpha, 1));
    transition: background-color 0.375s ease-out;
  }

  &:not(.stacked) .s-subtask-element {
    box-shadow: none;
    border-color: transparent;
    background-color: var(--s-surface-elevated);
  }
}

.s-subtasklist {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 1rem;

  &:empty {
    padding-block-end: 1.25rem;
  }
}

.s-subtask-sortlist {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

:not(.s-subtasklist-container.stacked) > .s-list .s-subtask-sortlist {
  &:empty {
    position: relative;

    &::before {
      content: '';
      width: 100%;
      height: 100%;
      opacity: 0.1;
      background-size: 250px;
      background-position: center;
      background-repeat: no-repeat;
      background-image: var(--empty-image-url);
    }
  }
}

.s-subtask-element {
  border-radius: var(--s-normal-radius);
  position: relative;
}

.s-handle-horizontal {
  left: unset;
  /* top: calc(var(--s-base-padding) / 2); */
  right: calc(var(--s-base-padding) / 2);
  transform: rotate(90deg);
  height: auto;
  min-height: 32px;
  opacity: 0.3;
}

.s-subtasklist-footer {
  width: 100%;
  display: flex;
  flex-direction: column;

  &:not(:empty) {
    margin-block-start: var(--s-base-padding);
  }
}
</style>

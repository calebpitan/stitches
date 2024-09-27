<script setup lang="ts">
import type { MeterItem } from 'primevue/metergroup'

type TodoGroup = MeterItem & {}

interface TodoGroupProps<F> {
  total: number
  groups: TodoGroup[]
  filter: F | null
  onFilter?: (label: F | null) => void
}

const props = defineProps<TodoGroupProps<any>>()

const getValue = (percent: number) => Math.ceil((percent / 100) * props.total)

function filterTodosByGroup(group: string) {
  if (props.filter === group) {
    return props.onFilter?.(null)
  }

  // props.onFilter?.(null)
  props.onFilter?.(group)
  // queueMicrotask(() => props.onFilter?.(group))
}
</script>

<template>
  <MeterGroup :value="groups" :max="200" label-position="start">
    <template #label="{ value }">
      <div class="s-todo-groups">
        <template v-for="val of value" :key="val.label">
          <Card
            v-ripple="getValue(val.value) !== 0"
            :aria-disabled="getValue(val.value) === 0"
            :class="{
              's-todo-groups-card': true,
              's-todo-groups-active': filter === val.label
            }"
            role="button"
            tabindex="0"
            @click="getValue(val.value) !== 0 && filterTodosByGroup(val.label)"
          >
            <template #content>
              <div class="s-todo-groups-content">
                <div class="s-todo-groups-summary">
                  <span class="s-todo-groups-label">{{ val.label }}</span>
                  <span class="s-todo-groups-value">{{ getValue(val.value) }}</span>
                </div>
                <span
                  class="s-todo-groups-icon"
                  :style="{ backgroundColor: `${val.color}`, color: '#ffffff' }"
                >
                  <i :class="val.icon" />
                </span>
              </div>
            </template>
          </Card>
        </template>
      </div>
    </template>
  </MeterGroup>
</template>

<style scoped>
.s-todo-groups,
.s-todo-groups-content,
.s-todo-groups-summary {
  display: flex;
  user-select: none;
}

.s-todo-groups {
  gap: 1rem;
  flex-wrap: wrap;
}

.s-todo-groups-content {
  gap: 1rem;
  min-width: 100px;
}

.s-todo-groups-card {
  flex: 1 0 auto;
  cursor: pointer;
  transition: background-color 0.2s ease-in;
  background-color: light-dark(rgba(248, 250, 252, 1), rgba(255, 255, 255, 0.1));
  border-width: 0px;
  border-style: solid;
  border-color: var(--p-slate-200);
  box-shadow: none;

  &[aria-disabled='true'] {
    opacity: 0.4;
    cursor: unset;
  }

  &:not([aria-disabled='true']):hover {
    background-color: light-dark(rgba(198, 200, 202, 0.3), rgba(255, 255, 255, 0.2));
  }
}

.s-todo-groups-active {
  outline: 1.5px solid var(--p-blue-500);
}

.s-todo-groups-summary {
  flex-direction: column;
  flex: 1 1 auto;
}

.s-todo-groups-label {
  color: var(--s-script-secondary);
  font-size: 0.75rem;
  font-weight: 500;
}

.s-todo-groups-value {
  font-weight: 700;
}

.s-todo-groups-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  place-items: center;
  justify-content: center;
}

.s-todo-groups-icon i {
  font-size: 0.875rem;
}
</style>

<script setup lang="ts">
import type { MeterItem } from 'primevue/metergroup'

type TaskGroup = MeterItem & {}

interface TaskGroupProps<F> {
  total: number
  groups: TaskGroup[]
  filter: F | null
  onFilter?: (label: F | null) => void
}

const props = defineProps<TaskGroupProps<any>>()

const getValue = (percent: number) => Math.ceil((percent / 100) * props.total)

function filterTasksByGroup(group: string) {
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
      <div class="s-task-groups">
        <template v-for="val of value" :key="val.label">
          <Card
            v-ripple="getValue(val.value) !== 0"
            :aria-disabled="getValue(val.value) === 0"
            :class="{
              's-task-groups-card': true,
              's-task-groups-active': filter === val.label
            }"
            role="button"
            tabindex="0"
            @click="getValue(val.value) !== 0 && filterTasksByGroup(val.label)"
          >
            <template #content>
              <div class="s-task-groups-content">
                <div class="s-task-groups-summary">
                  <span class="s-task-groups-label">{{ val.label }}</span>
                  <span class="s-task-groups-value">{{ getValue(val.value) }}</span>
                </div>
                <span
                  class="s-task-groups-icon"
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
.s-task-groups,
.s-task-groups-content,
.s-task-groups-summary {
  display: flex;
  user-select: none;
}

.s-task-groups {
  gap: 1rem;
  flex-wrap: wrap;
}

.s-task-groups-content {
  gap: 1rem;
  min-width: 100px;
}

.s-task-groups-card {
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

.s-task-groups-active {
  outline: 1.5px solid var(--p-blue-500);
}

.s-task-groups-summary {
  flex-direction: column;
  flex: 1 1 auto;
}

.s-task-groups-label {
  color: var(--s-script-secondary);
  font-size: 0.75rem;
  font-weight: 500;
}

.s-task-groups-value {
  font-weight: 700;
}

.s-task-groups-icon {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  place-items: center;
  justify-content: center;
}

.s-task-groups-icon i {
  font-size: 0.875rem;
}
</style>

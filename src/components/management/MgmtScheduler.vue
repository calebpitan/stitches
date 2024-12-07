<script setup lang="ts">
import { computed, onMounted, ref, useId, watch, watchEffect } from 'vue'

import { FREQUENCY_OPTIONS_GROUP } from '@stitches/common'
import type { BaseTaskSchedule, Frequency, TaskSchedule } from '@stitches/common'
import { SVG } from '@svgdotjs/svg.js'

import type { SelectChangeEvent } from 'primevue/select'

import { useLocale } from '@/composables/useLocale'
import { usePrimaryColor } from '@/composables/usePrimaryColor'
import { evaluate } from '@/utils'

import IconClearAll from '../icons/IconClearAll.vue'
import CronScheduler from '../repeatables/CronScheduler.vue'
import DailyScheduler from '../repeatables/DailyScheduler.vue'
import HourlyScheduler from '../repeatables/HourlyScheduler.vue'
import MonthlyScheduler from '../repeatables/MonthlyScheduler.vue'
import WeeklyScheduler from '../repeatables/WeeklyScheduler.vue'
import YearlyScheduler from '../repeatables/YearlyScheduler.vue'
import HStack from '../stack/HStack.vue'
import VStack from '../stack/VStack.vue'
import MgmtScheduleInfo from './MgmtScheduleInfo.vue'
import MgmtScheduleSummary from './MgmtScheduleSummary.vue'

type MgmtScheduleEmits = {
  schedule: [schedule: BaseTaskSchedule | TaskSchedule]
  clearSchedule: [id: string]
}

interface MgmtScheduleProps {
  taskId: string
  schedule: TaskSchedule | null
}

interface ThreadNode {
  type: 'line' | 'circle'
  stroke: string
  strokeWidth: number
  fill?: string
}

interface CircleNode extends ThreadNode {
  type: 'circle'
  d: number
  x1: number
  y1: number
}

interface LineNode extends ThreadNode {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ThreadlineConfig {
  width: number
  height: number
  viewbox(): [number, number, number, number]
  elements(): Array<CircleNode | LineNode>
}

const props = withDefaults(defineProps<MgmtScheduleProps>(), {})
const emit = defineEmits<MgmtScheduleEmits>()

const ids = { repeat: useId(), repeat_until: useId() }

const threadline = ref<HTMLDivElement | null>(null)

const locale = useLocale()
const primaryColor = usePrimaryColor()

const isExpanded = ref(true)

// The originally selected date time as timestamp for period the task is initially due
const anchorTime = ref<Date | null>(props.schedule?.timing.anchor ?? null)
// The frequency of schedule for the selected task in context
const frequency = ref<Frequency>(
  evaluate((): Frequency => {
    const f = props.schedule?.frequency
    switch (f?.type) {
      case undefined:
      case 'never':
        return { type: 'never' }
      case 'custom':
        return { type: f.type, until: f.until, crons: f.crons }
      default:
        return Object.assign({}, f)
    }
  }),
)

const frequencyOptionsGroup = computed(() => FREQUENCY_OPTIONS_GROUP.slice())

// ***************************************************************
// Tooltip properties for the scheduler expand-collapse toggle
// button.
// ***************************************************************
const tooltip = computed(() => {
  const pt = { root: 's-tooltip', arrow: 's-tooltip-arrow', text: 's-tooltip-text' }
  const toggleMsg = isExpanded.value === false ? 'Open scheduler' : 'Close scheduler'
  return {
    toggle: { pt, value: toggleMsg },
    edit: { pt, value: 'Edit schedule', showDelay: 1000 },
    clear: { pt, value: 'Clear all schedule', showDelay: 1000 },
  }
})

// ***************************************************************
// Configuration object for declaring properties of threadline to
// be drawn.
// ***************************************************************
const thread = computed<ThreadlineConfig>(() => {
  return {
    width: 32,
    height: 48,
    viewbox() {
      return [0, 0, this.width, this.height] as const
    },
    elements() {
      const color = primaryColor.value
      const strokeWidth = 2
      const [l1x1, l1y1] = [0, 0] as const
      const [l1x2, l1y2] = [0, 16] as const
      const cd = 16
      const [cx1, cy1] = [-1 * (cd / 2), l1y2]
      const [l2x1, l2y1] = [0, l1y2 + cd] as const
      const [l2x2, l2y2] = [0, l1y2 * 2 + cd] as const

      return [
        {
          type: 'line',
          x1: l1x1,
          y1: l1y1,
          x2: l1x2,
          y2: l1y2,
          stroke: 'currentColor',
          strokeWidth,
        },
        {
          type: 'line',
          x1: -1 * l1y2 + cx1,
          y1: cd / 2 + l1y2,
          x2: cx1,
          y2: cd / 2 + l1y2,
          stroke: 'currentColor',
          strokeWidth,
        },
        {
          type: 'circle',
          x1: cx1,
          y1: cy1,
          d: cd,
          fill: 'none',
          stroke: color,
          strokeWidth,
        },
        {
          type: 'line',
          x1: l2x1,
          y1: l2y1,
          x2: l2x2,
          y2: l2y2,
          stroke: 'currentColor',
          strokeWidth,
        },
      ]
    },
  }
})

function drawThread(container: HTMLElement, config: ThreadlineConfig) {
  const draw = SVG()
  const group = draw.group()

  const elements = config.elements()

  const drawCircle = (element: CircleNode) => {
    return draw
      .circle(element.d)
      .move(element.x1, element.y1)
      .fill({ color: element.fill })
      .stroke({ width: element.strokeWidth, color: element.stroke })
  }

  const drawLine = (element: LineNode) => {
    return draw
      .line(element.x1, element.y1, element.x2, element.y2)
      .stroke({ width: element.strokeWidth, color: element.stroke })
  }

  draw
    .addTo(container)
    .size(config.width, config.height)
    .viewbox(...config.viewbox())

  elements.forEach((element) => {
    switch (element.type) {
      case 'circle':
        group.add(drawCircle(element))
        break
      case 'line':
        group.add(drawLine(element))
        break
      // no default
    }
  })

  group.transform({ translateX: config.width * 0.75 - 1 })

  return (): void => void draw.remove()
}

function handleClearSchedule() {
  if (props.schedule) {
    emit('clearSchedule', props.schedule.id)
  }

  anchorTime.value = null
  frequency.value = { type: 'never' }
}

onMounted(() => {
  watch(thread, (t, __, onCleanup) => onCleanup(drawThread(threadline.value!, t)), {
    immediate: true,
  })
})

watchEffect(() => {
  if (frequency.value.type !== 'custom') {
    // @ts-expect-error
    delete frequency.value.crons
  }
})

function handleFrequencyTypeChange(evt: SelectChangeEvent) {
  const timestamp = anchorTime.value ?? new Date()
  const type = evt.value as typeof frequency.value.type

  if (type === frequency.value.type) return

  switch (type) {
    case 'hour':
    case 'day':
      Object.assign(frequency.value, { type, exprs: { every: 1 } })
      break
    case 'week':
      Object.assign(frequency.value, { type, exprs: { every: 1, subexpr: { weekdays: [] } } })
      break
    case 'month':
      Object.assign(frequency.value, {
        type,
        exprs: {
          every: 1,
          subexpr: {
            type: 'ondays',
            days: [timestamp.getDate()],
          },
        },
      })
      break
    case 'year':
      Object.assign(frequency.value, {
        type,
        exprs: {
          every: 1,
          subexpr: {
            in: {
              months: [timestamp.getMonth()],
            },
          },
        },
      })
      break
    case 'custom':
      Object.assign(frequency.value, {
        type,
        crons: [
          {
            // prettier-ignore
            expression: [
              timestamp.getMinutes(), 
              timestamp.getHours(), 
              '*', 
              '*', 
              '*'
            ].join(' '),
            frequency: 'day',
          },
        ],
      })
      break
    case 'never':
      frequency.value = { type }
      break
    default:
    // no default
  }
}

watch(
  [anchorTime, frequency],
  ([anchor, freq]) => {
    if (!anchor) return
    emit('schedule', {
      id: props.schedule?.id,
      taskId: props.taskId,
      frequency: freq,
      timing: { ...props.schedule?.timing!, anchor: anchor },
    })
  },
  { deep: true },
)
</script>

<template>
  <div class="s-mgmt-schedule">
    <div class="s-schedule-header">
      <div ref="threadline" class="s-threadline">
        <Button
          v-tooltip="tooltip.toggle"
          type="button"
          icon="pi pi-plus"
          :class="['s-scheduler-toggle', { expanded: isExpanded }]"
          :aria-label="isExpanded ? 'Collapse' : 'Expand'"
          :rounded="true"
          @click="isExpanded = !isExpanded"
        />
      </div>

      <HStack
        v-if="anchorTime !== null && isExpanded"
        class="s-schedule-headline"
        style="align-items: center"
        :spacing="1"
      >
        <MgmtScheduleSummary :schedule="schedule">
          <template #clear-button>
            <Button
              class="s-mgmt-schedule-quick-action"
              severity="danger"
              :text="true"
              @click="handleClearSchedule"
            >
              Clear
            </Button>
          </template>
        </MgmtScheduleSummary>
      </HStack>
    </div>

    <div class="s-mgmt-scheduler">
      <div :aria-hidden="isExpanded === true" :class="['s-animated', { active: !isExpanded }]">
        <!-- NOTE: Ensure there's an `overflow: hidden;` rule for height animation to work using grid/grid-template-rows -->
        <MgmtScheduleInfo :schedule>
          <template #edit-button>
            <Button
              v-tooltip.bottom="tooltip.edit"
              class="s-mgmt-schedule-quick-actions"
              icon="pi pi-pencil"
              aria-label="Edit schedule"
              :text="false"
              :rounded="true"
              @click="isExpanded = true"
            />
          </template>

          <template v-if="schedule" #clear-button>
            <Button
              v-tooltip.bottom="tooltip.clear"
              class="s-mgmt-schedule-quick-actions"
              aria-label="Clear schedule"
              :text="false"
              :rounded="true"
              @click="handleClearSchedule"
            >
              <template #icon="{ class: cls }">
                <IconClearAll :class="cls" width="1.5em" height="1.5em" />
              </template>
            </Button>
          </template>
        </MgmtScheduleInfo>
      </div>

      <div :aria-hidden="isExpanded === false" :class="['s-animated', { active: isExpanded }]">
        <HStack class="s-mgmt-scheduler-stack" :spacing="4">
          <DatePicker
            v-model="anchorTime"
            class="s-datepicker"
            panel-class="s-datepicker-panel"
            date-format="dd/mm/yy"
            :inline="true"
            :show-time="true"
          />

          <VStack :spacing="4">
            <HStack :spacing="4" style="margin-top: 1rem">
              <FloatLabel>
                <Select
                  class="s-select"
                  dropdown-icon="pi pi-angle-down"
                  label-class="s-select-label"
                  overlay-class="s-select-overlay"
                  :input-id="ids.repeat"
                  :model-value="frequency.type"
                  :options="frequencyOptionsGroup"
                  :option-group-label="'group'"
                  :option-group-children="'items'"
                  :option-label="'label'"
                  :option-value="'value'"
                  @change="handleFrequencyTypeChange"
                >
                  <template #optiongroup="{ option }">
                    <Divider v-if="option.group === 'custom'" style="margin: 0" />
                    <span v-else aria-hidden="true" />
                  </template>
                </Select>
                <label :for="ids.repeat" class="s-label">Repeat</label>
              </FloatLabel>

              <FloatLabel v-if="frequency.type !== 'never'">
                <DatePicker
                  v-model="frequency.until"
                  class="s-datepicker"
                  input-class="s-datepicker-input"
                  panel-class="s-datepicker-panel"
                  date-format="dd/mm/yy"
                  :input-id="ids.repeat_until"
                  :inline="false"
                />
                <label :for="ids.repeat_until" class="s-label"> Until </label>
              </FloatLabel>
            </HStack>

            <CronScheduler
              v-if="frequency.type === 'custom'"
              :locale="locale"
              :timestamp="anchorTime"
              :crons="frequency.crons"
              @change="frequency.crons = $event"
            />

            <DailyScheduler
              v-if="frequency.type === 'day'"
              :expression="
                schedule?.frequency.type === 'day' ? schedule.frequency.exprs : undefined
              "
              @expression-change="frequency.exprs = $event"
            />
            <HourlyScheduler
              v-if="frequency.type === 'hour'"
              :expression="
                schedule?.frequency.type === 'hour' ? schedule.frequency.exprs : undefined
              "
              @expression-change="frequency.exprs = $event"
            />
            <WeeklyScheduler
              v-if="frequency.type === 'week'"
              :timestamp="anchorTime"
              :expression="
                schedule?.frequency.type === 'week' ? schedule.frequency.exprs : undefined
              "
              @expression-change="frequency.exprs = $event"
            />
            <MonthlyScheduler
              v-if="frequency.type === 'month'"
              :timestamp="anchorTime"
              :expression="
                schedule?.frequency.type === 'month' ? schedule.frequency.exprs : undefined
              "
              @expression-change="frequency.exprs = $event"
            />
            <YearlyScheduler
              v-if="frequency.type === 'year'"
              :timestamp="anchorTime"
              :expression="
                schedule?.frequency.type === 'year' ? schedule.frequency.exprs : undefined
              "
              @expression-change="frequency.exprs = $event"
            />
          </VStack>
        </HStack>
      </div>
    </div>
  </div>
</template>

<style scoped>
.s-mgmt-schedule {
  position: relative;
  width: 100%;
  --s-threadline-color-alpha: 0.3;
  --s-threadline-color-rgb: var(--s-primary-color-rgb);
  --s-threadline-color: rgba(var(--s-threadline-color-rgb) / var(--s-threadline-color-alpha));
  --s-mgmt-scheduler-editor-animation-timing: 0.5s;
}

.s-schedule-header {
  --s-threadline-height: 48px;
  --s-threadline-width: 32px;
  --s-threadline-outset: -16px; /* The furthest point of the threadline on the negative x-margin */
  --s-threadline-apparent-width: calc(var(--s-threadline-width) + var(--s-threadline-outset));
  --s-threadline-stroke-width: 2px;

  position: relative;
}

.s-threadline {
  width: 32px;
  position: relative;
  right: 1rem;
  margin-inline-start: auto;
  margin-block: 0.5rem;
  color: var(--s-threadline-color);
  display: flex;
  justify-content: center;
}

.s-scheduler-toggle {
  --p-icon-size: 0.75rem;
  --p-button-icon-only-width: 0.875rem;

  padding: 0;
  position: absolute !important;
  transition: transform calc(var(--s-mgmt-scheduler-editor-animation-timing) * 2) ease;
  top: calc((var(--s-threadline-height) - var(--p-button-icon-only-width)) / 2);
  right: calc(
    (var(--s-threadline-stroke-width) / 2) +
      ((var(--s-threadline-apparent-width) - var(--p-button-icon-only-width)) / 2)
  );

  &.expanded {
    transform: rotate(45deg);
  }
}

.s-schedule-headline {
  position: absolute;
  top: calc((var(--s-threadline-height) / 2) - 0.5rem);
  line-height: 1;
  margin-inline-start: 0rem;
  color: var(--s-script-subtle);
}

.s-mgmt-schedule-quick-action {
  --p-button-text-info-hover-background: transparent;
  --p-button-text-danger-hover-background: transparent;
  --p-button-text-info-active-background: transparent;
  --p-button-text-danger-active-background: transparent;
  --p-button-padding-x: 0.0625rem;
  --p-button-padding-y: 0.0625rem;

  font-size: 0.875rem;
  line-height: 1;
  border-color: transparent;
}

.s-mgmt-schedule-quick-actions {
  --p-button-padding-x: 0.0625rem;
  --p-button-padding-y: 0.0625rem;
  --p-button-icon-only-width: 1.75rem;

  box-shadow: none;
  font-size: 0.875rem;
  text-decoration: none;
  border-color: transparent;
}

.s-mgmt-scheduler-stack {
  position: relative;
  padding-block: 0.5rem;
  max-height: 100%;
  /* The `overflow: hidden;` rule is essential for the height animation using grid/grid-template-rows */
  overflow: hidden;
}

.s-animated {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-15%);
  transition: all var(--s-mgmt-scheduler-editor-animation-timing) ease-out;

  &.active {
    grid-template-rows: 1fr;
    transform: translateY(0);
    opacity: 1;
    transition-delay: var(--s-mgmt-scheduler-editor-animation-timing);
  }
}

/* TRANSITIONS */
.scheduler-summary-enter-from,
.scheduler-summary-leave-to,
.scheduler-editor-enter-from,
.scheduler-editor-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-15%);
}

.scheduler-summary-enter-to,
.scheduler-summary-leave-from,
.scheduler-editor-enter-to,
.scheduler-editor-leave-from {
  grid-template-rows: 1fr;
}

.scheduler-summary-enter-active,
.scheduler-summary-leave-active,
.scheduler-editor-enter-active,
.scheduler-editor-leave-active {
  overflow: hidden;
  transition:
    opacity var(--s-mgmt-scheduler-editor-animation-timing) linear,
    grid-template-rows var(--s-mgmt-scheduler-editor-animation-timing) ease-out,
    transform var(--s-mgmt-scheduler-editor-animation-timing) ease;
}

.scheduler-editor-enter-active,
.scheduler-summary-enter-active {
  transition-delay: var(--s-mgmt-scheduler-editor-animation-timing);
}
</style>

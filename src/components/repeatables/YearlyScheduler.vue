<script setup lang="ts">
import { computed, ref } from 'vue'

import { plural } from '@/utils'
import {
  MONTH_OPTIONS,
  ORDINAL_OPTIONS_GROUP,
  type Ordinals,
  WEEKDAY_OPTIONS
} from '@/utils/scheduling'

import Stack from '../stack/Stack.vue'

const year = ref(1)
const months = ref<Array<number>>([])
const weekday = ref(1)
const ordinal = ref<Lowercase<Ordinals>>('first')
const weekdayRelActive = ref(false)

const weekdayOptions = computed(() => WEEKDAY_OPTIONS.slice())
const monthOptions = computed(() => MONTH_OPTIONS.slice())
const ordinalOptionsGroup = computed(() => ORDINAL_OPTIONS_GROUP.slice())
</script>

<template>
  <div class="s-weekly-scheduler">
    <Stack type="vstack" :spacing="2">
      <Stack type="hstack" :spacing="4">
        <span class="s-label">Every</span>

        <InputNumber
          v-model="year"
          id="wkly-scheduler-no-of-wks"
          class="s-inputwrapper"
          input-class="s-inputtext"
          :min="1"
          :max="200"
          :allow-empty="false"
          :show-buttons="true"
          button-layout="stacked"
          style="width: 6rem; font-size: 0.875rem"
          :input-style="{ width: '100%', 'font-size': '0.875rem' }"
        />

        <label for="wkly-scheduler-no-of-wks" class="s-label">
          {{ plural(year, 'Year', 'Years') }}
        </label>
      </Stack>

      <Stack type="vstack" :spacing="0" style="width: 100%; align-items: center">
        <label class="s-label" style="align-self: self-start">in</label>
        <SelectButton
          v-model="months"
          data-grid-col="4"
          class="s-selectbutton grided"
          :multiple="true"
          :options="monthOptions"
          option-label="alt"
          option-value="value"
        />
      </Stack>

      <Stack type="vstack" :spacing="1">
        <Stack type="hstack" :spacing="1">
          <Checkbox
            v-model="weekdayRelActive"
            class="s-checkbox"
            data-s-wkrel
            input-id="weekday-rel"
            :binary="true"
          />
          <label for="weekday-rel" class="s-label">On The</label>
        </Stack>

        <Stack type="hstack" :spacing="2">
          <Select
            v-model="ordinal"
            class="s-select"
            dropdown-icon="pi pi-angle-down"
            label-class="s-select-label"
            overlay-class="s-select-overlay"
            :disabled="!weekdayRelActive"
            :options="ordinalOptionsGroup"
            option-label="alt"
            option-value="value"
            option-group-label="group"
            option-group-children="items"
          >
            <template #optiongroup="{ option }">
              <Divider v-if="option.group === 'others'" style="margin: 0" />
              <span v-else aria-hidden="true" />
            </template>
          </Select>

          <Select
            v-model="weekday"
            class="s-select"
            dropdown-icon="pi pi-angle-down"
            label-class="s-select-label"
            overlay-class="s-select-overlay"
            :disabled="!weekdayRelActive"
            :options="weekdayOptions"
            option-label="alt"
            option-value="value"
          />
        </Stack>
      </Stack>
    </Stack>
  </div>
</template>

<style scoped>
.s-weekly-scheduler {
  --scheduler-inner-padding: 1rem;

  position: relative;
  padding: var(--scheduler-inner-padding);
  width: 100%;

  &::after {
    content: '';
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    border-radius: 0.6875rem;
    pointer-events: none;
    border: 1px solid rgba(var(--s-primary-color-rgb) / 0.3);
    background-color: rgba(var(--s-primary-color-rgb) / 0.025);
  }
}

.s-selectbutton {
  &.grided {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
}

.s-checkbox {
  --p-checkbox-width: 1em;
  --p-checkbox-height: 1em;

  & svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
</style>

<style>
.s-selectbutton[data-grid-col='4'].grided {
  & > .p-togglebutton {
    border-width: 0 0 1px 1px;

    &:first-child {
      border-bottom-left-radius: 0;
    }

    &:nth-child(4n) {
      border-right-width: 1px;
    }

    /* The 1st through to 4th child */
    &:nth-child(n + 1):nth-child(-n + 4) {
      border-top-width: 1px;
    }

    &:last-child {
      border-top-right-radius: 0;
      border-right-width: 1px;
    }
  }
}
</style>

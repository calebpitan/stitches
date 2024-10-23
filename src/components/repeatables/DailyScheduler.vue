<script setup lang="ts">
import { ref } from 'vue'

import { plural } from '@/utils'

import Stack from '../stack/Stack.vue'

const day = ref(1)
</script>

<template>
  <div class="s-daily-scheduler">
    <Stack type="hstack" :spacing="4">
      <span class="s-label">Every</span>

      <InputNumber
        v-model="day"
        id="dly-scheduler-no-of-dys"
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

      <label for="dly-scheduler-no-of-dys" class="s-label">
        {{ plural(day, 'Day', 'Days') }}
      </label>
    </Stack>
  </div>
</template>

<style scoped>
.s-daily-scheduler {
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

.s-label {
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
/* 
.s-select {
  width: fit-content;
  max-width: 150px;
} */
</style>

<script setup lang="ts">
import { ref } from 'vue'

interface ManagementScheduleProps {}

const props = withDefaults(defineProps<ManagementScheduleProps>(), {})
const day = ref<Date | null>(null)
</script>

<template>
  <div>
    <DatePicker v-model="day" />
  </div>
</template>

<style scoped></style>

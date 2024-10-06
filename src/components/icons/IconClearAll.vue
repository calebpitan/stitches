<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import ClearAll from '@/assets/icons/clear-all.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <ClearAll width="1em" height="1em" fill="currentColor" v-bind="$attrs" />
  </SIcon>
</template>

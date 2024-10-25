<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import Sort from '@/assets/icons/sort.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <Sort width="1.25em" height="1.25em" fill="currentColor" aria-label="Sort" v-bind="$attrs" />
  </SIcon>
</template>

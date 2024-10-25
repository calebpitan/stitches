<script setup lang="ts">
import type { SVGAttributes } from 'vue'

import Sidebar from '@/assets/icons/sidebar.svg'

import SIcon from './SIcon.vue'

interface Props extends /* @vue-ignore */ SVGAttributes {}

defineOptions({ inheritAttrs: false })
defineProps<Props>()
</script>

<template>
  <SIcon>
    <Sidebar
      width="1em"
      height="1em"
      fill="currentColor"
      aria-label="Toggle sidebar"
      v-bind="$attrs"
    />
  </SIcon>
</template>

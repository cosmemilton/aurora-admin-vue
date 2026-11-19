<script setup lang="ts">
import { CmNativeSelect } from '@cosmemilton/ui-vue'
defineProps<{ options?: { value: string; label: string }[]; label?: string }>()
const status = defineModel<string>({ default: '' })
</script>
<template>
  <CmNativeSelect v-model="status" :label="label ?? 'Situação'" :options="[{ value: '', label: 'Todas as situações' }, ...(options ?? [])]" />
</template>
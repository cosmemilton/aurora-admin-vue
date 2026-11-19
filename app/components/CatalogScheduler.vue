<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { CmButton, CmStack, CmText } from '@cosmemilton/ui-vue'
import { addDays, dayKey, dayTitle, eventSummary, hourMarks, sampleEvents, scheduleTitle, selectSlot, slots, startMinute,
  time, timeRange, visibleDays, weekdays, type ScheduleEvent } from '../core/catalogScheduler'

const props = defineProps<{ advanced: boolean }>()
const today = new Date()
const date = ref(today)
const weekly = ref(false)
const events = ref(sampleEvents(today))
const selected = ref<ScheduleEvent>()
const days = computed(() => visibleDays(date.value, weekly.value))

function reserve(day: Date, minute: number) {
  const event = selectSlot(events.value, day, minute)
  if (!events.value.includes(event)) events.value = [...events.value, event]
  selected.value = event
}
</script>

<template>
  <CmStack gap="sm">
    <div class="cm-scheduler" :style="{ '--cm-scheduler-days': days.length }">
      <div v-if="props.advanced" class="cm-scheduler__toolbar">
        <div class="cm-scheduler__nav">
          <CmButton variant="outline" size="sm" icon-only :aria-label="weekly ? 'Semana anterior' : 'Dia anterior'"
            @click="date = addDays(date, weekly ? -7 : -1)"><template #icon><ChevronLeft :size="16" /></template></CmButton>
          <CmButton variant="outline" size="sm" @click="date = today">Hoje</CmButton>
          <CmButton variant="outline" size="sm" icon-only :aria-label="weekly ? 'Próxima semana' : 'Próximo dia'"
            @click="date = addDays(date, weekly ? 7 : 1)"><template #icon><ChevronRight :size="16" /></template></CmButton>
        </div>
        <span class="cm-scheduler__title" aria-live="polite">{{ scheduleTitle(days) }}</span>
        <div class="cm-scheduler__views" role="group" aria-label="Visão da agenda">
          <CmButton size="sm" :variant="weekly ? 'outline' : 'solid'" :aria-pressed="!weekly" @click="weekly = false">Dia</CmButton>
          <CmButton size="sm" :variant="weekly ? 'solid' : 'outline'" :aria-pressed="weekly" @click="weekly = true">Semana</CmButton>
        </div>
      </div>
      <div class="cm-scheduler__scroll" :role="weekly ? 'region' : undefined" :aria-label="weekly ? 'Horários da semana' : undefined"
        :tabindex="weekly ? 0 : undefined">
        <div class="cm-scheduler__grid">
          <div class="cm-scheduler__corner" aria-hidden="true" />
          <div v-for="day in days" :key="dayKey(day)" class="cm-scheduler__day-header"
            :class="{ 'cm-scheduler__day-header--today': dayKey(day) === dayKey(today) }">
            <span class="cm-scheduler__day-name">{{ weekdays.format(day) }}</span>
            <span class="cm-scheduler__day-number">{{ day.getDate() }}</span>
          </div>
          <div class="cm-scheduler__gutter" aria-hidden="true">
            <span v-for="hour in hourMarks" :key="hour" class="cm-scheduler__gutter-label">{{ time(hour) }}</span>
          </div>
          <div v-for="day in days" :key="'slots-' + dayKey(day)" class="cm-scheduler__day-col"
            :class="{ 'cm-scheduler__day-col--today': dayKey(day) === dayKey(today) }">
            <template v-for="minute in slots" :key="minute">
              <button v-if="props.advanced" type="button" class="cm-scheduler__slot" :class="{ 'cm-scheduler__slot--minor': minute % 60 !== 0 }"
                :aria-label="dayTitle.format(day) + ', ' + time(minute)" @click="reserve(day, minute)" />
              <div v-else class="cm-scheduler__slot" :class="{ 'cm-scheduler__slot--minor': minute % 60 !== 0 }" aria-hidden="true" />
            </template>
            <button v-for="event in events.filter(item => item.day === dayKey(day))" :key="event.start" type="button"
              class="cm-scheduler__event" :class="'cm-scheduler__event--tone-' + event.tone"
              :style="{ top: (event.start - startMinute) * 0.8 + 'px', height: event.duration * 0.8 + 'px', left: '0', width: 'calc(100% - 2px)' }"
              :aria-label="event.title + ', ' + timeRange(event)" @click="selected = event">
              <span class="cm-scheduler__event-time">{{ timeRange(event) }}</span>
              <span class="cm-scheduler__event-title">{{ event.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <CmText v-if="props.advanced || selected" size="sm" aria-live="polite">
      {{ selected ? eventSummary(selected, props.advanced) : 'Selecione um horário livre para incluir uma visita de 30 minutos.' }}
    </CmText>
  </CmStack>
</template>

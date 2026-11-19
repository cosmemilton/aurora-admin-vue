export type ScheduleEvent = {
  day: string
  start: number
  duration: number
  title: string
  tone: 'info' | 'success' | 'primary'
}

export const weekdays = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
export const dayTitle = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekEnd = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
export const startMinute = 8 * 60
export const slotDuration = 30
export const hourMarks = Array.from({ length: 5 }, (_, index) => startMinute + index * 60)
export const slots = Array.from({ length: 10 }, (_, index) => startMinute + index * slotDuration)
export const dayKey = (date: Date) => [date.getFullYear(), date.getMonth(), date.getDate()].join('-')
export const time = (minute: number) => [Math.floor(minute / 60), minute % 60].map(n => String(n).padStart(2, '0')).join(':')
export const timeRange = (event: ScheduleEvent) => time(event.start) + ' – ' + time(event.start + event.duration)

export function addDays(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count, 12)
}

export function visibleDays(date: Date, weekly: boolean) {
  if (!weekly) return [date]
  const first = addDays(date, -((date.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => addDays(first, index))
}

export function scheduleTitle(days: Date[]) {
  const first = days[0]!
  const last = days[days.length - 1]!
  if (days.length === 1) return dayTitle.format(first)
  if (first.getMonth() === last.getMonth()) return first.getDate() + ' – ' + weekEnd.format(last)
  return shortDate.format(first) + ' – ' + shortDate.format(last) + ' de ' + last.getFullYear()
}

export function sampleEvents(day: Date): ScheduleEvent[] {
  return [
    { day: dayKey(day), start: 9 * 60, duration: 60, title: 'Coleta de materiais', tone: 'info' },
    { day: dayKey(day), start: 11 * 60, duration: 60, title: 'Vistoria da unidade', tone: 'success' },
  ]
}

export function selectSlot(events: ScheduleEvent[], day: Date, start: number): ScheduleEvent {
  const key = dayKey(day)
  return events.find(event => event.day === key && event.start < start + slotDuration && event.start + event.duration > start)
    ?? { day: key, start, duration: slotDuration, title: 'Visita técnica', tone: 'primary' }
}

export function eventSummary(event: ScheduleEvent, advanced: boolean) {
  const clock = time(event.start)
  if (!advanced) return event.title + ' · ' + clock
  const [year, month, day] = event.day.split('-').map(Number) as [number, number, number]
  return event.title + ' · ' + longDate.format(new Date(year, month, day, 12)) + ' às ' + clock
}

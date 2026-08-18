import { ref, computed } from 'vue';
import { addDays, subDays, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, format } from 'date-fns';
import { generateMonthGrid, generateWeekDays, getTodayDateString, parseLocalDate } from '@/utils/date';
import { useTaskStore } from '@/stores/task.store';
import type { CalendarViewType, CalendarDayCell, HourlySlot } from '@/types/calendar';
import type { Task } from '@/types/task';

export function useCalendar() {
  const currentDate = ref<Date>(new Date());
  const selectedDate = ref<string>(getTodayDateString());
  const viewMode = ref<CalendarViewType>('day');
  const taskStore = useTaskStore();

  const selectedDateObject = computed(() => parseLocalDate(selectedDate.value));

  const formattedMonthYear = computed(() => {
    return format(currentDate.value, 'MMMM yyyy');
  });

  const formattedSelectedDate = computed(() => {
    return format(selectedDateObject.value, 'EEEE, d MMMM yyyy');
  });

  // Month grid cells
  const monthCells = computed<CalendarDayCell[]>(() => {
    const days = generateMonthGrid(currentDate.value);
    const todayStr = getTodayDateString();

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, currentDate.value);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate.value;
      const tasks = taskStore.tasks.filter((t) => t.task_date === dateStr && !t.is_deleted);

      return {
        date: day,
        dateString: dateStr,
        isCurrentMonth,
        isToday,
        isSelected,
        tasks,
      };
    });
  });

  // Week days
  const weekDays = computed<CalendarDayCell[]>(() => {
    const days = generateWeekDays(selectedDateObject.value);
    const todayStr = getTodayDateString();

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate.value;
      const tasks = taskStore.tasks.filter((t) => t.task_date === dateStr && !t.is_deleted);

      return {
        date: day,
        dateString: dateStr,
        isCurrentMonth: true,
        isToday,
        isSelected,
        tasks,
      };
    });
  });

  // Hourly slots for Day view (0:00 to 23:00)
  const hourlySlots = computed<HourlySlot[]>(() => {
    const dateStr = selectedDate.value;
    const dayTasks = taskStore.tasks.filter((t) => t.task_date === dateStr && !t.is_deleted);

    const slots: HourlySlot[] = [];
    for (let h = 0; h < 24; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;

      const matchedTasks = dayTasks.filter((t) => {
        if (t.is_all_day) return false;
        if (!t.start_time) return false;
        const taskHour = parseInt(t.start_time.split(':')[0], 10);
        return taskHour === h;
      });

      slots.push({
        hour: h,
        timeString: timeStr,
        tasks: matchedTasks,
      });
    }

    return slots;
  });

  // All-day tasks for selected date
  const allDayTasks = computed<Task[]>(() => {
    return taskStore.tasks.filter(
      (t) => t.task_date === selectedDate.value && !t.is_deleted && (t.is_all_day || !t.start_time)
    );
  });

  // Navigation handlers
  function goToday() {
    currentDate.value = new Date();
    selectedDate.value = getTodayDateString();
  }

  function goNext() {
    if (viewMode.value === 'month') {
      currentDate.value = addMonths(currentDate.value, 1);
    } else if (viewMode.value === 'week') {
      const nextWeek = addWeeks(selectedDateObject.value, 1);
      currentDate.value = nextWeek;
      selectedDate.value = format(nextWeek, 'yyyy-MM-dd');
    } else {
      const nextDay = addDays(selectedDateObject.value, 1);
      currentDate.value = nextDay;
      selectedDate.value = format(nextDay, 'yyyy-MM-dd');
    }
  }

  function goPrev() {
    if (viewMode.value === 'month') {
      currentDate.value = subMonths(currentDate.value, 1);
    } else if (viewMode.value === 'week') {
      const prevWeek = subWeeks(selectedDateObject.value, 1);
      currentDate.value = prevWeek;
      selectedDate.value = format(prevWeek, 'yyyy-MM-dd');
    } else {
      const prevDay = subDays(selectedDateObject.value, 1);
      currentDate.value = prevDay;
      selectedDate.value = format(prevDay, 'yyyy-MM-dd');
    }
  }

  function selectDate(dateStr: string) {
    selectedDate.value = dateStr;
    currentDate.value = parseLocalDate(dateStr);
  }

  return {
    currentDate,
    selectedDate,
    selectedDateObject,
    viewMode,
    formattedMonthYear,
    formattedSelectedDate,
    monthCells,
    weekDays,
    hourlySlots,
    allDayTasks,
    goToday,
    goNext,
    goPrev,
    selectDate,
  };
}

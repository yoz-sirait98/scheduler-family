<template>
  <component :is="resolvedIcon" :class="[sizeClass, customClass]" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Users,
  Home,
  Briefcase,
  DollarSign,
  HeartPulse,
  User,
  Folder,
  Calendar,
  Bell,
  BookOpen,
  ShoppingBag,
  Utensils,
  CheckCircle,
  Tag,
  Star,
  Sparkles,
  Smile,
  GraduationCap,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    customClass?: string;
  }>(),
  {
    name: 'Folder',
    size: 'md',
    customClass: '',
  }
);

const iconMap: Record<string, any> = {
  Users,
  Home,
  Briefcase,
  DollarSign,
  HeartPulse,
  User,
  Folder,
  Calendar,
  Bell,
  BookOpen,
  ShoppingBag,
  Utensils,
  CheckCircle,
  Tag,
  Star,
  Sparkles,
  Smile,
  GraduationCap,
};

const resolvedIcon = computed(() => {
  return iconMap[props.name || 'Folder'] || Folder;
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3.5 h-3.5';
    case 'lg':
      return 'w-6 h-6';
    case 'md':
    default:
      return 'w-4 h-4';
  }
});
</script>

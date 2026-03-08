import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = {
  quick: {
    id: 'quick',
    name: 'Quick Notes',
    emoji: '📝',
    color: '#FF6B35',
    placeholder: "What's on your mind?",
    description: "Capture fleeting thoughts instantly."
  },
  links: {
    id: 'links',
    name: 'Links & URLs',
    emoji: '🔗',
    color: '#00D4AA',
    placeholder: "Paste URL here...",
    description: "Save interesting articles and resources."
  },
  ideas: {
    id: 'ideas',
    name: 'Ideas and Prompts',
    emoji: '💡',
    color: '#FFD23F',
    placeholder: "Scribble your idea...",
    description: "Don't let a great idea escape."
  },
  credentials: {
    id: 'credentials',
    name: 'Credentials',
    emoji: '🔐',
    color: '#EE4266',
    placeholder: "Service, username, password, notes...",
    description: "Securely store your sensitive data."
  },
  people: {
    id: 'people',
    name: 'Special Days',
    emoji: '🎂',
    color: '#A78BFA',
    placeholder: "Person's name, date, how you know them...",
    description: "Birthdays and anniversaries."
  },
  todo: {
    id: 'todo',
    name: 'TO DO',
    emoji: '✅',
    color: '#10B981',
    placeholder: "Task description...",
    description: "Organize your tasks."
  },
  numbers: {
    id: 'numbers',
    name: 'Numbers',
    emoji: '📊',
    color: '#3B82F6',
    placeholder: "Bank account, phone number...",
    description: "Track important numbers."
  }
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const THEME = {
  bg: '#0a0a0f',
  card: '#12121a',
  elevated: '#1a1a24',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.30)',
  border: 'rgba(255,255,255,0.06)',
};

export type Relationship = 'Friends' | 'Family' | 'Work' | 'Other';
export type BirthdayInput = {
  name: string;
  month: number;
  day: number;
  year: number | null;
  relationship: Relationship;
  favorite: boolean;
  notes: string;
  reminderDays: number;
  color: string;
};
export type Birthday = BirthdayInput & { id: string };
export type View = 'overview' | 'birthdays' | 'calendar' | 'reminders' | 'settings';
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

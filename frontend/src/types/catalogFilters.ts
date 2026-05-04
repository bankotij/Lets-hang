import type { LiveEvent } from './event';

export type SearchFilters = {
  query?: string;
  category?: LiveEvent['category'] | 'all';
};

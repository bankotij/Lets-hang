import type { EventCategory } from '../types/event';

/** Premium CSS gradient covers when no flyer image (screenshot-friendly). */
export function getCategoryCoverGradient(category: EventCategory): string {
  const map: Record<EventCategory, string> = {
    party: 'linear-gradient(145deg, #a855f7 0%, #ec4899 55%, #f472b6 100%)',
    music: 'linear-gradient(145deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%)',
    food: 'linear-gradient(145deg, #ea580c 0%, #ef4444 45%, #f97316 100%)',
    sports: 'linear-gradient(145deg, #059669 0%, #0d9488 50%, #2563eb 100%)',
    art: 'linear-gradient(145deg, #db2777 0%, #a855f7 50%, #7c3aed 100%)',
    tech: 'linear-gradient(145deg, #0891b2 0%, #4f46e5 55%, #4338ca 100%)',
    social: 'linear-gradient(145deg, #d97706 0%, #c026d3 50%, #7c3aed 100%)',
    wedding: 'linear-gradient(145deg, #f472b6 0%, #e879f9 50%, #c084fc 100%)',
    corporate: 'linear-gradient(145deg, #475569 0%, #334155 50%, #1e293b 100%)',
    'sports-tournament': 'linear-gradient(145deg, #047857 0%, #0e7490 50%, #1d4ed8 100%)',
    workshop: 'linear-gradient(145deg, #ca8a04 0%, #ea580c 40%, #dc2626 100%)',
    other: 'linear-gradient(145deg, #27272a 0%, #3f3f46 50%, #52525b 100%)',
  };
  return map[category] ?? map.other;
}

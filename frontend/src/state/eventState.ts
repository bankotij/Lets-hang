import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { eventApi } from '../api/eventApi';
import type { EventDraft } from '../types/event';

const eventDraftAtom = atom<EventDraft>({
  name: '',
  quickLinks: [],
  links: [],
  gallery: [],
  tags: [],
});

export function useEventDraft() {
  return useAtomValue(eventDraftAtom);
}

export function useEventDraftActions() {
  const setDraft = useSetAtom(eventDraftAtom);

  return {
    async loadDraft() {
      const result = await eventApi.getDraft();
      if (result.ok) {
        setDraft(result.data);
      }
      return result;
    },

    async updateDraft(patch: Partial<EventDraft>) {
      const result = await eventApi.saveDraft(patch);
      if (result.ok) {
        setDraft(result.data);
      }
      return result;
    },
  };
}

export function useInitEventDraft() {
  const draft = useAtomValue(eventDraftAtom);
  const { loadDraft } = useEventDraftActions();

  useEffect(() => {
    const hasData = draft.name !== '' || draft.quickLinks.length > 0;
    if (!hasData) {
      loadDraft();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

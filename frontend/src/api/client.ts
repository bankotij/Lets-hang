export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// swap this implementation later with real fetch() in 1–2 lines per function
export async function mockCall<T>(fn: () => T, ms = 250): Promise<ApiResult<T>> {
  await sleep(ms);
  try {
    return { ok: true, data: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

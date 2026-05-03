interface OverrideEntry {
  isPro: boolean;
  simulated: boolean;
}

const devProOverrides = new Map<string, OverrideEntry>();

export function setDevProOverride(userId: string, isPro: boolean, simulated = false): void {
  devProOverrides.set(userId, { isPro, simulated });
}

export function getDevProOverride(userId: string): boolean | undefined {
  return devProOverrides.get(userId)?.isPro;
}

export function getDevOverrideEntry(userId: string): OverrideEntry | undefined {
  return devProOverrides.get(userId);
}

export function clearDevProOverride(userId: string): void {
  devProOverrides.delete(userId);
}

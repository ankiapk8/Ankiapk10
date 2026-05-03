const devProOverrides = new Map<string, boolean>();

export function setDevProOverride(userId: string, isPro: boolean): void {
  devProOverrides.set(userId, isPro);
}

export function getDevProOverride(userId: string): boolean | undefined {
  return devProOverrides.get(userId);
}

export function clearDevProOverride(userId: string): void {
  devProOverrides.delete(userId);
}

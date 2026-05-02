let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void): void {
    sessionExpiredHandler = handler;
}

export function triggerSessionExpired(): void {
    sessionExpiredHandler?.();
}

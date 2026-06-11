import { setSessionExpiredHandler, triggerSessionExpired } from '../Utils/sessionManager';

describe('sessionManager', () => {
    it('invokes the registered handler when the session expires', () => {
        const handler = jest.fn();
        setSessionExpiredHandler(handler);

        triggerSessionExpired();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('invokes the handler each time the session expires', () => {
        const handler = jest.fn();
        setSessionExpiredHandler(handler);

        triggerSessionExpired();
        triggerSessionExpired();

        expect(handler).toHaveBeenCalledTimes(2);
    });

    it('replaces the previous handler when a new one is registered', () => {
        const first = jest.fn();
        const second = jest.fn();
        setSessionExpiredHandler(first);
        setSessionExpiredHandler(second);

        triggerSessionExpired();

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

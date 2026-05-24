import KeyGenerator from '../Utilities/KeyGenerator';

describe('KeyGenerator', () => {
    it('returns a number', () => {
        expect(typeof KeyGenerator.GenerateKey()).toBe('number');
    });

    it('returns a non-negative integer', () => {
        const key = KeyGenerator.GenerateKey();
        expect(key).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(key)).toBe(true);
    });

    it('returns different values on repeated calls', () => {
        const keys = new Set(Array.from({ length: 10 }, () => KeyGenerator.GenerateKey()));
        expect(keys.size).toBeGreaterThan(1);
    });
});

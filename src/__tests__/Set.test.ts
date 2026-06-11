import Set from '../Domain/Set';

describe('Set', () => {
    describe('constructor', () => {
        it('defaults Completed to false and leaves optional fields undefined', () => {
            const set = new Set();
            expect(set.Id).toBeUndefined();
            expect(typeof set.Key).toBe('number');
            expect(set.Reps).toBeUndefined();
            expect(set.Weight).toBeUndefined();
            expect(set.Completed).toBe(false);
            expect(set.Order).toBeUndefined();
        });

        it('keeps provided values', () => {
            const set = new Set({ Id: 's-1', Reps: 12, Weight: 60, Completed: true, Order: 2 });
            expect(set).toMatchObject({ Id: 's-1', Reps: 12, Weight: 60, Completed: true, Order: 2 });
        });
    });

    describe('ToData', () => {
        it('serializes all fields to the DTO shape', () => {
            const set = new Set({ Id: 's-1', Reps: 12, Weight: 60, Completed: true, Order: 2 });
            expect(set.ToData()).toEqual({
                id: 's-1',
                reps: 12,
                weight: 60,
                completed: true,
                order: 2,
            });
        });
    });
});

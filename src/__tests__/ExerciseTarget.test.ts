import ExerciseTarget from '../Domain/ExerciseTarget';
import { TargetSource } from '../Enums/TargetSource';

describe('ExerciseTarget', () => {
    describe('constructor', () => {
        it('defaults to a previous-workout target with no sets', () => {
            const target = new ExerciseTarget();
            expect(target.Type).toBe(TargetSource.Previous);
            expect(target.Sets).toEqual([]);
        });

        it('keeps an explicit Plan type', () => {
            expect(new ExerciseTarget({ Type: TargetSource.Plan }).Type).toBe(TargetSource.Plan);
        });

        it('keeps an explicit Previous type rather than falling through the default', () => {
            expect(new ExerciseTarget({ Type: TargetSource.Previous }).Type).toBe(TargetSource.Previous);
        });
    });

    describe('FromData', () => {
        it('maps the type and sets', () => {
            const target = ExerciseTarget.FromData({
                type: TargetSource.Plan,
                sets: [
                    { weight: 225, reps: 5 },
                    { weight: 225, reps: 3 },
                ],
            });

            expect(target.Type).toBe(TargetSource.Plan);
            expect(target.Sets).toEqual([
                { Weight: 225, Reps: 5 },
                { Weight: 225, Reps: 3 },
            ]);
        });

        it('treats missing sets as none', () => {
            const target = ExerciseTarget.FromData({ type: TargetSource.Previous } as any);
            expect(target.Sets).toEqual([]);
        });
    });

    describe('ToData', () => {
        it('serializes back to the DTO shape', () => {
            const target = new ExerciseTarget({
                Type: TargetSource.Plan,
                Sets: [{ Weight: 185, Reps: 8 }],
            });

            expect(target.ToData()).toEqual({
                type: TargetSource.Plan,
                sets: [{ weight: 185, reps: 8 }],
            });
        });

        it('round-trips a target through FromData and ToData', () => {
            const original = { type: TargetSource.Previous, sets: [{ weight: 100, reps: 10 }] };
            expect(ExerciseTarget.FromData(original).ToData()).toEqual(original);
        });
    });
});

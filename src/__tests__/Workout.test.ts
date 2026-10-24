import Workout from '../Domain/Workout';
import Exercise from '../Domain/Exercise';
import Set from '../Domain/Set';
import { TargetSource } from '../Enums/TargetSource';

describe('Workout', () => {
    describe('constructor', () => {
        it('defaults exercises to an empty array', () => {
            const workout = new Workout();
            expect(workout.Id).toBeUndefined();
            expect(workout.AddDateTime).toBeUndefined();
            expect(workout.Exercises).toEqual([]);
        });
    });

    describe('FromData', () => {
        it('maps id, date, exercises, targets and sets', () => {
            const workout = Workout.FromData({
                id: 'w-1',
                addDateTime: '2026-06-10T08:30:00Z' as unknown as Date,
                exercises: [
                    {
                        exerciseInfoId: 'info-1',
                        exerciseInfo: { id: 'info-1', name: 'Bench Press' } as any,
                        target: {
                            type: TargetSource.Previous,
                            sets: [{ weight: 95, reps: 8 }],
                        },
                        sets: [
                            { id: 's-1', reps: 10, weight: 100, completed: true },
                            { id: 's-2', reps: 8, weight: 105, completed: false },
                        ],
                    },
                ],
            });

            expect(workout.Id).toBe('w-1');
            expect(workout.AddDateTime).toEqual(new Date('2026-06-10T08:30:00Z'));

            const exercise = workout.Exercises[0];
            expect(exercise.ExerciseInfoId).toBe('info-1');
            expect(exercise.ExerciseInfo?.Id).toBe('info-1');
            expect(exercise.ExerciseInfo?.Name).toBe('Bench Press');

            expect(exercise.Target?.Type).toBe(TargetSource.Previous);
            expect(exercise.Target?.Sets).toHaveLength(1);
            expect(exercise.Target?.Sets[0].Reps).toBe(8);
            expect(exercise.Target?.Sets[0].Weight).toBe(95);

            expect(exercise.Sets).toHaveLength(2);
            expect(exercise.Sets[0]).toMatchObject({ Id: 's-1', Reps: 10, Weight: 100, Completed: true });
            expect(exercise.Sets[1]).toMatchObject({ Id: 's-2', Reps: 8, Weight: 105, Completed: false });
        });

        it('handles missing optional fields', () => {
            const workout = Workout.FromData({ id: 'w-2' });

            expect(workout.Id).toBe('w-2');
            expect(workout.AddDateTime).toBeUndefined();
            expect(workout.Exercises).toEqual([]);
        });

        it('leaves exercise info and target undefined when absent', () => {
            const workout = Workout.FromData({
                id: 'w-3',
                exercises: [{ exerciseInfoId: 'info-1' }],
            });

            const exercise = workout.Exercises[0];
            expect(exercise.ExerciseInfo).toBeUndefined();
            expect(exercise.Target).toBeUndefined();
            expect(exercise.Sets).toEqual([]);
        });
    });

    describe('ToData', () => {
        it('serializes the workout and its exercises', () => {
            const workout = new Workout({
                Id: 'w-1',
                Exercises: [
                    new Exercise({
                        ExerciseInfoId: 'info-1',
                        Sets: [new Set({ Reps: 5, Weight: 135, Completed: true })],
                    }),
                ],
            });

            const data = workout.ToData();

            expect(data.id).toBe('w-1');
            expect(data.exercises).toHaveLength(1);
            expect(data.exercises?.[0].exerciseInfoId).toBe('info-1');
            expect(data.exercises?.[0].sets?.[0]).toMatchObject({ reps: 5, weight: 135, completed: true });
        });
    });
});

import Exercise from '../Domain/Exercise';
import ExerciseInfo from '../Domain/ExerciseInfo';
import Set from '../Domain/Set';
import { MuscleGroup } from '../Enums/MuscleGroup';

describe('Exercise', () => {
    describe('constructor', () => {
        it('resolves ExerciseInfoId from an explicit id', () => {
            const exercise = new Exercise({ ExerciseInfoId: 'info-1' });
            expect(exercise.ExerciseInfoId).toBe('info-1');
        });

        it('falls back to the nested ExerciseInfo id', () => {
            const exercise = new Exercise({
                ExerciseInfo: new ExerciseInfo({ Id: 'info-2', Name: 'Squat' }),
            });
            expect(exercise.ExerciseInfoId).toBe('info-2');
        });

        it('throws when no exercise info id can be resolved', () => {
            expect(() => new Exercise()).toThrow(
                'Unable to resolve ExerciseInfoId when constructing Exercise'
            );
        });

        it('generates a key and defaults sets to an empty array', () => {
            const exercise = new Exercise({ ExerciseInfoId: 'info-1' });
            expect(typeof exercise.Key).toBe('number');
            expect(exercise.Sets).toEqual([]);
        });
    });

    describe('FromData', () => {
        it('maps the DTO including nested exercise info and sets', () => {
            const exercise = Exercise.FromData({
                exerciseInfoId: 'info-1',
                exerciseInfo: {
                    id: 'info-1',
                    name: 'Bench Press',
                    primaryMuscleGroup: MuscleGroup.Chest,
                    secondaryMuscleGroups: [MuscleGroup.Triceps],
                },
                sets: [{ reps: 10, weight: 100, order: 1 }],
            });

            expect(exercise.ExerciseInfoId).toBe('info-1');
            expect(exercise.ExerciseInfo?.Name).toBe('Bench Press');
            expect(exercise.ExerciseInfo?.PrimaryMuscleGroup).toBe(MuscleGroup.Chest);
            expect(exercise.Sets).toHaveLength(1);
            expect(exercise.Sets[0].Reps).toBe(10);
            expect(exercise.Sets[0].Weight).toBe(100);
            expect(exercise.Sets[0].Order).toBe(1);
        });

        it('sorts sets by order, treating missing order as 0', () => {
            const exercise = Exercise.FromData({
                exerciseInfoId: 'info-1',
                sets: [
                    { reps: 8, order: 3 },
                    { reps: 12 },
                    { reps: 10, order: 1 },
                ],
            });

            expect(exercise.Sets.map(s => s.Reps)).toEqual([12, 10, 8]);
        });

        it('defaults to an empty set list when the DTO has no sets', () => {
            const exercise = Exercise.FromData({ exerciseInfoId: 'info-1' });
            expect(exercise.Sets).toEqual([]);
        });
    });

    describe('ToData', () => {
        it('serializes the exercise back to DTO shape', () => {
            const exercise = new Exercise({
                ExerciseInfo: new ExerciseInfo({
                    Id: 'info-1',
                    Name: 'Bench Press',
                    PrimaryMuscleGroup: MuscleGroup.Chest,
                }),
                Sets: [new Set({ Id: 'set-1', Reps: 5, Weight: 225, Completed: true })],
            });

            const data = exercise.ToData();

            expect(data.exerciseInfoId).toBe('info-1');
            expect(data.exerciseInfo?.name).toBe('Bench Press');
            expect(data.sets).toEqual([{ id: 'set-1', reps: 5, weight: 225, completed: true }]);
        });

        it('omits exercise info when none is attached', () => {
            const exercise = new Exercise({ ExerciseInfoId: 'info-1' });
            expect(exercise.ToData().exerciseInfo).toBeUndefined();
        });
    });
});

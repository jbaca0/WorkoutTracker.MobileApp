import WorkoutTemplate from '../Domain/WorkoutTemplate';
import WorkoutTemplateExercise from '../Domain/WorkoutTemplateExercise';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { MuscleGroup } from '../Enums/MuscleGroup';

const exerciseInfoData = {
    id: 'info-1',
    name: 'Bench Press',
    primaryMuscleGroup: MuscleGroup.Chest,
    secondaryMuscleGroups: [MuscleGroup.Triceps],
};

describe('WorkoutTemplate', () => {
    describe('constructor', () => {
        it('defaults to empty id, name and exercises', () => {
            const template = new WorkoutTemplate();
            expect(template.Id).toBe('');
            expect(template.Name).toBe('');
            expect(template.Exercises).toEqual([]);
        });

        it('keeps the values it is given', () => {
            const template = new WorkoutTemplate({ Id: 'template-1', Name: 'Push day' });
            expect(template.Id).toBe('template-1');
            expect(template.Name).toBe('Push day');
        });
    });

    describe('FromData', () => {
        it('maps id, name and exercises', () => {
            const template = WorkoutTemplate.FromData({
                id: 'template-1',
                name: 'Push day',
                exercises: [
                    {
                        id: 'tex-1',
                        exerciseInfoId: 'info-1',
                        exerciseInfo: exerciseInfoData,
                        order: 0,
                        sets: [
                            { id: 's-1', order: 0, reps: 10 },
                            { id: 's-2', order: 1, reps: 8 },
                        ],
                    },
                ],
            });

            expect(template.Id).toBe('template-1');
            expect(template.Name).toBe('Push day');
            const exercise = template.Exercises[0];
            expect(exercise).toBeInstanceOf(WorkoutTemplateExercise);
            expect(exercise.ExerciseInfo?.Name).toBe('Bench Press');
            expect(exercise.Sets.map(s => s.Reps)).toEqual([10, 8]);
        });

        it('handles a template with no exercises', () => {
            const template = WorkoutTemplate.FromData({ id: 'template-2', name: 'Empty', exercises: [] });
            expect(template.Exercises).toEqual([]);
        });
    });

    describe('ToData', () => {
        it('serializes back to the DTO shape', () => {
            const template = new WorkoutTemplate({
                Id: 'template-1',
                Name: 'Push day',
                Exercises: [
                    new WorkoutTemplateExercise({
                        Id: 'tex-1',
                        ExerciseInfoId: 'info-1',
                        Order: 0,
                        Sets: [{ Reps: 10 }],
                    }),
                ],
            });

            const data = template.ToData();

            expect(data.id).toBe('template-1');
            expect(data.name).toBe('Push day');
            expect(data.exercises).toHaveLength(1);
            expect(data.exercises[0].sets[0].reps).toBe(10);
        });

        it('round-trips a template through FromData and ToData', () => {
            const original = {
                id: 'template-1',
                name: 'Push day',
                exercises: [
                    {
                        id: 'tex-1',
                        exerciseInfoId: 'info-1',
                        exerciseInfo: exerciseInfoData,
                        order: 2,
                        sets: [{ id: 's-1', order: 0, reps: 10 }],
                    },
                ],
            };

            const data = WorkoutTemplate.FromData(original).ToData();

            expect(data.id).toBe(original.id);
            expect(data.name).toBe(original.name);
            expect(data.exercises[0].order).toBe(2);
            expect(data.exercises[0].sets[0].reps).toBe(10);
        });
    });
});

describe('WorkoutTemplateExercise', () => {
    describe('constructor', () => {
        it('defaults ids to empty strings, order to zero and sets to empty', () => {
            const exercise = new WorkoutTemplateExercise();
            expect(exercise.Id).toBe('');
            expect(exercise.ExerciseInfoId).toBe('');
            expect(exercise.ExerciseInfo).toBeUndefined();
            expect(exercise.Order).toBe(0);
            expect(exercise.Sets).toEqual([]);
        });
    });

    describe('FromData', () => {
        it('maps the exercise info and set reps', () => {
            const exercise = WorkoutTemplateExercise.FromData({
                id: 'tex-1',
                exerciseInfoId: 'info-1',
                exerciseInfo: exerciseInfoData,
                order: 1,
                sets: [{ id: 's-1', order: 0, reps: 12 }],
            });

            expect(exercise.Id).toBe('tex-1');
            expect(exercise.ExerciseInfoId).toBe('info-1');
            expect(exercise.ExerciseInfo).toBeInstanceOf(ExerciseInfo);
            expect(exercise.ExerciseInfo?.PrimaryMuscleGroup).toBe(MuscleGroup.Chest);
            expect(exercise.Order).toBe(1);
            expect(exercise.Sets).toEqual([{ Reps: 12 }]);
        });

        it('leaves ExerciseInfo undefined when the DTO has none', () => {
            const exercise = WorkoutTemplateExercise.FromData({
                id: 'tex-1',
                exerciseInfoId: 'info-1',
                order: 0,
                sets: [],
            } as any);

            expect(exercise.ExerciseInfo).toBeUndefined();
        });

        it('treats missing sets as none', () => {
            const exercise = WorkoutTemplateExercise.FromData({
                id: 'tex-1',
                exerciseInfoId: 'info-1',
                order: 0,
            } as any);

            expect(exercise.Sets).toEqual([]);
        });
    });

    describe('ToData', () => {
        it('renumbers set order by position and drops set ids', () => {
            const exercise = new WorkoutTemplateExercise({
                Id: 'tex-1',
                ExerciseInfoId: 'info-1',
                Order: 0,
                Sets: [{ Reps: 10 }, { Reps: 8 }, { Reps: 6 }],
            });

            const data = exercise.ToData();

            // The domain model carries only reps per set, so ToData re-derives order
            // from position and has no id to put back.
            expect(data.sets).toEqual([
                { id: '', order: 0, reps: 10 },
                { id: '', order: 1, reps: 8 },
                { id: '', order: 2, reps: 6 },
            ]);
        });

        it('omits exerciseInfo when the exercise has none', () => {
            const data = new WorkoutTemplateExercise({ Id: 'tex-1', ExerciseInfoId: 'info-1' }).ToData();
            expect(data.exerciseInfo).toBeUndefined();
        });
    });
});

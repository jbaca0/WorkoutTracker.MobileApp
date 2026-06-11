import UserExerciseInfo from '../Domain/UserExerciseInfo';
import ExerciseInfo from '../Domain/ExerciseInfo';
import Exercise from '../Domain/Exercise';
import { MuscleGroup } from '../Enums/MuscleGroup';

describe('UserExerciseInfo', () => {
    describe('constructor', () => {
        it('defaults to a fresh ExerciseInfo and no latest exercise', () => {
            const userInfo = new UserExerciseInfo();
            expect(userInfo.ExerciseInfo).toBeInstanceOf(ExerciseInfo);
            expect(userInfo.LatestExercise).toBeUndefined();
        });
    });

    describe('FromData', () => {
        it('maps the exercise info and latest exercise', () => {
            const userInfo = UserExerciseInfo.FromData({
                exerciseInfo: {
                    id: 'info-1',
                    name: 'Row',
                    primaryMuscleGroup: MuscleGroup.Back,
                    secondaryMuscleGroups: [],
                },
                latestExercise: {
                    exerciseInfoId: 'info-1',
                    sets: [{ reps: 10, weight: 50, order: 1 }],
                },
            });

            expect(userInfo.ExerciseInfo.Name).toBe('Row');
            expect(userInfo.LatestExercise?.Sets).toHaveLength(1);
            expect(userInfo.LatestExercise?.Sets[0].Reps).toBe(10);
        });

        it('leaves LatestExercise undefined when there is no history', () => {
            const userInfo = UserExerciseInfo.FromData({
                exerciseInfo: {
                    id: 'info-1',
                    name: 'Row',
                    primaryMuscleGroup: MuscleGroup.Back,
                    secondaryMuscleGroups: [],
                },
                latestExercise: null as unknown as Exercise,
            } as any);

            expect(userInfo.LatestExercise).toBeUndefined();
        });
    });

    describe('ToData', () => {
        it('serializes back to the DTO shape', () => {
            const userInfo = new UserExerciseInfo({
                ExerciseInfo: new ExerciseInfo({ Id: 'info-1', Name: 'Row', PrimaryMuscleGroup: MuscleGroup.Back }),
            });

            const data = userInfo.ToData();
            expect(data.exerciseInfo.id).toBe('info-1');
            expect(data.exerciseInfo.name).toBe('Row');
            expect(data.latestExercise).toBeUndefined();
        });
    });
});

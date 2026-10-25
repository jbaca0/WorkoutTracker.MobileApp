import UserExerciseInfo from '../Domain/UserExerciseInfo';
import ExerciseInfo from '../Domain/ExerciseInfo';
import ExerciseTargetData from '../DataTransferObjects/Common/ExerciseTarget';
import { MuscleGroup } from '../Enums/MuscleGroup';
import { TargetSource } from '../Enums/TargetSource';

describe('UserExerciseInfo', () => {
    describe('constructor', () => {
        it('defaults to a fresh ExerciseInfo and no target', () => {
            const userInfo = new UserExerciseInfo();
            expect(userInfo.ExerciseInfo).toBeInstanceOf(ExerciseInfo);
            expect(userInfo.Target).toBeUndefined();
        });
    });

    describe('FromData', () => {
        it('maps the exercise info, best set and target', () => {
            const userInfo = UserExerciseInfo.FromData({
                exerciseInfo: {
                    id: 'info-1',
                    name: 'Row',
                    primaryMuscleGroup: MuscleGroup.Back,
                    secondaryMuscleGroups: [],
                },
                bestSetWeight: 60,
                bestSetReps: 8,
                target: {
                    type: TargetSource.Previous,
                    sets: [{ weight: 50, reps: 10 }],
                },
            });

            expect(userInfo.ExerciseInfo.Name).toBe('Row');
            expect(userInfo.BestSetWeight).toBe(60);
            expect(userInfo.BestSetReps).toBe(8);
            expect(userInfo.Target?.Type).toBe(TargetSource.Previous);
            expect(userInfo.Target?.Sets).toHaveLength(1);
            expect(userInfo.Target?.Sets[0].Reps).toBe(10);
            expect(userInfo.Target?.Sets[0].Weight).toBe(50);
        });

        it('leaves Target undefined when there is no history', () => {
            const userInfo = UserExerciseInfo.FromData({
                exerciseInfo: {
                    id: 'info-1',
                    name: 'Row',
                    primaryMuscleGroup: MuscleGroup.Back,
                    secondaryMuscleGroups: [],
                },
                target: null as unknown as ExerciseTargetData,
            } as any);

            expect(userInfo.Target).toBeUndefined();
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
            expect(data.target).toBeUndefined();
        });
    });
});

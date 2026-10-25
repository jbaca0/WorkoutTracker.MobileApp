import ExerciseInfo from '../Domain/ExerciseInfo';
import { MuscleGroup } from '../Enums/MuscleGroup';

describe('ExerciseInfo', () => {
    describe('constructor', () => {
        it('applies sensible defaults', () => {
            const info = new ExerciseInfo();
            expect(info.Id).toBeUndefined();
            expect(typeof info.Key).toBe('number');
            expect(info.Name).toBe('');
            expect(info.PrimaryMuscleGroup).toBe(MuscleGroup.Other);
            expect(info.SecondaryMuscleGroups).toEqual([]);
        });

        it('keeps provided values', () => {
            const info = new ExerciseInfo({
                Id: 'info-1',
                Name: 'Pull Up',
                PrimaryMuscleGroup: MuscleGroup.Back,
                SecondaryMuscleGroups: [MuscleGroup.Biceps],
            });
            expect(info.Id).toBe('info-1');
            expect(info.Name).toBe('Pull Up');
            expect(info.PrimaryMuscleGroup).toBe(MuscleGroup.Back);
            expect(info.SecondaryMuscleGroups).toEqual([MuscleGroup.Biceps]);
        });

        it('coerces MuscleGroup.None (falsy 0) to Other', () => {
            // Documents current behavior: None is falsy so the || default kicks in
            const info = new ExerciseInfo({ PrimaryMuscleGroup: MuscleGroup.None });
            expect(info.PrimaryMuscleGroup).toBe(MuscleGroup.Other);
        });
    });

    describe('FromData / ToData round trip', () => {
        it('maps the DTO to the domain model', () => {
            const info = ExerciseInfo.FromData({
                id: 'info-1',
                name: 'Overhead Press',
                primaryMuscleGroup: MuscleGroup.Shoulders,
                secondaryMuscleGroups: [MuscleGroup.Triceps, MuscleGroup.Core],
            });

            expect(info.Id).toBe('info-1');
            expect(info.Name).toBe('Overhead Press');
            expect(info.PrimaryMuscleGroup).toBe(MuscleGroup.Shoulders);
            expect(info.SecondaryMuscleGroups).toEqual([MuscleGroup.Triceps, MuscleGroup.Core]);
        });

        it('treats missing secondary muscle groups as an empty array', () => {
            const info = ExerciseInfo.FromData({
                id: 'info-1',
                name: 'Curl',
                primaryMuscleGroup: MuscleGroup.Biceps,
                secondaryMuscleGroups: undefined as unknown as MuscleGroup[],
            });
            expect(info.SecondaryMuscleGroups).toEqual([]);
        });

        it('serializes back to the DTO shape', () => {
            const info = new ExerciseInfo({
                Id: 'info-1',
                Name: 'Dip',
                PrimaryMuscleGroup: MuscleGroup.Triceps,
                SecondaryMuscleGroups: [MuscleGroup.Chest],
            });

            expect(info.ToData()).toEqual({
                id: 'info-1',
                name: 'Dip',
                primaryMuscleGroup: MuscleGroup.Triceps,
                secondaryMuscleGroups: [MuscleGroup.Chest],
            });
        });
    });
});

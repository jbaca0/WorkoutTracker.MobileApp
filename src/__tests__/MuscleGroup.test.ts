import { MuscleGroup, MuscleGroupLabels, AllMuscleGroups } from '../Enums/MuscleGroup';

describe('MuscleGroup', () => {
    it('has a human-readable label for every muscle group', () => {
        for (const group of AllMuscleGroups) {
            expect(typeof MuscleGroupLabels[group]).toBe('string');
            expect(MuscleGroupLabels[group].length).toBeGreaterThan(0);
        }
    });

    it('labels multi-word groups correctly', () => {
        expect(MuscleGroupLabels[MuscleGroup.FullBody]).toBe('Full Body');
    });

    it('AllMuscleGroups contains only numeric enum values', () => {
        expect(AllMuscleGroups.every(v => typeof v === 'number')).toBe(true);
    });

    it('AllMuscleGroups contains every enum member exactly once', () => {
        expect(AllMuscleGroups).toHaveLength(11);
        expect(new Set(AllMuscleGroups).size).toBe(11);
        expect(AllMuscleGroups).toContain(MuscleGroup.None);
        expect(AllMuscleGroups).toContain(MuscleGroup.Other);
    });
});

export enum MuscleGroup {
    None = 0,
    Chest = 1,
    Shoulders = 2,
    Biceps = 3,
    Triceps = 4,
    Forearms = 5,
    Core = 6,
    Legs = 7,
    Back = 8,
    FullBody = 9,
    Other = 10
}

export const MuscleGroupLabels: Record<MuscleGroup, string> = {
    [MuscleGroup.None]: 'None',
    [MuscleGroup.Chest]: 'Chest',
    [MuscleGroup.Shoulders]: 'Shoulders',
    [MuscleGroup.Biceps]: 'Biceps',
    [MuscleGroup.Triceps]: 'Triceps',
    [MuscleGroup.Forearms]: 'Forearms',
    [MuscleGroup.Core]: 'Core',
    [MuscleGroup.Legs]: 'Legs',
    [MuscleGroup.Back]: 'Back',
    [MuscleGroup.FullBody]: 'Full Body',
    [MuscleGroup.Other]: 'Other'
};

export const AllMuscleGroups: MuscleGroup[] = Object.values(MuscleGroup)
    .filter(value => typeof value === 'number') as MuscleGroup[];

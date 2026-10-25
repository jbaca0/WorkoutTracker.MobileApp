import { getTimeOfDay, generateWorkoutTitle } from '../Utilities/WorkoutTitleGenerator';
import Exercise from '../Domain/Exercise';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { MuscleGroup } from '../Enums/MuscleGroup';

function setLocalHour(hour: number) {
    jest.setSystemTime(new Date(2026, 5, 11, hour, 0, 0));
}

function exerciseWith(muscleGroup: MuscleGroup): Exercise {
    return new Exercise({
        ExerciseInfo: new ExerciseInfo({
            Id: `info-${muscleGroup}`,
            Name: 'Some Exercise',
            PrimaryMuscleGroup: muscleGroup,
        }),
    });
}

describe('getTimeOfDay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it.each([
        [5, 'Morning'],
        [11, 'Morning'],
        [12, 'Afternoon'],
        [16, 'Afternoon'],
        [17, 'Evening'],
        [20, 'Evening'],
        [21, 'Night'],
        [23, 'Night'],
        [0, 'Night'],
        [4, 'Night'],
    ])('returns the right label at %i:00 (%s)', (hour, expected) => {
        setLocalHour(hour);
        expect(getTimeOfDay()).toBe(expected);
    });
});

describe('generateWorkoutTitle', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        setLocalHour(8); // Morning
    });
    afterEach(() => jest.useRealTimers());

    it('returns a generic title when there are no exercises', () => {
        expect(generateWorkoutTitle([])).toBe('Morning Workout');
    });

    it('returns a generic title when no exercise has a primary muscle group', () => {
        const exercise = new Exercise({ ExerciseInfoId: 'abc' });
        expect(generateWorkoutTitle([exercise])).toBe('Morning Workout');
    });

    it('uses the muscle group label for a single muscle group', () => {
        expect(generateWorkoutTitle([exerciseWith(MuscleGroup.Chest)])).toBe('Morning Chest Workout');
    });

    it('deduplicates repeated muscle groups', () => {
        const exercises = [exerciseWith(MuscleGroup.Legs), exerciseWith(MuscleGroup.Legs)];
        expect(generateWorkoutTitle(exercises)).toBe('Morning Legs Workout');
    });

    it('joins two muscle groups with an ampersand', () => {
        const exercises = [exerciseWith(MuscleGroup.Chest), exerciseWith(MuscleGroup.Triceps)];
        expect(generateWorkoutTitle(exercises)).toBe('Morning Chest & Triceps Workout');
    });

    it('calls three or more muscle groups a full body workout', () => {
        const exercises = [
            exerciseWith(MuscleGroup.Chest),
            exerciseWith(MuscleGroup.Back),
            exerciseWith(MuscleGroup.Legs),
        ];
        expect(generateWorkoutTitle(exercises)).toBe('Morning Full Body Workout');
    });

    it('reflects the time of day in the title', () => {
        setLocalHour(18); // Evening
        expect(generateWorkoutTitle([exerciseWith(MuscleGroup.Back)])).toBe('Evening Back Workout');
    });
});

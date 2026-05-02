import Exercise from '../Domain/Exercise';
import { MuscleGroup, MuscleGroupLabels } from '../Enums/MuscleGroup';

function getTimeOfDay(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'Morning';
    } else if (hour >= 12 && hour < 17) {
        return 'Afternoon';
    } else if (hour >= 17 && hour < 21) {
        return 'Evening';
    } else {
        return 'Night';
    }
}

function generateWorkoutTitle(exercises: Exercise[]): string {
    const timeOfDay = getTimeOfDay();

    if (exercises.length === 0) {
        return `${timeOfDay} Workout`;
    }

    const uniqueMuscleGroups = new Set<MuscleGroup>();

    for (const exercise of exercises) {
        if (exercise.ExerciseInfo?.PrimaryMuscleGroup) {
            uniqueMuscleGroups.add(exercise.ExerciseInfo.PrimaryMuscleGroup);
        }
    }

    const muscleGroupArray = Array.from(uniqueMuscleGroups);

    if (muscleGroupArray.length === 0) {
        return `${timeOfDay} Workout`;
    }

    if (muscleGroupArray.length >= 3) {
        return `${timeOfDay} Full Body Workout`;
    }

    if (muscleGroupArray.length === 1) {
        const label = MuscleGroupLabels[muscleGroupArray[0]];
        return `${timeOfDay} ${label} Workout`;
    }

    const labels = muscleGroupArray.map(mg => MuscleGroupLabels[mg]);
    return `${timeOfDay} ${labels[0]} & ${labels[1]} Workout`;
}

export { getTimeOfDay, generateWorkoutTitle };

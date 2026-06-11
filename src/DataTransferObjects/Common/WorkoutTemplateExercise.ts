import ExerciseInfo from './ExerciseInfo';

class WorkoutTemplateExercise {
    id!: string;
    exerciseInfoId!: string;
    exerciseInfo?: ExerciseInfo;
    order!: number;
    targetReps!: number;
}

export default WorkoutTemplateExercise;

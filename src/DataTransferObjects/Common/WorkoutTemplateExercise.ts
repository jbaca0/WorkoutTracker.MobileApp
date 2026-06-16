import ExerciseInfo from './ExerciseInfo';
import WorkoutTemplateExerciseSetData from './WorkoutTemplateExerciseSet';

class WorkoutTemplateExercise {
    id!: string;
    exerciseInfoId!: string;
    exerciseInfo?: ExerciseInfo;
    order!: number;
    sets!: WorkoutTemplateExerciseSetData[];
}

export default WorkoutTemplateExercise;

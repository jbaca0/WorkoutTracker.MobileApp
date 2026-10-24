import WorkoutTemplateExercise from './WorkoutTemplateExercise';

class WorkoutTemplate {
    id!: string;
    name!: string;
    exercises: WorkoutTemplateExercise[] = [];
}

export default WorkoutTemplate;

interface WorkoutTemplateExerciseSetRequest {
    reps: number;
}

interface WorkoutTemplateExerciseRequest {
    exerciseInfoId: string;
    sets: WorkoutTemplateExerciseSetRequest[];
}

interface CreateTemplateRequest {
    name: string;
    exercises: WorkoutTemplateExerciseRequest[];
}

export type { WorkoutTemplateExerciseRequest, WorkoutTemplateExerciseSetRequest };
export default CreateTemplateRequest;

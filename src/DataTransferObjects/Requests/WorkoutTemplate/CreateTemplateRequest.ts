interface WorkoutTemplateExerciseRequest {
    exerciseInfoId: string;
    targetReps: number;
}

interface CreateTemplateRequest {
    name: string;
    exercises: WorkoutTemplateExerciseRequest[];
}

export type { WorkoutTemplateExerciseRequest };
export default CreateTemplateRequest;

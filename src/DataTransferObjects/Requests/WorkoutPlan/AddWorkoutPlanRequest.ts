interface WorkoutPlanDayRequest {
    dayOfWeek: number;
    workoutTemplateId?: string;
    note?: string;
}

interface AddWorkoutPlanRequest {
    name: string;
    days: WorkoutPlanDayRequest[];
}

export type { WorkoutPlanDayRequest };
export default AddWorkoutPlanRequest;

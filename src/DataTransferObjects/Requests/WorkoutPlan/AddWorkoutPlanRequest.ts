interface WorkoutPlanDayRequest {
    dayOfWeek: number;
    workoutTemplateId?: string;
    note?: string;
}

interface AddWorkoutPlanRequest {
    name: string;
    startDate: string;
    endDate?: string;
    days: WorkoutPlanDayRequest[];
}

export type { WorkoutPlanDayRequest };
export default AddWorkoutPlanRequest;

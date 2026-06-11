import { WorkoutPlanDayRequest } from './AddWorkoutPlanRequest';

interface UpdateWorkoutPlanRequest {
    planId: string;
    name: string;
    startDate: string;
    endDate?: string;
    days: WorkoutPlanDayRequest[];
}

export default UpdateWorkoutPlanRequest;

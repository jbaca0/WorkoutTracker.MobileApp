import { WorkoutPlanDayRequest } from './AddWorkoutPlanRequest';

interface UpdateWorkoutPlanRequest {
    planId: string;
    name: string;
    days: WorkoutPlanDayRequest[];
}

export default UpdateWorkoutPlanRequest;

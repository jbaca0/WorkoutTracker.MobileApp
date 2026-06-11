import WorkoutPlanDay from './WorkoutPlanDay';

class WorkoutPlan {
    id!: string;
    name!: string;
    isActive!: boolean;
    startDate!: string;
    endDate?: string;
    days: WorkoutPlanDay[] = [];
}

export default WorkoutPlan;

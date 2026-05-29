import WorkoutPlanDay from './WorkoutPlanDay';

class WorkoutPlan {
    id!: string;
    name!: string;
    isActive!: boolean;
    days: WorkoutPlanDay[] = [];
}

export default WorkoutPlan;

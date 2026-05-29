import WorkoutPlanData from '../DataTransferObjects/Common/WorkoutPlan';
import WorkoutPlanDay from './WorkoutPlanDay';

class WorkoutPlan {
    public Id: string;
    public Name: string;
    public IsActive: boolean;
    public Days: WorkoutPlanDay[];

    constructor(data?: Partial<WorkoutPlan>) {
        this.Id = data?.Id || '';
        this.Name = data?.Name || '';
        this.IsActive = data?.IsActive ?? false;
        this.Days = data?.Days || [];
    }

    public static FromData(data: WorkoutPlanData): WorkoutPlan {
        return new WorkoutPlan({
            Id: data.id,
            Name: data.name,
            IsActive: data.isActive,
            Days: data.days.map(WorkoutPlanDay.FromData)
        });
    }

    public ToData(): WorkoutPlanData {
        return {
            id: this.Id,
            name: this.Name,
            isActive: this.IsActive,
            days: this.Days.map(d => d.ToData())
        };
    }
}

export default WorkoutPlan;

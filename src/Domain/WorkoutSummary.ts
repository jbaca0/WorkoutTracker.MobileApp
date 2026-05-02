import WorkoutSummaryData from '../DataTransferObjects/Common/WorkoutSummary';

class WorkoutSummary {
    public Id: string;
    public AddDateTime: Date;
    public ExerciseCount: number;
    public ExerciseNames: string[];

    constructor(data?: Partial<WorkoutSummary>) {
        this.Id = data?.Id || '';
        this.AddDateTime = data?.AddDateTime || new Date();
        this.ExerciseCount = data?.ExerciseCount || 0;
        this.ExerciseNames = data?.ExerciseNames || [];
    }

    public static FromData(data: WorkoutSummaryData): WorkoutSummary {
        return new WorkoutSummary({
            Id: data.id,
            AddDateTime: new Date(data.addDateTime),
            ExerciseCount: data.exerciseCount,
            ExerciseNames: data.exerciseNames
        });
    }
}

export default WorkoutSummary;

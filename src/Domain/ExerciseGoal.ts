import ExerciseGoalData from '../DataTransferObjects/Common/ExerciseGoal';
import ExerciseInfo from './ExerciseInfo';
import KeyGenerator from '../Utilities/KeyGenerator';

class ExerciseGoal {
    public Id: string;
    public Key: number;
    public ExerciseInfo: ExerciseInfo;
    public WorkoutPlanId?: string;
    public StartWeight: number;
    public StartReps: number;
    public TargetWeight: number;
    public TargetReps: number;
    public GoalDate: Date;
    public GoalRecommendation?: { Weight: number; Reps: number };

    constructor(data?: Partial<ExerciseGoal>) {
        this.Id = data?.Id || '';
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.ExerciseInfo = data?.ExerciseInfo || new ExerciseInfo();
        this.WorkoutPlanId = data?.WorkoutPlanId;
        this.StartWeight = data?.StartWeight || 0;
        this.StartReps = data?.StartReps || 0;
        this.TargetWeight = data?.TargetWeight || 0;
        this.TargetReps = data?.TargetReps || 0;
        this.GoalDate = data?.GoalDate || new Date();
        this.GoalRecommendation = data?.GoalRecommendation;
    }

    public static FromData(data: ExerciseGoalData): ExerciseGoal {
        return new ExerciseGoal({
            Id: data.id,
            ExerciseInfo: data.exerciseInfo ? ExerciseInfo.FromData(data.exerciseInfo) : new ExerciseInfo(),
            WorkoutPlanId: data.workoutPlanId,
            StartWeight: data.startWeight,
            StartReps: data.startReps,
            TargetWeight: data.targetWeight,
            TargetReps: data.targetReps,
            GoalDate: new Date(data.goalDate),
            GoalRecommendation: data.goalRecommendation
                ? { Weight: data.goalRecommendation.weight, Reps: data.goalRecommendation.reps }
                : undefined,
        });
    }

    public ToData(): ExerciseGoalData {
        return {
            id: this.Id,
            exerciseInfoId: this.ExerciseInfo.Id!,
            exerciseInfo: this.ExerciseInfo.ToData(),
            workoutPlanId: this.WorkoutPlanId,
            startWeight: this.StartWeight,
            startReps: this.StartReps,
            targetWeight: this.TargetWeight,
            targetReps: this.TargetReps,
            goalDate: this.GoalDate.toISOString(),
            goalRecommendation: this.GoalRecommendation
                ? { weight: this.GoalRecommendation.Weight, reps: this.GoalRecommendation.Reps }
                : undefined,
        };
    }
}

export default ExerciseGoal;

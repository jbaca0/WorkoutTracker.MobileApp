import UserExerciseInfoData from "../DataTransferObjects/Common/UserExerciseInfo";
import Exercise from "./Exercise";
import ExerciseInfo from "./ExerciseInfo";
import KeyGenerator from '../Utilities/KeyGenerator';

class UserExerciseInfo {
    public Id?: string;
    public Key: number;
    public ExerciseInfo!: ExerciseInfo;
    public LatestExercise?: Exercise;
    public BestSetWeight?: number;
    public BestSetReps?: number;
    public GoalRecommendation?: { Weight: number; Reps: number };

    constructor(data?: Partial<UserExerciseInfo>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.ExerciseInfo = data?.ExerciseInfo || new ExerciseInfo();
        this.LatestExercise = data?.LatestExercise || undefined;
        this.BestSetWeight = data?.BestSetWeight;
        this.BestSetReps = data?.BestSetReps;
        this.GoalRecommendation = data?.GoalRecommendation;
    }

    public static FromData(userExerciseInfo: UserExerciseInfoData): UserExerciseInfo {
        return new UserExerciseInfo({
            ExerciseInfo: ExerciseInfo.FromData(userExerciseInfo.exerciseInfo),
            LatestExercise: userExerciseInfo.latestExercise
                ? Exercise.FromData(userExerciseInfo.latestExercise)
                : undefined,
            BestSetWeight: userExerciseInfo.bestSetWeight,
            BestSetReps: userExerciseInfo.bestSetReps,
            GoalRecommendation: userExerciseInfo.goalRecommendation
                ? { Weight: userExerciseInfo.goalRecommendation.weight, Reps: userExerciseInfo.goalRecommendation.reps }
                : undefined,
        })
    }

    public ToData(): UserExerciseInfoData {
        return {
            exerciseInfo: this.ExerciseInfo.ToData(),
            latestExercise: this.LatestExercise?.ToData()!
        };
    }
}
export default UserExerciseInfo;

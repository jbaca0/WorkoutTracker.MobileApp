import UserExerciseInfoData from "../DataTransferObjects/Common/UserExerciseInfo";
import Exercise from "./Exercise";
import ExerciseInfo from "./ExerciseInfo";
import KeyGenerator from '../Utilities/KeyGenerator';

class UserExerciseInfo {
    public Id?: string;
    public Key: number;
    public ExerciseInfo!: ExerciseInfo;
    public LatestExercise?: Exercise;

    constructor(data?: Partial<UserExerciseInfo>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.ExerciseInfo = data?.ExerciseInfo || new ExerciseInfo();
        this.LatestExercise = data?.LatestExercise || undefined;
    }

    public static FromData(userExerciseInfo: UserExerciseInfoData): UserExerciseInfo {
        return new UserExerciseInfo({
            ExerciseInfo: ExerciseInfo.FromData(userExerciseInfo.exerciseInfo),
            LatestExercise: userExerciseInfo.latestExercise
                ? Exercise.FromData(userExerciseInfo.latestExercise)
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

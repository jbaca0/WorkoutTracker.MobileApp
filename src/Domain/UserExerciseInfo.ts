import UserExerciseInfoData from "../DataTransferObjects/Common/UserExerciseInfo";
import ExerciseInfo from "./ExerciseInfo";
import ExerciseTarget from "./ExerciseTarget";
import KeyGenerator from '../Utilities/KeyGenerator';

class UserExerciseInfo {
    public Id?: string;
    public Key: number;
    public ExerciseInfo!: ExerciseInfo;
    public BestSetWeight?: number;
    public BestSetReps?: number;
    public Target?: ExerciseTarget;

    constructor(data?: Partial<UserExerciseInfo>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.ExerciseInfo = data?.ExerciseInfo || new ExerciseInfo();
        this.BestSetWeight = data?.BestSetWeight;
        this.BestSetReps = data?.BestSetReps;
        this.Target = data?.Target;
    }

    public static FromData(userExerciseInfo: UserExerciseInfoData): UserExerciseInfo {
        return new UserExerciseInfo({
            ExerciseInfo: ExerciseInfo.FromData(userExerciseInfo.exerciseInfo),
            BestSetWeight: userExerciseInfo.bestSetWeight,
            BestSetReps: userExerciseInfo.bestSetReps,
            Target: userExerciseInfo.target ? ExerciseTarget.FromData(userExerciseInfo.target) : undefined,
        })
    }

    public ToData(): UserExerciseInfoData {
        return {
            exerciseInfo: this.ExerciseInfo.ToData(),
            target: this.Target?.ToData()
        };
    }
}
export default UserExerciseInfo;

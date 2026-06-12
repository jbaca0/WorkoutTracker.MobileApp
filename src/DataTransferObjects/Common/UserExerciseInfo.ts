import ExerciseInfo from "./ExerciseInfo";
import ExerciseTarget from "./ExerciseTarget";

class UserExerciseInfo {
    public exerciseInfo!: ExerciseInfo;
    public bestSetWeight?: number;
    public bestSetReps?: number;
    public target?: ExerciseTarget;
}
export default UserExerciseInfo;

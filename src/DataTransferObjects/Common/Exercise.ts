import ExerciseInfo from "./ExerciseInfo";
import Set from "./Set";
import ExerciseTarget from "./ExerciseTarget";

class Exercise {
    public exerciseInfoId!: string;
    public exerciseInfo?: ExerciseInfo;
    public sets?: Set[];
    public target?: ExerciseTarget;
}
export default Exercise;

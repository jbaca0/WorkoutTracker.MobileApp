import ExerciseInfo from "./ExerciseInfo";
import Set from "./Set";

class Exercise {
    public exerciseInfoId!: string;
    public exerciseInfo?: ExerciseInfo;
    public sets?: Set[];
    public previousExercise?: Exercise;
}
export default Exercise;

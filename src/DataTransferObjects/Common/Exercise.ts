import ExerciseInfo from "./ExerciseInfo";
import Set from "./Set";
import GoalRecommendation from "./GoalRecommendation";

class Exercise {
    public exerciseInfoId!: string;
    public exerciseInfo?: ExerciseInfo;
    public sets?: Set[];
    public previousExercise?: Exercise;
    public goalRecommendation?: GoalRecommendation;
}
export default Exercise;

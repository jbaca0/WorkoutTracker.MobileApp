import Exercise from "./Exercise";
import ExerciseInfo from "./ExerciseInfo";
import GoalRecommendation from "./GoalRecommendation";

class UserExerciseInfo {
    public exerciseInfo!: ExerciseInfo;
    public latestExercise!: Exercise;
    public bestSetWeight?: number;
    public bestSetReps?: number;
    public goalRecommendation?: GoalRecommendation;
}
export default UserExerciseInfo;

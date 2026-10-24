import ExerciseInfo from './ExerciseInfo';
import GoalRecommendation from './GoalRecommendation';

class ExerciseGoal {
    public id!: string;
    public exerciseInfoId!: string;
    public exerciseInfo?: ExerciseInfo;
    public workoutPlanId?: string;
    public startWeight!: number;
    public startReps!: number;
    public targetWeight!: number;
    public targetReps!: number;
    public goalDate!: string;
    public goalRecommendation?: GoalRecommendation;
}
export default ExerciseGoal;

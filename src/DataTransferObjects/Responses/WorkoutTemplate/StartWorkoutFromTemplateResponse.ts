import UserExerciseInfo from '../../Common/UserExerciseInfo';

interface StartWorkoutFromTemplateResponse {
    workoutId: string;
    userExerciseInfos: UserExerciseInfo[];
}

export default StartWorkoutFromTemplateResponse;

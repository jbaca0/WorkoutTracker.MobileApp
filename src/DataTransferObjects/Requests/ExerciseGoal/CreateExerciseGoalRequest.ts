interface CreateExerciseGoalRequest {
    exerciseInfoId: string;
    workoutPlanId: string;
    startWeight?: number;
    startReps?: number;
    targetWeight: number;
    targetReps: number;
    goalDate: string;
}

export default CreateExerciseGoalRequest;

import AddExercisesResponse from "../DataTransferObjects/Responses/AddExercisesResponse";
import AddExercisesRequest from "../DataTransferObjects/Requests/AddExercisesRequest";
import { BaseService } from "./BaseService";
import UserExerciseInfo from "../Domain/UserExerciseInfo";
import Exercise from "../Domain/Exercise";
import Set from "../Domain/Set";
import Workout from "../Domain/Workout";
import WorkoutSummary from "../Domain/WorkoutSummary";
import SaveRequest from "../DataTransferObjects/Requests/Workout/SaveRequest";
import SaveResponse from "../DataTransferObjects/Responses/Workout/SaveResponse";
import GetWorkoutHistoryResponse from "../DataTransferObjects/Responses/Workout/GetWorkoutHistoryResponse";
import GetWorkoutDetailResponse from "../DataTransferObjects/Responses/Workout/GetWorkoutDetailResponse";

export class WorkoutService extends BaseService {
    public static async addWorkout(): Promise<string> {
        const response = await this.fetchFromServer<string>('/addWorkout', {});
        return response;
    }

    public static async addExercises(workoutId: string, exerciseInfoIds: string[]): Promise<Exercise[]> {
        const request: AddExercisesRequest = {
            workoutId,
            exerciseInfoIds
        };
        const response: AddExercisesResponse = await this.fetchFromServer<AddExercisesResponse>('/addExercises', request);
        return response.userExerciseInfos
            .map(e => UserExerciseInfo.FromData(e))
            .map(e => new Exercise({
                ExerciseInfo: e.ExerciseInfo,
                Sets: e.Target?.Sets.map((_, i) => new Set({ Order: i + 1 })) ?? [],
                Target: e.Target
            }));
    }

    public static async save(workout: Workout) {
        const request: SaveRequest = {
            workoutId: workout.Id,
            workout: workout.ToData()
        }
        await this.fetchFromServer<SaveResponse>('/save', request);
    }

    public static async getWorkoutHistory(): Promise<WorkoutSummary[]> {
        const response = await this.fetchFromServer<GetWorkoutHistoryResponse>('/getWorkoutHistory');
        return response.workouts.map(w => WorkoutSummary.FromData(w));
    }

    public static async getWorkoutDetail(workoutId: string): Promise<Workout> {
        const response = await this.fetchFromServer<GetWorkoutDetailResponse>(`/getWorkoutDetail/${workoutId}`);
        return Workout.FromData(response.workout);
    }

    public static async cancelWorkout(workoutId: string): Promise<void> {
        await this.fetchFromServer<void>(`/cancelWorkout/${workoutId}`, undefined, 'DELETE');
    }
}

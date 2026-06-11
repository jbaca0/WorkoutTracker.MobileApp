import ExerciseGoal from '../Domain/ExerciseGoal';
import ExerciseGoalData from '../DataTransferObjects/Common/ExerciseGoal';
import CreateExerciseGoalRequest from '../DataTransferObjects/Requests/ExerciseGoal/CreateExerciseGoalRequest';
import UpdateExerciseGoalRequest from '../DataTransferObjects/Requests/ExerciseGoal/UpdateExerciseGoalRequest';
import GetExerciseGoalsResponse from '../DataTransferObjects/Responses/ExerciseGoal/GetExerciseGoalsResponse';
import { BaseService } from './BaseService';

export class ExerciseGoalService extends BaseService {
    public static async getGoals(): Promise<ExerciseGoal[]> {
        const response = await this.fetchFromServer<GetExerciseGoalsResponse>('/exerciseGoals');
        return response.goals.map(ExerciseGoal.FromData);
    }

    public static async createGoal(request: CreateExerciseGoalRequest): Promise<ExerciseGoal> {
        const response = await this.fetchFromServer<ExerciseGoalData>('/exerciseGoals', request);
        return ExerciseGoal.FromData(response);
    }

    public static async updateGoal(id: string, request: UpdateExerciseGoalRequest): Promise<void> {
        await this.fetchFromServer<void>(`/exerciseGoals/${id}`, request, 'PUT');
    }

    public static async deleteGoal(id: string): Promise<void> {
        await this.fetchFromServer<void>(`/exerciseGoals/${id}`, undefined, 'DELETE');
    }
}

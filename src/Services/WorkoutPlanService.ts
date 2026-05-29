import WorkoutPlan from '../Domain/WorkoutPlan';
import { WorkoutPlanDayRequest } from '../DataTransferObjects/Requests/WorkoutPlan/AddWorkoutPlanRequest';
import GetWorkoutPlansResponse from '../DataTransferObjects/Responses/WorkoutPlan/GetWorkoutPlansResponse';
import GetTodaysWorkoutResponse from '../DataTransferObjects/Responses/WorkoutPlan/GetTodaysWorkoutResponse';
import { BaseService } from './BaseService';

export class WorkoutPlanService extends BaseService {
    public static async getWorkoutPlans(): Promise<WorkoutPlan[]> {
        const response = await this.fetchFromServer<GetWorkoutPlansResponse>('/getWorkoutPlans');
        return response.plans.map(WorkoutPlan.FromData);
    }

    public static async addWorkoutPlan(name: string, days: WorkoutPlanDayRequest[]): Promise<string> {
        return await this.fetchFromServer<string>('/addWorkoutPlan', { name, days });
    }

    public static async updateWorkoutPlan(planId: string, name: string, days: WorkoutPlanDayRequest[]): Promise<void> {
        await this.fetchFromServer<void>('/updateWorkoutPlan', { planId, name, days }, 'PUT');
    }

    public static async deleteWorkoutPlan(planId: string): Promise<void> {
        await this.fetchFromServer<void>(`/deleteWorkoutPlan/${planId}`, undefined, 'DELETE');
    }

    public static async activateWorkoutPlan(planId: string): Promise<void> {
        await this.fetchFromServer<void>(`/activateWorkoutPlan/${planId}`, undefined, 'PUT');
    }

    public static async getTodaysWorkout(): Promise<GetTodaysWorkoutResponse | null> {
        try {
            return await this.fetchFromServer<GetTodaysWorkoutResponse>('/getTodaysWorkout');
        } catch {
            return null;
        }
    }
}

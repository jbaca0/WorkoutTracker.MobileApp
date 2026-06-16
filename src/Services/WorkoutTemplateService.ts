import WorkoutTemplate from '../Domain/WorkoutTemplate';
import Exercise from '../Domain/Exercise';
import Set from '../Domain/Set';
import UserExerciseInfo from '../Domain/UserExerciseInfo';
import CreateTemplateRequest, { WorkoutTemplateExerciseRequest } from '../DataTransferObjects/Requests/WorkoutTemplate/CreateTemplateRequest';
import UpdateTemplateRequest from '../DataTransferObjects/Requests/WorkoutTemplate/UpdateTemplateRequest';
import GetTemplatesResponse from '../DataTransferObjects/Responses/WorkoutTemplate/GetTemplatesResponse';
import StartWorkoutFromTemplateResponse from '../DataTransferObjects/Responses/WorkoutTemplate/StartWorkoutFromTemplateResponse';
import { BaseService } from './BaseService';

export interface StartTemplateResult {
    workoutId: string;
    exercises: Exercise[];
}

export class WorkoutTemplateService extends BaseService {
    public static async getTemplates(): Promise<WorkoutTemplate[]> {
        const response = await this.fetchFromServer<GetTemplatesResponse>('/getTemplates');
        return response.templates.map(WorkoutTemplate.FromData);
    }

    public static async addTemplate(name: string, exercises: WorkoutTemplateExerciseRequest[]): Promise<string> {
        const request: CreateTemplateRequest = { name, exercises };
        return await this.fetchFromServer<string>('/addTemplate', request);
    }

    public static async updateTemplate(templateId: string, name: string, exercises: WorkoutTemplateExerciseRequest[]): Promise<void> {
        const request: UpdateTemplateRequest = { templateId, name, exercises };
        await this.fetchFromServer<void>('/updateTemplate', request, 'PUT');
    }

    public static async deleteTemplate(templateId: string): Promise<void> {
        await this.fetchFromServer<void>(`/deleteTemplate/${templateId}`, undefined, 'DELETE');
    }

    public static async startWorkoutFromTemplate(templateId: string): Promise<StartTemplateResult> {
        const response = await this.fetchFromServer<StartWorkoutFromTemplateResponse>(
            '/startWorkoutFromTemplate',
            { templateId }
        );

        const exercises = response.userExerciseInfos
            .map(e => UserExerciseInfo.FromData(e))
            .map(e => new Exercise({
                ExerciseInfo: e.ExerciseInfo,
                Sets: e.Target?.Sets.map((s, i) => new Set({
                    Reps: s.Reps,
                    Weight: s.Weight,
                    Order: i
                })) ?? [],
                Target: e.Target
            }));

        return { workoutId: response.workoutId, exercises };
    }
}

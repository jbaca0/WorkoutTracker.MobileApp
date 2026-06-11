import { WorkoutTemplateExerciseRequest } from './CreateTemplateRequest';

interface UpdateTemplateRequest {
    templateId: string;
    name: string;
    exercises: WorkoutTemplateExerciseRequest[];
}

export default UpdateTemplateRequest;

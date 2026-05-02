import { BaseService } from "./BaseService";
import ExerciseInfo from "../Domain/ExerciseInfo";
import GetExerciseInfosResponse from "../DataTransferObjects/Responses/GetExerciseInfoResponse";
import AddExerciseInfoResponse from "../DataTransferObjects/Responses/AddExerciseInfoResponse";
import { MuscleGroup } from "../Enums/MuscleGroup";

export class ExerciseInfoService extends BaseService {
    public static async addExerciseInfo(
        exerciseName: string,
        primaryMuscleGroup: MuscleGroup,
        secondaryMuscleGroups: MuscleGroup[]
    ): Promise<string> {
        await this.fetchFromServer<AddExerciseInfoResponse>('/addExerciseInfo', {
            name: exerciseName,
            primaryMuscleGroup: primaryMuscleGroup,
            secondaryMuscleGroups: secondaryMuscleGroups
        });
        return '';
    }

    public static async getExerciseInfos(): Promise<ExerciseInfo[]> {
        const response = await this.fetchFromServer<GetExerciseInfosResponse>('/getExerciseInfos');
        const result = response.exerciseInfos.map(exerciseInfoData => ExerciseInfo.FromData(exerciseInfoData));
        return result;
    }
}

import ExerciseInfoData from "../DataTransferObjects/Common/ExerciseInfo";
import { MuscleGroup } from '../Enums/MuscleGroup';
import KeyGenerator from '../Utilities/KeyGenerator';

class ExerciseInfo {
    public Id?: string;
    public Key: number;
    public Name: string = '';
    public PrimaryMuscleGroup: MuscleGroup = MuscleGroup.Other;
    public SecondaryMuscleGroups: MuscleGroup[] = [];

    constructor(data?: Partial<ExerciseInfo>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.Name = data?.Name || '';
        this.PrimaryMuscleGroup = data?.PrimaryMuscleGroup || MuscleGroup.Other;
        this.SecondaryMuscleGroups = data?.SecondaryMuscleGroups || [];
    }

    public static FromData(data: ExerciseInfoData): ExerciseInfo {
        return new ExerciseInfo({
            Id: data.id,
            Name: data.name,
            PrimaryMuscleGroup: data.primaryMuscleGroup,
            SecondaryMuscleGroups: (data.secondaryMuscleGroups || []).map(m => m as MuscleGroup)
        });
    }

    public ToData(): ExerciseInfoData {
        return {
            id: this.Id!,
            name: this.Name,
            primaryMuscleGroup: this.PrimaryMuscleGroup,
            secondaryMuscleGroups: this.SecondaryMuscleGroups
        };
    }
}

export default ExerciseInfo;

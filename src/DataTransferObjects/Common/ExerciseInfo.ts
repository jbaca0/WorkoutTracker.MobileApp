import { MuscleGroup } from "../../Enums/MuscleGroup";

class ExerciseInfo {
    public name: string = '';
    id!: string;
    primaryMuscleGroup: MuscleGroup = MuscleGroup.None;
    secondaryMuscleGroups: MuscleGroup[] = [];
}

export default ExerciseInfo;

import ExerciseTargetData from '../DataTransferObjects/Common/ExerciseTarget';
import { TargetSource } from '../Enums/TargetSource';

interface TargetSet {
    Weight: number;
    Reps: number;
}

class ExerciseTarget {
    public Type: TargetSource;
    public Sets: TargetSet[];

    constructor(data?: Partial<ExerciseTarget>) {
        this.Type = data?.Type ?? TargetSource.Previous;
        this.Sets = data?.Sets || [];
    }

    public static FromData(data: ExerciseTargetData): ExerciseTarget {
        return new ExerciseTarget({
            Type: data.type,
            Sets: data.sets?.map(s => ({ Weight: s.weight, Reps: s.reps })) ?? []
        });
    }

    public ToData(): ExerciseTargetData {
        return {
            type: this.Type,
            sets: this.Sets.map(s => ({ weight: s.Weight, reps: s.Reps }))
        };
    }
}
export default ExerciseTarget;

import ExerciseInfo from './ExerciseInfo';
import Set from './Set';
import ExerciseData from '../DataTransferObjects/Common/Exercise';
import ExerciseTarget from './ExerciseTarget';
import KeyGenerator from '../Utilities/KeyGenerator';

class Exercise {

    public Id?: string;
    public Key: number;
    public ExerciseInfoId: string;
    public ExerciseInfo?: ExerciseInfo;
    public Sets: Set[];
    public Target?: ExerciseTarget;

    constructor(data?: Partial<Exercise>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.ExerciseInfo = data?.ExerciseInfo;
        this.Sets = data?.Sets || [];
        this.Target = data?.Target;

        const id = data?.ExerciseInfoId || data?.ExerciseInfo?.Id;
        if (!id) throw new Error("Unable to resolve ExerciseInfoId when constructing Exercise");
        this.ExerciseInfoId = id;
    }

    public static FromData(exerciseData: ExerciseData) {
        return new Exercise({
            ExerciseInfoId: exerciseData.exerciseInfoId,
            ExerciseInfo: exerciseData.exerciseInfo && ExerciseInfo.FromData(exerciseData.exerciseInfo),
            Sets: exerciseData.sets
                ?.slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map(s => new Set({ Reps: s.reps, Weight: s.weight, Order: s.order })) ?? [],
            Target: exerciseData.target ? ExerciseTarget.FromData(exerciseData.target) : undefined
        })
    }

    public ToData(): ExerciseData {
        return {
            exerciseInfoId: this.ExerciseInfoId,
            exerciseInfo: this.ExerciseInfo?.ToData(),
            sets: this.Sets.map(set => ({
                id: set.Id,
                reps: set.Reps,
                weight: set.Weight,
                completed: set.Completed
            })),
            target: this.Target?.ToData()
        };
    }
}

export default Exercise;

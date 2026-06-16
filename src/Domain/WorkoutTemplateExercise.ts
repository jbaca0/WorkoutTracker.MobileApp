import WorkoutTemplateExerciseData from '../DataTransferObjects/Common/WorkoutTemplateExercise';
import ExerciseInfo from './ExerciseInfo';

interface TemplateSet {
    Reps: number;
}

class WorkoutTemplateExercise {
    public Id: string;
    public ExerciseInfoId: string;
    public ExerciseInfo?: ExerciseInfo;
    public Order: number;
    public Sets: TemplateSet[];

    constructor(data?: Partial<WorkoutTemplateExercise>) {
        this.Id = data?.Id || '';
        this.ExerciseInfoId = data?.ExerciseInfoId || '';
        this.ExerciseInfo = data?.ExerciseInfo;
        this.Order = data?.Order || 0;
        this.Sets = data?.Sets || [];
    }

    public static FromData(data: WorkoutTemplateExerciseData): WorkoutTemplateExercise {
        return new WorkoutTemplateExercise({
            Id: data.id,
            ExerciseInfoId: data.exerciseInfoId,
            ExerciseInfo: data.exerciseInfo ? ExerciseInfo.FromData(data.exerciseInfo) : undefined,
            Order: data.order,
            Sets: (data.sets ?? []).map(s => ({ Reps: s.reps })),
        });
    }

    public ToData(): WorkoutTemplateExerciseData {
        return {
            id: this.Id,
            exerciseInfoId: this.ExerciseInfoId,
            exerciseInfo: this.ExerciseInfo?.ToData(),
            order: this.Order,
            sets: this.Sets.map((s, i) => ({ id: '', order: i, reps: s.Reps })),
        };
    }
}

export default WorkoutTemplateExercise;

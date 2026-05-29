import WorkoutTemplateExerciseData from '../DataTransferObjects/Common/WorkoutTemplateExercise';
import ExerciseInfo from './ExerciseInfo';

class WorkoutTemplateExercise {
    public Id: string;
    public ExerciseInfoId: string;
    public ExerciseInfo?: ExerciseInfo;
    public Order: number;

    constructor(data?: Partial<WorkoutTemplateExercise>) {
        this.Id = data?.Id || '';
        this.ExerciseInfoId = data?.ExerciseInfoId || '';
        this.ExerciseInfo = data?.ExerciseInfo;
        this.Order = data?.Order || 0;
    }

    public static FromData(data: WorkoutTemplateExerciseData): WorkoutTemplateExercise {
        return new WorkoutTemplateExercise({
            Id: data.id,
            ExerciseInfoId: data.exerciseInfoId,
            ExerciseInfo: data.exerciseInfo ? ExerciseInfo.FromData(data.exerciseInfo) : undefined,
            Order: data.order
        });
    }

    public ToData(): WorkoutTemplateExerciseData {
        return {
            id: this.Id,
            exerciseInfoId: this.ExerciseInfoId,
            exerciseInfo: this.ExerciseInfo?.ToData(),
            order: this.Order
        };
    }
}

export default WorkoutTemplateExercise;

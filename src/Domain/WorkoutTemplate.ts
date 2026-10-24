import WorkoutTemplateData from '../DataTransferObjects/Common/WorkoutTemplate';
import WorkoutTemplateExercise from './WorkoutTemplateExercise';

class WorkoutTemplate {
    public Id: string;
    public Name: string;
    public Exercises: WorkoutTemplateExercise[];

    constructor(data?: Partial<WorkoutTemplate>) {
        this.Id = data?.Id || '';
        this.Name = data?.Name || '';
        this.Exercises = data?.Exercises || [];
    }

    public static FromData(data: WorkoutTemplateData): WorkoutTemplate {
        return new WorkoutTemplate({
            Id: data.id,
            Name: data.name,
            Exercises: data.exercises.map(WorkoutTemplateExercise.FromData)
        });
    }

    public ToData(): WorkoutTemplateData {
        return {
            id: this.Id,
            name: this.Name,
            exercises: this.Exercises.map(e => e.ToData())
        };
    }
}

export default WorkoutTemplate;

import WorkoutPlanDayData from '../DataTransferObjects/Common/WorkoutPlanDay';

class WorkoutPlanDay {
    public Id: string;
    public DayOfWeek: number;
    public WorkoutTemplateId?: string;
    public TemplateName?: string;
    public Note?: string;

    constructor(data?: Partial<WorkoutPlanDay>) {
        this.Id = data?.Id || '';
        this.DayOfWeek = data?.DayOfWeek ?? 0;
        this.WorkoutTemplateId = data?.WorkoutTemplateId;
        this.TemplateName = data?.TemplateName;
        this.Note = data?.Note;
    }

    public static FromData(data: WorkoutPlanDayData): WorkoutPlanDay {
        return new WorkoutPlanDay({
            Id: data.id,
            DayOfWeek: data.dayOfWeek,
            WorkoutTemplateId: data.workoutTemplateId,
            TemplateName: data.templateName,
            Note: data.note
        });
    }

    public ToData(): WorkoutPlanDayData {
        return {
            id: this.Id,
            dayOfWeek: this.DayOfWeek,
            workoutTemplateId: this.WorkoutTemplateId,
            templateName: this.TemplateName,
            note: this.Note
        };
    }
}

export default WorkoutPlanDay;

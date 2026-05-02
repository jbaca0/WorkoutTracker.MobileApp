import Exercise from "./Exercise";
import ExerciseInfo from "./ExerciseInfo";
import Set from "./Set";
import WorkoutData from "../DataTransferObjects/Common/Workout";

class Workout {
    public Id?: string
    public AddDateTime?: Date;
    public Exercises: Exercise[];

    constructor(data?: Partial<Workout>) {
        this.Id = data?.Id;
        this.AddDateTime = data?.AddDateTime;
        this.Exercises = data?.Exercises || [];
    }

    public static FromData(data: WorkoutData): Workout {
        return new Workout({
            Id: data.id,
            AddDateTime: data.addDateTime ? new Date(data.addDateTime) : undefined,
            Exercises: data.exercises?.map(e => new Exercise({
                ExerciseInfoId: e.exerciseInfoId,
                ExerciseInfo: e.exerciseInfo ? new ExerciseInfo({
                    Id: e.exerciseInfo.id,
                    Name: e.exerciseInfo.name
                }) : undefined,
                PreviousExercise: e.previousExercise ? new Exercise({
                    ExerciseInfoId: e.previousExercise.exerciseInfoId,
                    Sets: e.previousExercise.sets?.map(s => new Set({
                        Reps: s.reps,
                        Weight: s.weight
                    })) || []
                }) : undefined,
                Sets: e.sets?.map(s => new Set({
                    Id: s.id,
                    Reps: s.reps,
                    Weight: s.weight,
                    Completed: s.completed
                })) || []
            })) || []
        });
    }

    public ToData(): WorkoutData {
        return {
            id: this.Id!,
            exercises: this.Exercises.map(exercise => exercise.ToData())
        };
    }
}
export default Workout;

import WorkoutTemplateData from '../../Common/WorkoutTemplate';

interface GetTodaysWorkoutResponse {
    template?: WorkoutTemplateData;
    note?: string;
}

export default GetTodaysWorkoutResponse;

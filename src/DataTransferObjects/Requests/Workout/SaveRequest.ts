import Workout from "../../Common/Workout";

interface SaveRequest {
    workoutId?: string;
    workout: Workout
}
export default SaveRequest;

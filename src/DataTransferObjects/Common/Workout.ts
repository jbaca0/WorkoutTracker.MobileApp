import Exercise from "./Exercise";

class Workout {
    public id!: string;
    public exercises?: Exercise[];
    public addDateTime?: Date;
}
export default Workout;

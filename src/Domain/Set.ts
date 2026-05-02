import KeyGenerator from '../Utilities/KeyGenerator';
import SetData from '../DataTransferObjects/Common/Set';

class Set {
    public Id?: string;
    public Key: number;
    public Reps?: number;
    public Weight?: number;
    public Completed: boolean;

    constructor(data?: Partial<Set>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.Reps = data?.Reps;
        this.Weight = data?.Weight;
        this.Completed = data?.Completed || false;
    }

    public ToData(): SetData {
        return {
            id: this.Id,
            reps: this.Reps,
            weight: this.Weight,
            completed: this.Completed
        };
    }
}

export default Set;

import KeyGenerator from '../Utilities/KeyGenerator';
import SetData from '../DataTransferObjects/Common/Set';

class Set {
    public Id?: string;
    public Key: number;
    public Reps?: number;
    public Weight?: number;
    public Completed: boolean;
    public Order?: number;

    constructor(data?: Partial<Set>) {
        this.Id = data?.Id;
        this.Key = data?.Key || KeyGenerator.GenerateKey();
        this.Reps = data?.Reps;
        this.Weight = data?.Weight;
        this.Completed = data?.Completed || false;
        this.Order = data?.Order;
    }

    public ToData(): SetData {
        return {
            id: this.Id,
            reps: this.Reps,
            weight: this.Weight,
            completed: this.Completed,
            order: this.Order
        };
    }
}

export default Set;

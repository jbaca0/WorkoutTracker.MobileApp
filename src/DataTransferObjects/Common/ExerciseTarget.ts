import TargetSet from './TargetSet';
import { TargetSource } from '../../Enums/TargetSource';

class ExerciseTarget {
    public type!: TargetSource;
    public sets!: TargetSet[];
}
export default ExerciseTarget;

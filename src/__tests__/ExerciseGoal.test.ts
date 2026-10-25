import ExerciseGoal from '../Domain/ExerciseGoal';
import ExerciseInfo from '../Domain/ExerciseInfo';
import { MuscleGroup } from '../Enums/MuscleGroup';

const exerciseInfoData = {
    id: 'info-1',
    name: 'Bench Press',
    primaryMuscleGroup: MuscleGroup.Chest,
    secondaryMuscleGroups: [MuscleGroup.Triceps],
};

const goalData = {
    id: 'goal-1',
    exerciseInfoId: 'info-1',
    exerciseInfo: exerciseInfoData,
    workoutPlanId: 'plan-1',
    startWeight: 100,
    startReps: 5,
    targetWeight: 140,
    targetReps: 5,
    goalDate: '2026-06-01T00:00:00.000Z',
    goalRecommendation: { weight: 115, reps: 5 },
};

describe('ExerciseGoal', () => {
    describe('constructor', () => {
        it('defaults to a fresh ExerciseInfo, zeroed numbers and no recommendation', () => {
            const goal = new ExerciseGoal();
            expect(goal.Id).toBe('');
            expect(goal.ExerciseInfo).toBeInstanceOf(ExerciseInfo);
            expect(goal.WorkoutPlanId).toBeUndefined();
            expect(goal.StartWeight).toBe(0);
            expect(goal.StartReps).toBe(0);
            expect(goal.TargetWeight).toBe(0);
            expect(goal.TargetReps).toBe(0);
            expect(goal.GoalDate).toBeInstanceOf(Date);
            expect(goal.GoalRecommendation).toBeUndefined();
        });

        it('generates a key when none is supplied', () => {
            expect(new ExerciseGoal().Key).toEqual(expect.any(Number));
        });

        it('keeps a supplied key', () => {
            expect(new ExerciseGoal({ Key: 42 }).Key).toBe(42);
        });
    });

    describe('FromData', () => {
        it('maps every field and parses the goal date', () => {
            const goal = ExerciseGoal.FromData(goalData);

            expect(goal.Id).toBe('goal-1');
            expect(goal.ExerciseInfo.Name).toBe('Bench Press');
            expect(goal.ExerciseInfo.PrimaryMuscleGroup).toBe(MuscleGroup.Chest);
            expect(goal.WorkoutPlanId).toBe('plan-1');
            expect(goal.StartWeight).toBe(100);
            expect(goal.StartReps).toBe(5);
            expect(goal.TargetWeight).toBe(140);
            expect(goal.TargetReps).toBe(5);
            expect(goal.GoalDate).toEqual(new Date('2026-06-01T00:00:00.000Z'));
        });

        it('maps the recommendation into the domain shape', () => {
            const goal = ExerciseGoal.FromData(goalData);
            expect(goal.GoalRecommendation).toEqual({ Weight: 115, Reps: 5 });
        });

        it('leaves the recommendation undefined when the server sends none', () => {
            const goal = ExerciseGoal.FromData({ ...goalData, goalRecommendation: undefined });
            expect(goal.GoalRecommendation).toBeUndefined();
        });

        it('falls back to an empty ExerciseInfo when the DTO has none', () => {
            const goal = ExerciseGoal.FromData({ ...goalData, exerciseInfo: undefined });

            expect(goal.ExerciseInfo).toBeInstanceOf(ExerciseInfo);
            expect(goal.ExerciseInfo.Name).toBe('');
        });

        it('leaves WorkoutPlanId undefined for an unassigned goal', () => {
            const goal = ExerciseGoal.FromData({ ...goalData, workoutPlanId: undefined });
            expect(goal.WorkoutPlanId).toBeUndefined();
        });
    });

    describe('ToData', () => {
        it('serializes the goal date to an ISO string', () => {
            const goal = new ExerciseGoal({
                Id: 'goal-1',
                ExerciseInfo: new ExerciseInfo({ Id: 'info-1', Name: 'Bench Press' }),
                GoalDate: new Date('2026-06-01T00:00:00.000Z'),
            });

            expect(goal.ToData().goalDate).toBe('2026-06-01T00:00:00.000Z');
        });

        it('takes exerciseInfoId from the nested exercise info', () => {
            const goal = new ExerciseGoal({
                ExerciseInfo: new ExerciseInfo({ Id: 'info-9', Name: 'Row' }),
            });

            expect(goal.ToData().exerciseInfoId).toBe('info-9');
        });

        it('serializes the recommendation back to the DTO shape', () => {
            const goal = new ExerciseGoal({
                ExerciseInfo: new ExerciseInfo({ Id: 'info-1' }),
                GoalRecommendation: { Weight: 115, Reps: 5 },
            });

            expect(goal.ToData().goalRecommendation).toEqual({ weight: 115, reps: 5 });
        });

        it('omits the recommendation when there is none', () => {
            const goal = new ExerciseGoal({ ExerciseInfo: new ExerciseInfo({ Id: 'info-1' }) });
            expect(goal.ToData().goalRecommendation).toBeUndefined();
        });

        it('round-trips a goal through FromData and ToData', () => {
            const data = ExerciseGoal.FromData(goalData).ToData();

            expect(data.id).toBe(goalData.id);
            expect(data.exerciseInfoId).toBe(goalData.exerciseInfoId);
            expect(data.workoutPlanId).toBe(goalData.workoutPlanId);
            expect(data.startWeight).toBe(goalData.startWeight);
            expect(data.targetWeight).toBe(goalData.targetWeight);
            expect(data.goalDate).toBe(goalData.goalDate);
            expect(data.goalRecommendation).toEqual(goalData.goalRecommendation);
        });
    });
});

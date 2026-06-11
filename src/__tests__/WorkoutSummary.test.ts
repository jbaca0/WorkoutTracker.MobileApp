import WorkoutSummary from '../Domain/WorkoutSummary';

describe('WorkoutSummary', () => {
    describe('constructor', () => {
        it('applies defaults when no data is provided', () => {
            const summary = new WorkoutSummary();
            expect(summary.Id).toBe('');
            expect(summary.AddDateTime).toBeInstanceOf(Date);
            expect(summary.ExerciseCount).toBe(0);
            expect(summary.ExerciseNames).toEqual([]);
        });
    });

    describe('FromData', () => {
        it('maps the DTO and parses the date string', () => {
            const summary = WorkoutSummary.FromData({
                id: 'w-1',
                addDateTime: '2026-06-09T18:45:00Z',
                exerciseCount: 4,
                exerciseNames: ['Squat', 'Lunge', 'Leg Press', 'Calf Raise'],
            });

            expect(summary.Id).toBe('w-1');
            expect(summary.AddDateTime).toEqual(new Date('2026-06-09T18:45:00Z'));
            expect(summary.ExerciseCount).toBe(4);
            expect(summary.ExerciseNames).toEqual(['Squat', 'Lunge', 'Leg Press', 'Calf Raise']);
        });
    });
});

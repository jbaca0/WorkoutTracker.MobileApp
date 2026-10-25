import WorkoutPlan from '../Domain/WorkoutPlan';
import WorkoutPlanDay from '../Domain/WorkoutPlanDay';

describe('WorkoutPlan', () => {
    describe('constructor', () => {
        it('defaults to an inactive plan starting now with no days', () => {
            const plan = new WorkoutPlan();
            expect(plan.Id).toBe('');
            expect(plan.Name).toBe('');
            expect(plan.IsActive).toBe(false);
            expect(plan.StartDate).toBeInstanceOf(Date);
            expect(plan.EndDate).toBeUndefined();
            expect(plan.Days).toEqual([]);
        });

        it('keeps an explicit false for IsActive rather than defaulting it', () => {
            const plan = new WorkoutPlan({ IsActive: false });
            expect(plan.IsActive).toBe(false);
        });
    });

    describe('FromData', () => {
        it('maps the plan and parses its dates', () => {
            const plan = WorkoutPlan.FromData({
                id: 'plan-1',
                name: 'Spring block',
                isActive: true,
                startDate: '2026-04-01T00:00:00Z',
                endDate: '2026-06-01T00:00:00Z',
                days: [
                    { id: 'day-1', dayOfWeek: 1, workoutTemplateId: 'template-1', templateName: 'Push', note: 'Heavy' },
                ],
            });

            expect(plan.Id).toBe('plan-1');
            expect(plan.Name).toBe('Spring block');
            expect(plan.IsActive).toBe(true);
            expect(plan.StartDate).toEqual(new Date('2026-04-01T00:00:00Z'));
            expect(plan.EndDate).toEqual(new Date('2026-06-01T00:00:00Z'));
            expect(plan.Days[0]).toBeInstanceOf(WorkoutPlanDay);
            expect(plan.Days[0].TemplateName).toBe('Push');
        });

        it('leaves EndDate undefined for an open-ended plan', () => {
            const plan = WorkoutPlan.FromData({
                id: 'plan-1',
                name: 'Open ended',
                isActive: false,
                startDate: '2026-04-01T00:00:00Z',
                days: [],
            });

            expect(plan.EndDate).toBeUndefined();
        });
    });

    describe('ToData', () => {
        it('serializes dates back to ISO strings', () => {
            const plan = new WorkoutPlan({
                Id: 'plan-1',
                Name: 'Spring block',
                IsActive: true,
                StartDate: new Date('2026-04-01T00:00:00Z'),
                EndDate: new Date('2026-06-01T00:00:00Z'),
            });

            const data = plan.ToData();

            expect(data.startDate).toBe('2026-04-01T00:00:00.000Z');
            expect(data.endDate).toBe('2026-06-01T00:00:00.000Z');
            expect(data.isActive).toBe(true);
        });

        it('omits endDate when the plan is open ended', () => {
            const data = new WorkoutPlan({ Id: 'plan-1', StartDate: new Date('2026-04-01T00:00:00Z') }).ToData();
            expect(data.endDate).toBeUndefined();
        });

        it('round-trips a plan through FromData and ToData', () => {
            const original = {
                id: 'plan-1',
                name: 'Spring block',
                isActive: true,
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-06-01T00:00:00.000Z',
                days: [{ id: 'day-1', dayOfWeek: 5, workoutTemplateId: 'template-1', templateName: 'Legs', note: 'Squat' }],
            };

            expect(WorkoutPlan.FromData(original).ToData()).toEqual(original);
        });
    });
});

describe('WorkoutPlanDay', () => {
    describe('constructor', () => {
        it('defaults to Sunday with no template or note', () => {
            const day = new WorkoutPlanDay();
            expect(day.Id).toBe('');
            expect(day.DayOfWeek).toBe(0);
            expect(day.WorkoutTemplateId).toBeUndefined();
            expect(day.TemplateName).toBeUndefined();
            expect(day.Note).toBeUndefined();
        });

        it('keeps an explicit zero for DayOfWeek', () => {
            expect(new WorkoutPlanDay({ DayOfWeek: 0 }).DayOfWeek).toBe(0);
        });
    });

    describe('FromData', () => {
        it('maps every field', () => {
            const day = WorkoutPlanDay.FromData({
                id: 'day-1',
                dayOfWeek: 3,
                workoutTemplateId: 'template-1',
                templateName: 'Push',
                note: 'Go heavy',
            });

            expect(day.Id).toBe('day-1');
            expect(day.DayOfWeek).toBe(3);
            expect(day.WorkoutTemplateId).toBe('template-1');
            expect(day.TemplateName).toBe('Push');
            expect(day.Note).toBe('Go heavy');
        });

        it('maps a rest day that has a note but no template', () => {
            const day = WorkoutPlanDay.FromData({ id: 'day-2', dayOfWeek: 0, note: 'Rest' });

            expect(day.WorkoutTemplateId).toBeUndefined();
            expect(day.TemplateName).toBeUndefined();
            expect(day.Note).toBe('Rest');
        });
    });

    describe('ToData', () => {
        it('round-trips a day through FromData and ToData', () => {
            const original = {
                id: 'day-1',
                dayOfWeek: 4,
                workoutTemplateId: 'template-2',
                templateName: 'Pull',
                note: undefined,
            };

            expect(WorkoutPlanDay.FromData(original).ToData()).toEqual(original);
        });
    });
});

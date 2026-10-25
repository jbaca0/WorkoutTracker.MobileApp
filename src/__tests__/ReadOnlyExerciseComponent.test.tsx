import React from 'react';
import { render } from '@testing-library/react-native';
import ReadOnlyExerciseComponent from '../Components/ReadOnlyExerciseComponent';
import Exercise from '../Domain/Exercise';
import ExerciseInfo from '../Domain/ExerciseInfo';
import Set from '../Domain/Set';

function makeExercise(sets: Set[]): Exercise {
    return new Exercise({
        ExerciseInfo: new ExerciseInfo({ Id: 'info-1', Name: 'Bench Press' }),
        Sets: sets,
    });
}

describe('ReadOnlyExerciseComponent', () => {
    it('renders the exercise name', () => {
        const screen = render(<ReadOnlyExerciseComponent exercise={makeExercise([])} />);
        expect(screen.getByText('Bench Press')).toBeOnTheScreen();
    });

    it('shows an empty message when there are no sets', () => {
        const screen = render(<ReadOnlyExerciseComponent exercise={makeExercise([])} />);
        expect(screen.getByText('No sets recorded.')).toBeOnTheScreen();
        expect(screen.queryByText('Set')).toBeNull();
    });

    it('renders a table row per set with weight and reps', () => {
        const exercise = makeExercise([
            new Set({ Reps: 10, Weight: 100 }),
            new Set({ Reps: 8, Weight: 110 }),
        ]);
        const screen = render(<ReadOnlyExerciseComponent exercise={exercise} />);

        expect(screen.getByText('Set')).toBeOnTheScreen();
        expect(screen.getByText('Weight')).toBeOnTheScreen();
        expect(screen.getByText('Reps')).toBeOnTheScreen();
        expect(screen.getByText('1')).toBeOnTheScreen();
        expect(screen.getByText('2')).toBeOnTheScreen();
        expect(screen.getByText('100')).toBeOnTheScreen();
        expect(screen.getByText('10')).toBeOnTheScreen();
        expect(screen.getByText('110')).toBeOnTheScreen();
        expect(screen.getByText('8')).toBeOnTheScreen();
        expect(screen.queryByText('No sets recorded.')).toBeNull();
    });

    it('renders an em dash for missing weight or reps', () => {
        const exercise = makeExercise([new Set({})]);
        const screen = render(<ReadOnlyExerciseComponent exercise={exercise} />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });
});

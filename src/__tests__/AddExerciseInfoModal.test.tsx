import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MuscleGroup } from '../Enums/MuscleGroup';

jest.mock('../Services/ExerciseInfoService', () => ({
    ExerciseInfoService: { addExerciseInfo: jest.fn() },
}));

import { ExerciseInfoService } from '../Services/ExerciseInfoService';
import AddExerciseInfoModal from '../Components/AddExerciseInfoModal';

const addExerciseInfo = ExerciseInfoService.addExerciseInfo as jest.Mock;

/** The header title and the footer button share the text "Add Exercise". */
const headerTitle = () => screen.getAllByText('Add Exercise')[0];
const addButton = () => screen.getAllByText('Add Exercise')[1];

const nameInput = () => screen.getByPlaceholderText('e.g. Bench Press');

/** The primary select button shows the chosen group; the same label also exists as a chip. */
const primarySelectButton = () => screen.getAllByText('Other')[0];

/**
 * The picker's dismiss backdrop. It holds no text and has no accessibility label,
 * so its translucent background is the only thing that identifies it.
 */
const pickerBackdrop = () =>
    screen.UNSAFE_root.find(
        (n: any) =>
            typeof n.type === 'string' &&
            n.props?.accessible === true &&
            JSON.stringify(n.props?.style ?? null).includes('rgba(0,0,0,0.5)')
    );

async function pressAdd() {
    await act(async () => {
        fireEvent.press(addButton());
    });
}

describe('AddExerciseInfoModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        addExerciseInfo.mockResolvedValue(undefined);
    });

    describe('visibility', () => {
        it('renders nothing while hidden', () => {
            render(<AddExerciseInfoModal visible={false} onClose={jest.fn()} />);

            expect(screen.toJSON()).toBeNull();
        });

        it('renders the form while visible', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            expect(headerTitle()).toBeOnTheScreen();
            expect(nameInput()).toBeOnTheScreen();
            expect(screen.getByText('Exercise Name')).toBeOnTheScreen();
            expect(screen.getByText('Primary Muscle Group')).toBeOnTheScreen();
            expect(screen.getByText('Secondary Muscle Groups')).toBeOnTheScreen();
        });

        it('defaults the primary muscle group to Other', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            expect(primarySelectButton()).toBeOnTheScreen();
        });

        it('offers every muscle group except None as a secondary chip', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            expect(screen.getByText('Chest')).toBeOnTheScreen();
            expect(screen.getByText('Full Body')).toBeOnTheScreen();
            expect(screen.queryByText('None')).toBeNull();
        });
    });

    describe('adding an exercise', () => {
        // The Add button is disabled whenever the trimmed name is empty, so these two
        // cases never reach handleAdd. Its own `if (!exerciseName.trim()) return` is
        // therefore unreachable through the UI and stays uncovered on purpose.
        it('does nothing when the name is empty', async () => {
            const onClose = jest.fn();
            render(<AddExerciseInfoModal visible onClose={onClose} />);

            await pressAdd();

            expect(addExerciseInfo).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        it('does nothing when the name is only whitespace', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), '   ');
            await pressAdd();

            expect(addExerciseInfo).not.toHaveBeenCalled();
        });

        it('submits the trimmed name with the default muscle groups', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), '  Bench Press  ');
            await pressAdd();

            expect(addExerciseInfo).toHaveBeenCalledWith('Bench Press', MuscleGroup.Other, []);
        });

        it('calls afterAdd and then closes', async () => {
            const onClose = jest.fn();
            const afterAdd = jest.fn();
            render(<AddExerciseInfoModal visible onClose={onClose} afterAdd={afterAdd} />);

            fireEvent.changeText(nameInput(), 'Row');
            await pressAdd();

            expect(afterAdd).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('closes even when no afterAdd callback was given', async () => {
            const onClose = jest.fn();
            render(<AddExerciseInfoModal visible onClose={onClose} />);

            fireEvent.changeText(nameInput(), 'Row');
            await pressAdd();

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('clears the name afterwards so the next open starts empty', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Row');
            await pressAdd();

            expect(nameInput().props.value).toBe('');
        });

        it('shows a spinner instead of the label while the request is in flight', async () => {
            let resolveAdd: () => void = () => {};
            addExerciseInfo.mockReturnValue(new Promise<void>(resolve => { resolveAdd = () => resolve(); }));
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Row');
            fireEvent.press(addButton());

            // Only the header keeps the text while the button shows an ActivityIndicator.
            expect(screen.getAllByText('Add Exercise')).toHaveLength(1);

            await act(async () => {
                resolveAdd();
            });
        });
    });

    describe('secondary muscle groups', () => {
        it('includes a chip that has been tapped', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Bench Press');
            fireEvent.press(screen.getByText('Triceps'));
            await pressAdd();

            expect(addExerciseInfo).toHaveBeenCalledWith('Bench Press', MuscleGroup.Other, [MuscleGroup.Triceps]);
        });

        it('keeps several chips in the order they were tapped', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Bench Press');
            fireEvent.press(screen.getByText('Triceps'));
            fireEvent.press(screen.getByText('Shoulders'));
            await pressAdd();

            expect(addExerciseInfo).toHaveBeenCalledWith(
                'Bench Press',
                MuscleGroup.Other,
                [MuscleGroup.Triceps, MuscleGroup.Shoulders]
            );
        });

        it('removes a chip that is tapped twice', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Bench Press');
            fireEvent.press(screen.getByText('Triceps'));
            fireEvent.press(screen.getByText('Triceps'));
            await pressAdd();

            expect(addExerciseInfo).toHaveBeenCalledWith('Bench Press', MuscleGroup.Other, []);
        });
    });

    describe('the primary muscle group picker', () => {
        it('opens on the select button and lists the groups again', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            // "Chest" appears once as a chip; opening the picker adds a second copy.
            expect(screen.getAllByText('Chest')).toHaveLength(1);

            fireEvent.press(primarySelectButton());

            expect(screen.getAllByText('Chest')).toHaveLength(2);
        });

        it('applies the chosen group and closes', async () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.press(primarySelectButton());
            fireEvent.press(screen.getAllByText('Chest')[1]);

            // The select button now reads "Chest", so "Other" is left only as a chip,
            // which also tells us the picker closed.
            expect(screen.getAllByText('Other')).toHaveLength(1);

            fireEvent.changeText(nameInput(), 'Bench Press');
            await pressAdd();

            expect(addExerciseInfo).toHaveBeenCalledWith('Bench Press', MuscleGroup.Chest, []);
        });

        it('closes on a back-button request without changing anything', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.press(primarySelectButton());
            expect(screen.getAllByText('Chest')).toHaveLength(2);

            // The picker is the inner Modal; the outer one is the sheet itself.
            fireEvent(screen.UNSAFE_getAllByType(Modal)[1], 'requestClose');

            expect(screen.getAllByText('Chest')).toHaveLength(1);
            expect(screen.getAllByText('Other')).toHaveLength(2);
        });

        it('closes without changing anything when the backdrop is tapped', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.press(primarySelectButton());
            expect(screen.getAllByText('Chest')).toHaveLength(2);

            fireEvent.press(pickerBackdrop());

            expect(screen.getAllByText('Other')).toHaveLength(2);
        });
    });

    describe('cancelling', () => {
        it('closes when Cancel is pressed', () => {
            const onClose = jest.fn();
            render(<AddExerciseInfoModal visible onClose={onClose} />);

            fireEvent.press(screen.getByText('Cancel'));

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('discards a typed name and any chosen groups', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Abandoned');
            fireEvent.press(screen.getByText('Triceps'));
            fireEvent.press(screen.getByText('Cancel'));

            expect(nameInput().props.value).toBe('');
        });

        it('does not add anything when cancelled', () => {
            render(<AddExerciseInfoModal visible onClose={jest.fn()} />);

            fireEvent.changeText(nameInput(), 'Abandoned');
            fireEvent.press(screen.getByText('Cancel'));

            expect(addExerciseInfo).not.toHaveBeenCalled();
        });
    });
});

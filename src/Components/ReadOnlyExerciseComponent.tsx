import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Exercise from '../Domain/Exercise';
import { Colors } from '../Theme/colors';

interface ReadOnlyExerciseProps {
    exercise: Exercise;
}

const ReadOnlyExerciseComponent: React.FC<ReadOnlyExerciseProps> = ({ exercise }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.exerciseName}>{exercise.ExerciseInfo?.Name}</Text>

            {exercise.Sets.length > 0 ? (
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableHeader, styles.colSet]}>Set</Text>
                        <Text style={[styles.tableHeader, styles.colValue]}>Weight</Text>
                        <Text style={[styles.tableHeader, styles.colValue]}>Reps</Text>
                    </View>
                    {exercise.Sets.map((set, index) => (
                        <View key={set.Key} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colSet]}>{index + 1}</Text>
                            <Text style={[styles.tableCell, styles.colValue]}>{set.Weight || '—'}</Text>
                            <Text style={[styles.tableCell, styles.colValue]}>{set.Reps || '—'}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>No sets recorded.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    exerciseName: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    table: {
        borderRadius: 6,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHeader: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    tableCell: {
        color: Colors.text,
        fontSize: 14,
        textAlign: 'center',
    },
    colSet: {
        width: 40,
    },
    colValue: {
        flex: 1,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 8,
    },
});

export default ReadOnlyExerciseComponent;

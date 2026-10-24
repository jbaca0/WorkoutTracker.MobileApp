import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../Theme/colors';

const PRESETS = [60, 90, 120];

interface RestTimerProps {
    secondsRemaining: number;
    /** Full length of the current countdown, used for the progress bar. */
    totalSeconds: number;
    /** The saved default rest duration, highlighted among the presets. */
    selectedPresetSeconds: number;
    onAddTime: (deltaSeconds: number) => void;
    onSelectPreset: (seconds: number) => void;
    onSkip: () => void;
}

function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const RestTimer: React.FC<RestTimerProps> = ({
    secondsRemaining,
    totalSeconds,
    selectedPresetSeconds,
    onAddTime,
    onSelectPreset,
    onSkip,
}) => {
    const progress = totalSeconds > 0
        ? Math.max(0, Math.min(1, secondsRemaining / totalSeconds))
        : 0;

    return (
        <View style={styles.banner}>
            <View style={styles.topRow}>
                <Text style={styles.label}>Rest</Text>
                <Text style={styles.time}>{formatTime(secondsRemaining)}</Text>
                <Pressable style={styles.skipButton} onPress={onSkip} hitSlop={8}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.controls}>
                <Pressable style={styles.adjustButton} onPress={() => onAddTime(-15)}>
                    <Text style={styles.adjustButtonText}>−15s</Text>
                </Pressable>

                <View style={styles.presets}>
                    {PRESETS.map(seconds => {
                        const active = seconds === selectedPresetSeconds;
                        return (
                            <Pressable
                                key={seconds}
                                style={[styles.presetChip, active && styles.presetChipActive]}
                                onPress={() => onSelectPreset(seconds)}
                            >
                                <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                                    {seconds}s
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable style={styles.adjustButton} onPress={() => onAddTime(15)}>
                    <Text style={styles.adjustButtonText}>+15s</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        backgroundColor: Colors.surfaceRaised,
        borderRadius: 12,
        marginHorizontal: 12,
        marginBottom: 6,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    time: {
        color: Colors.primary,
        fontSize: 28,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    skipButton: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    skipButtonText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.inputBackground,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    adjustButton: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    adjustButtonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    presets: {
        flexDirection: 'row',
        gap: 6,
    },
    presetChip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    presetChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    presetChipText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    presetChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default RestTimer;

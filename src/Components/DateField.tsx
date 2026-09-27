import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../Theme/colors';
import { toDateInputString, formatDisplayDate } from '../Utilities/DateUtils';

interface DateFieldProps {
    /** YYYY-MM-DD, or '' when unset. */
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Shows a Clear action, for optional dates like a plan end date. */
    clearable?: boolean;
    /** YYYY-MM-DD; days before this are not selectable. */
    minDate?: string;
}

/**
 * Tap-to-open calendar for the YYYY-MM-DD dates the API expects.
 *
 * Uses react-native-calendars (already used by the Plans tab) rather than a
 * native picker so no extra native module is needed. The overlay is a
 * transparent Modal, which nests safely inside the full-screen modals.
 */
const DateField: React.FC<DateFieldProps> = ({
    value,
    onChange,
    placeholder = 'Select a date',
    clearable = false,
    minDate,
}) => {
    const [open, setOpen] = useState(false);

    const today = toDateInputString(new Date());
    const markedDates = value
        ? { [value]: { selected: true, selectedColor: Colors.primary } }
        : {};

    return (
        <>
            <Pressable style={styles.field} onPress={() => setOpen(true)}>
                <Text style={value ? styles.valueText : styles.placeholderText}>
                    {value ? formatDisplayDate(value) : placeholder}
                </Text>
                <Text style={styles.icon}>📅</Text>
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
                    {/* Absorbs taps so tapping the card does not dismiss it. */}
                    <Pressable style={styles.card} onPress={() => {}}>
                        <Calendar
                            current={value || today}
                            minDate={minDate}
                            markedDates={markedDates}
                            onDayPress={day => {
                                onChange(day.dateString);
                                setOpen(false);
                            }}
                            theme={{
                                backgroundColor: Colors.surface,
                                calendarBackground: Colors.surface,
                                textSectionTitleColor: Colors.textSecondary,
                                selectedDayBackgroundColor: Colors.primary,
                                selectedDayTextColor: '#fff',
                                todayTextColor: Colors.primary,
                                dayTextColor: Colors.text,
                                textDisabledColor: Colors.textSecondary,
                                arrowColor: Colors.primary,
                                monthTextColor: Colors.text,
                                indicatorColor: Colors.primary,
                            }}
                        />

                        <View style={styles.actions}>
                            {clearable && (
                                <Pressable
                                    style={styles.actionBtn}
                                    onPress={() => {
                                        onChange('');
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={styles.clearText}>Clear</Text>
                                </Pressable>
                            )}
                            <View style={{ flex: 1 }} />
                            <Pressable style={styles.actionBtn} onPress={() => setOpen(false)}>
                                <Text style={styles.doneText}>Done</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    valueText: { color: Colors.text, fontSize: 16, flex: 1 },
    placeholderText: { color: Colors.textSecondary, fontSize: 16, flex: 1 },
    icon: { fontSize: 15, marginLeft: 8 },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: 8,
    },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 12 },
    clearText: { color: Colors.error, fontSize: 15 },
    doneText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});

export default DateField;

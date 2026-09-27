import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotification } from '../../src/Hooks/useNotification';
import { WorkoutTemplateService } from '../../src/Services/WorkoutTemplateService';
import { ExerciseInfoService } from '../../src/Services/ExerciseInfoService';
import ExerciseInfo from '../../src/Domain/ExerciseInfo';
import { WorkoutTemplateExerciseRequest } from '../../src/DataTransferObjects/Requests/WorkoutTemplate/CreateTemplateRequest';
import { Colors } from '../../src/Theme/colors';
import TemplateEditorFields from '../../src/Components/TemplateEditorFields';

export default function TemplateEditorScreen() {
    const { templateId } = useLocalSearchParams<{ templateId: string }>();
    const isNew = templateId === 'new';
    const router = useRouter();
    const { showError } = useNotification();

    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<WorkoutTemplateExerciseRequest[]>([]);
    const [exerciseInfos, setExerciseInfos] = useState<ExerciseInfo[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        ExerciseInfoService.getExerciseInfos().then(setExerciseInfos).catch(() => {});

        if (isNew) return;

        WorkoutTemplateService.getTemplates()
            .then(templates => {
                const template = templates.find(t => t.Id === templateId);
                if (!template) {
                    showError('Template not found.');
                    router.back();
                    return;
                }
                setName(template.Name);
                setExercises(
                    template.Exercises
                        .slice()
                        .sort((a, b) => a.Order - b.Order)
                        .map(e => ({
                            exerciseInfoId: e.ExerciseInfoId,
                            sets: e.Sets.map(s => ({ reps: s.Reps })),
                        }))
                );
            })
            .catch(() => showError('Failed to load template'))
            .finally(() => setLoading(false));
    }, [templateId]);

    async function handleSave() {
        if (!name.trim()) {
            Alert.alert('Name required', 'Please enter a template name.');
            return;
        }
        setSaving(true);
        try {
            if (isNew) {
                await WorkoutTemplateService.addTemplate(name.trim(), exercises);
            } else {
                await WorkoutTemplateService.updateTemplate(templateId, name.trim(), exercises);
            }
            router.back();
        } catch (error) {
            // Surface the server's reason; a bare "failed to save" gives nothing
            // to act on when the request is rejected.
            const detail = error instanceof Error ? error.message : String(error);
            console.error('Template save failed:', detail);
            showError(detail ? `Failed to save template. ${detail.slice(0, 300)}` : 'Failed to save template');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backText}>‹ Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isNew ? 'New Template' : 'Edit Template'}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color={Colors.primary} size="small" />
                        : <Text style={styles.saveText}>Save</Text>
                    }
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    <TemplateEditorFields
                        name={name}
                        onNameChange={setName}
                        exercises={exercises}
                        onExercisesChange={setExercises}
                        exerciseInfos={exerciseInfos}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: { color: Colors.text, fontSize: 17, fontWeight: '700' },
    backText: { color: Colors.primary, fontSize: 16 },
    saveText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
    keyboardAvoid: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
});

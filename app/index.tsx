import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/Hooks/useAuth';
import { Colors } from '../src/Theme/colors';

export default function Index() {
    const { user, authLoaded } = useAuth();

    if (!authLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)/home" />;
    }

    return <Redirect href="/login" />;
}

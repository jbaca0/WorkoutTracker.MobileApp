import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/Theme/colors';

function TabIcon({ icon }: { icon: string }) {
    return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="exercises"
                options={{
                    title: 'Exercises',
                    tabBarIcon: () => <TabIcon icon="🏋️" />,
                }}
            />
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: () => <TabIcon icon="🏠" />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: () => <TabIcon icon="📋" />,
                }}
            />
        </Tabs>
    );
}

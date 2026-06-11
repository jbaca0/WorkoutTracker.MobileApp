import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import WorkoutResumeBanner from '../../src/Components/WorkoutResumeBanner';
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
            tabBar={(props) => (
                <View>
                    <WorkoutResumeBanner />
                    <BottomTabBar {...props} />
                </View>
            )}
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
            <Tabs.Screen
                name="plans"
                options={{
                    title: 'Plans',
                    tabBarIcon: () => <TabIcon icon="📅" />,
                }}
            />
        </Tabs>
    );
}

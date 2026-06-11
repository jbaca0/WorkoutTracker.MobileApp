import { createContext, ReactNode, useContext } from "react";
import useAsyncStorage from "./useAsyncStorage";

interface ActiveWorkoutContext {
    hasActiveWorkout: boolean;
    activeWorkoutId: string | null;
    workoutStartTime: string | null;
    setActiveWorkout: (workoutId: string) => void;
    clearActiveWorkout: () => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContext | undefined>(undefined);

interface ActiveWorkoutProviderProps {
    children: ReactNode;
}

export const ActiveWorkoutProvider: React.FC<ActiveWorkoutProviderProps> = ({ children }) => {
    const [activeWorkoutId, , setActiveWorkoutId] = useAsyncStorage<string | null>('activeWorkoutId', null);
    const [workoutStartTime, , setWorkoutStartTime] = useAsyncStorage<string | null>('workoutStartTime', null);

    const hasActiveWorkout = activeWorkoutId !== null;

    function setActiveWorkout(workoutId: string) {
        setActiveWorkoutId(workoutId);
        setWorkoutStartTime(new Date().toISOString());
    }

    function clearActiveWorkout() {
        setActiveWorkoutId(null);
        setWorkoutStartTime(null);
    }

    return (
        <ActiveWorkoutContext.Provider value={{
            hasActiveWorkout,
            activeWorkoutId,
            workoutStartTime,
            setActiveWorkout,
            clearActiveWorkout
        }}>
            {children}
        </ActiveWorkoutContext.Provider>
    );
};

export const useActiveWorkout = () => {
    const context = useContext(ActiveWorkoutContext);
    if (context === undefined) {
        throw new Error('useActiveWorkout must be used within an ActiveWorkout provider');
    }
    return context;
};

import { createContext, ReactNode, useContext } from "react";
import useAsyncStorage from "./useAsyncStorage";

interface ActiveWorkoutContext {
    hasActiveWorkout: boolean;
    activeWorkoutId: string | null;
    setActiveWorkout: (workoutId: string) => void;
    clearActiveWorkout: () => void;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContext | undefined>(undefined);

interface ActiveWorkoutProviderProps {
    children: ReactNode;
}

export const ActiveWorkoutProvider: React.FC<ActiveWorkoutProviderProps> = ({ children }) => {
    const [activeWorkoutId, , setActiveWorkoutId] = useAsyncStorage<string | null>('activeWorkoutId', null);

    const hasActiveWorkout = activeWorkoutId !== null;

    function setActiveWorkout(workoutId: string) {
        setActiveWorkoutId(workoutId);
    }

    function clearActiveWorkout() {
        setActiveWorkoutId(null);
    }

    return (
        <ActiveWorkoutContext.Provider value={{
            hasActiveWorkout,
            activeWorkoutId,
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

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const restCompleteSource = require('../../assets/sounds/rest-complete.wav');

let player: AudioPlayer | null = null;

function getPlayer(): AudioPlayer {
    if (!player) {
        player = createAudioPlayer(restCompleteSource);
    }
    return player;
}

/**
 * Configure the audio session so the rest-timer beep is audible even when the
 * phone's ringer is on silent. Call once at app startup.
 */
export async function configureAudioMode(): Promise<void> {
    try {
        await setAudioModeAsync({ playsInSilentMode: true });
    } catch {
        // Non-fatal: audio just falls back to default behavior.
    }
}

/**
 * Plays the rest-timer completion beep and triggers a success haptic buzz.
 * Fire-and-forget; failures are swallowed so they never interrupt the workout.
 */
export function playRestCompleteAlert(): void {
    try {
        const p = getPlayer();
        p.seekTo(0);
        p.play();
    } catch {
        // ignore playback errors
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        // ignore haptic errors (e.g. unsupported device)
    });
}

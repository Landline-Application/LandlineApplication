/**
 * Full-screen notification permissions / app bypass (Android).
 * Guided setup reuses the same logic via `useAppSelection` + `AppSelectionBody` on that screen.
 */
import { AppSelectionForm } from '@/components/app-selection/AppSelectionForm';

export default function AppSelectionScreen() {
  return <AppSelectionForm />;
}

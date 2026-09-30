import type { TutorialTab } from '@/constants/usage-tutorial';

type TabNavigator = {
  navigate: (screen: TutorialTab) => void;
};

let tabNavigator: TabNavigator | null = null;

/** Called by the tab bar so the tour can switch tabs directly. */
export function registerTutorialTabNavigator(navigation: TabNavigator) {
  tabNavigator = navigation;
}

export function openTutorialTab(screen: TutorialTab) {
  tabNavigator?.navigate(screen);
}

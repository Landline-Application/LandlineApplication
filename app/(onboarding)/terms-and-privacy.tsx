import { useEffect } from 'react';

import { router } from 'expo-router';

export default function TermsAndPrivacyRedirect() {
  useEffect(() => {
    router.replace('/terms-of-service');
  }, []);

  return null;
}

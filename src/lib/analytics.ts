export type ScorecardAnalyticsEvent =
  | 'scorecard_generated'
  | 'scorecard_shared'
  | 'scorecard_lead_submitted'
  | 'scorecard_cta_immersivekit_clicked';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: AnalyticsProperties }) => void;
    gtag?: (command: 'event', eventName: string, parameters?: AnalyticsProperties) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const isDevelopment = import.meta.env.DEV;
const shouldDebug = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

export function trackEvent(eventName: ScorecardAnalyticsEvent, properties: AnalyticsProperties = {}) {
  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as AnalyticsProperties;

  if (typeof window === 'undefined') return;

  if (typeof window.plausible === 'function') {
    window.plausible(eventName, { props: cleanProperties });
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, cleanProperties);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...cleanProperties });
    return;
  }

  if (isDevelopment || shouldDebug) {
    console.info('[analytics]', eventName, cleanProperties);
  }
}

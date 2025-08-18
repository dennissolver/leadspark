declare global {
  interface Window {
    LeadSparkWidget?: {
      init: (options: { position: string; accentColor: string }) => void;
    };
  }
}

export {};
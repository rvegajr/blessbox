declare module 'aos' {
  interface AosOptions {
    duration?: number;
    once?: boolean;
    mirror?: boolean;
    delay?: number;
    offset?: number;
    easing?: string;
  }

  interface AosInstance {
    init(options?: AosOptions): void;
    refresh(): void;
    refreshHard(): void;
  }

  const AOS: AosInstance;
  export default AOS;
}



import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0A0C",       // near-black background
        char: "#141317",      // panel charcoal
        line: "#232127",      // hairline borders
        bone: "#F2EEE7",      // off-white text
        fade: "#9A94A0",      // secondary text
        amber: "#E0A15C",     // primary accent (warm amber, restrained)
        ember: "#C4574B",     // secondary accent (muted red/pink)
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(242,238,231,0.035) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;

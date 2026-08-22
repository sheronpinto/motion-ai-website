/**
 * The page's one deliberate flourish: an easing-curve graph, the exact
 * artifact a motion designer stares at all day when tuning an animation.
 * Two keyframe handles sit on a cubic-bezier path with a dot riding it on
 * a loop — quietly explaining "this software thinks in curves and time"
 * without a single word of copy.
 */
export default function MotionSignature() {
  return (
    <svg
      viewBox="0 0 520 360"
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Animated easing curve, representing keyframe-based motion design"
    >
      <defs>
        <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0A15C" />
          <stop offset="100%" stopColor="#C4574B" />
        </linearGradient>
      </defs>

      {/* Grid */}
      <g stroke="#232127" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="40" y1={40 + i * 60} x2="480" y2={40 + i * 60} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={40 + i * 73.3} y1="40" x2={40 + i * 73.3} y2="280" />
        ))}
      </g>

      {/* Axes */}
      <line x1="40" y1="280" x2="480" y2="280" stroke="#9A94A0" strokeWidth="1.5" />
      <line x1="40" y1="40" x2="40" y2="280" stroke="#9A94A0" strokeWidth="1.5" />

      {/* The ease curve itself */}
      <path
        d="M 60 260 C 180 260, 200 60, 460 60"
        fill="none"
        stroke="url(#curveGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Handle guide lines */}
      <line x1="60" y1="260" x2="180" y2="260" stroke="#9A94A0" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="460" y1="60" x2="200" y2="60" stroke="#9A94A0" strokeWidth="1" strokeDasharray="4 4" />

      {/* Keyframe endpoints */}
      <circle cx="60" cy="260" r="6" fill="#0B0A0C" stroke="#F2EEE7" strokeWidth="2" />
      <circle cx="460" cy="60" r="6" fill="#0B0A0C" stroke="#F2EEE7" strokeWidth="2" />

      {/* Bezier handle points */}
      <circle cx="180" cy="260" r="4" fill="#E0A15C" />
      <circle cx="200" cy="60" r="4" fill="#C4574B" />

      {/* Riding dot, animated along the same path */}
      <circle r="7" fill="#F2EEE7">
        <animateMotion
          dur="3.2s"
          repeatCount="indefinite"
          path="M 60 260 C 180 260, 200 60, 460 60"
        />
      </circle>

      {/* Frame labels */}
      <text x="40" y="304" fill="#9A94A0" fontSize="12" fontFamily="var(--font-mono)">
        0:00
      </text>
      <text x="452" y="304" fill="#9A94A0" fontSize="12" fontFamily="var(--font-mono)">
        0:02
      </text>
    </svg>
  );
}

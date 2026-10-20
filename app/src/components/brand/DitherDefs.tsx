/** Shared 1-bit fill patterns for charts. Render once inside an <svg>. */
export function DitherDefs({ prefix = 'd' }: { prefix?: string }) {
  return (
    <defs>
      <pattern id={`${prefix}-o25`} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="#FF5A1F" />
        <rect x="2" y="2" width="1" height="1" fill="#FF5A1F" />
      </pattern>
      <pattern id={`${prefix}-o75`} width="2" height="2" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="#FF5A1F" />
        <rect width="1" height="1" fill="#0A0A09" />
      </pattern>
      <pattern id={`${prefix}-b25`} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="#ECE8DF" />
        <rect x="2" y="2" width="1" height="1" fill="#ECE8DF" />
      </pattern>
      <pattern id={`${prefix}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="#2B2A26" />
      </pattern>
      <pattern id={`${prefix}-blk`} width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="#FF5A1F" />
      </pattern>
    </defs>
  );
}

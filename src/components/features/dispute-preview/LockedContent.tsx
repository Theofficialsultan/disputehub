interface LockedContentProps {
  title: string;
  preview?: string;
  children?: React.ReactNode;
}

export function LockedContent({ title, preview, children }: LockedContentProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          LOCKED
        </span>
      </div>

      {/* Content */}
      <div className="relative p-6">
        {preview && (
          <p className="mb-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {preview}
          </p>
        )}
        {children}

        {/* Blur Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background backdrop-blur-sm" />

        {/* Lock Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-background p-4 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

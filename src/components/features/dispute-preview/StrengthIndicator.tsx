interface StrengthIndicatorProps {
  strength: "weak" | "moderate" | "strong";
}

const STRENGTH_CONFIG = {
  weak: {
    label: "Weak Case",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: "🔴",
    description: "Your case may face challenges",
  },
  moderate: {
    label: "Moderate Case",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: "🟡",
    description: "You have reasonable grounds to dispute",
  },
  strong: {
    label: "Strong Case",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: "🟢",
    description: "Your case has strong merit",
  },
};

export function StrengthIndicator({ strength }: StrengthIndicatorProps) {
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className={`rounded-lg border p-6 ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{config.icon}</span>
        <div>
          <h3 className={`text-xl font-bold ${config.color}`}>
            {config.label}
          </h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

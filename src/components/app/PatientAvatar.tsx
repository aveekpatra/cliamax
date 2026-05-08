import { cn } from "@/lib/utils";

interface PatientAvatarProps {
  name: string;
  className?: string;
}

export function PatientAvatar({ name, className }: PatientAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),inset_0_-2px_3px_0_rgba(0,0,0,0.18),0_1px_2px_0_rgba(0,0,0,0.18)]",
        className
      )}
      style={{
        background: [
          // top-left specular highlight (glossy shine)
          "radial-gradient(ellipse 65% 55% at 28% 22%, rgba(255,255,255,0.55), transparent 60%)",
          // bottom-right purple pool (depth)
          "radial-gradient(ellipse 80% 70% at 78% 82%, oklch(0.40 0.22 305 / 0.65), transparent 60%)",
          // base diagonal blue → purple
          "linear-gradient(135deg, oklch(0.58 0.22 252), oklch(0.46 0.24 295))",
        ].join(", "),
        textShadow: "0 1px 1px rgba(0,0,0,0.25)",
      }}
    >
      {initials(name)}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

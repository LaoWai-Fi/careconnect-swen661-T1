import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function Icon({
  children,
  className = "w-4 h-4",
}: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const lineProps = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MailIcon({ className }: IconProps) {
  return <Icon className={className}><rect x="3" y="5" width="18" height="14" rx="2" {...lineProps} /><path d="m4 7 8 6 8-6" {...lineProps} /></Icon>;
}

export function DashboardIcon({ className }: IconProps) {
  return <Icon className={className}><rect x="3" y="3" width="7" height="7" rx="1" {...lineProps} /><rect x="14" y="3" width="7" height="7" rx="1" {...lineProps} /><rect x="3" y="14" width="7" height="7" rx="1" {...lineProps} /><rect x="14" y="14" width="7" height="7" rx="1" {...lineProps} /></Icon>;
}

export function MedicineIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M8.2 4.2a4.2 4.2 0 0 1 5.9 0l5.7 5.7a4.2 4.2 0 0 1-5.9 5.9L8.2 10a4.2 4.2 0 0 1 0-5.8Z" {...lineProps} /><path d="m10.8 12.6 5.9-5.9" {...lineProps} /></Icon>;
}

export function CalendarIcon({ className }: IconProps) {
  return <Icon className={className}><rect x="3" y="5" width="18" height="16" rx="2" {...lineProps} /><path d="M8 3v4M16 3v4M3 10h18" {...lineProps} /><path d="M8 14h2M14 14h2M8 17h2" {...lineProps} /></Icon>;
}

export function ActivityIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" {...lineProps} /></Icon>;
}

export function SettingsIcon({ className }: IconProps) {
  return <Icon className={className}><circle cx="12" cy="12" r="3" {...lineProps} /><path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.7-1.7l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.7-.7L10.8 2h-3l-.7 2.3a7 7 0 0 0-1.7.7l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.7 1.7l-2 .7v3l2 .7a7 7 0 0 0 .7 1.7l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.7.7l.7 2.3h3l.7-2.3a7 7 0 0 0 1.7-.7l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .7-1.7Z" transform="translate(2.2)" {...lineProps} /></Icon>;
}

export function SearchIcon({ className }: IconProps) {
  return <Icon className={className}><circle cx="10.5" cy="10.5" r="6.5" {...lineProps} /><path d="m16 16 5 5" {...lineProps} /></Icon>;
}

export function SyncIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M20 7v5h-5M4 17v-5h5M6.1 8.5A7 7 0 0 1 18.4 7L20 9M4 15l1.6 2A7 7 0 0 0 18 15.5" {...lineProps} /></Icon>;
}

export function PlusIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M12 5v14M5 12h14" {...lineProps} /></Icon>;
}

export function ChevronDownIcon({ className }: IconProps) {
  return <Icon className={className}><path d="m8 10 4 4 4-4" {...lineProps} /></Icon>;
}

export function EmergencyIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></Icon>;
}

export function HelpIcon({ className }: IconProps) {
  return <Icon className={className}><circle cx="12" cy="12" r="9" {...lineProps} /><path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1-1.4 2.1M12 17h.01" {...lineProps} /></Icon>;
}

export function CareIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M20.8 5.8a5 5 0 0 0-7.1 0L12 7.5l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.1a5 5 0 0 0 0-7.1Z" {...lineProps} /></Icon>;
}

// A small, hand-drawn, stroke-based icon set (24x24, consistent 1.75 stroke) — no external icon
// dependency to keep the image lean. Deliberately minimal: only what this app actually uses.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
const base = (props: IconProps) => ({
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props,
});

export const FolderIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>
);
export const InboxIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3.5 12h4.2l1.3 3h6l1.3-3h4.2" /><path d="M5.2 6.4 3.5 12v6a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6l-1.7-5.6A2 2 0 0 0 17 5H7a2 2 0 0 0-1.8 1.4Z" /></svg>
);
export const CheckSquareIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m9 12 2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
);
export const StampIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 15h8l1.5 5h-11L8 15Z" /><path d="M9 15V9a3 3 0 0 1 6 0v6" /><path d="M5 20h14" /></svg>
);
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 5 6v6c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3Z" /><path d="m9.5 12 1.8 1.8L15 10" /></svg>
);
export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.6a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87A1.7 1.7 0 0 0 3.07 12.5H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.14.7.66 1.27 1.34 1.5H21a2 2 0 1 1 0 4h-.09c-.68.23-1.2.8-1.34 1.5Z" /></svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></svg>
);
export const LogOutIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const XIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.3 2.3 2.3 4.7-5" /></svg>
);
export const XCircleIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m9.5 9.5 5 5m0-5-5 5" /></svg>
);
export const AlertTriangleIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.5 21.5 20h-19L12 3.5Z" /><path d="M12 10v4" /><path d="M12 17.3v.01" /></svg>
);
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>
);
export const FileTextIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M14 3.5V8h4.2" /><path d="M9 12.5h6M9 15.5h6" /></svg>
);
export const CircleDotIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>
);
export const LayersIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m12 3 8.5 4.6L12 12.2 3.5 7.6 12 3Z" /><path d="m3.5 12 8.5 4.6 8.5-4.6" /><path d="m3.5 16.4 8.5 4.6 8.5-4.6" /></svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
);
export const BuildingIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="3.5" width="10" height="17" rx="1" /><path d="M14 9h6v11.5H14" /><path d="M7.5 7.5h.01M10.5 7.5h.01M7.5 11h.01M10.5 11h.01M7.5 14.5h.01M10.5 14.5h.01M16.5 12.5h.01M16.5 15.5h.01" /></svg>
);
export const UploadIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" /></svg>
);
export const SpinnerIcon = ({ className, ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...p} className={['animate-spin', className].filter(Boolean).join(' ')}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

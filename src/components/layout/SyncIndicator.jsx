import { useSyncStatus } from '../../context/SyncContext';

export default function SyncIndicator() {
  const { syncStatus } = useSyncStatus();

  let dotColor = 'bg-success';
  let text = 'Synced ✓';
  let pulse = '';

  if (syncStatus === 'syncing') {
    dotColor = 'bg-warning';
    text = 'Syncing...';
    pulse = 'animate-pulse-dot';
  } else if (syncStatus === 'offline') {
    dotColor = 'bg-error';
    text = 'Offline — Local Only';
  } else if (syncStatus === 'error') {
    dotColor = 'bg-error';
    text = 'Sync Failed — Retrying';
    pulse = 'animate-pulse';
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm ring-1 ring-white/15">
      <span className={`h-2 w-2 rounded-full ${dotColor} ${pulse}`} />
      <span className="text-xs font-semibold text-white/90 whitespace-nowrap">
        {text}
      </span>
    </div>
  );
}

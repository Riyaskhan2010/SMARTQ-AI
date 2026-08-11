// Shared helper utilities

export function formatTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function addMinutes(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function crowdColor(level) {
  return { LOW: 'text-emerald-400', MEDIUM: 'text-yellow-400', HIGH: 'text-orange-400', VERY_HIGH: 'text-red-400' }[level] || 'text-slate-400';
}

export function crowdBg(level) {
  return { LOW: 'bg-emerald-500/10', MEDIUM: 'bg-yellow-500/10', HIGH: 'bg-orange-500/10', VERY_HIGH: 'bg-red-500/10' }[level] || 'bg-slate-500/10';
}

export function statusColor(status) {
  return {
    WAITING: 'text-yellow-400', SERVING: 'text-blue-400', COMPLETED: 'text-emerald-400',
    NO_SHOW: 'text-red-400', CANCELLED: 'text-slate-500',
    OPEN: 'text-emerald-400', CLOSED: 'text-slate-500', PAUSED: 'text-orange-400',
  }[status] || 'text-slate-400';
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function estimateTravelTime(distanceKm, mode = 'car') {
  const speeds = { car: 25, bike: 20, walk: 5 };
  return Math.ceil((distanceKm / speeds[mode]) * 60);
}

export function truncateText(text, max = 60) {
  return text?.length > max ? text.slice(0, max) + '…' : text;
}

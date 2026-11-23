export function formatInr(cents: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatShortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function formatCategory(category: string) {
  return category.replace(/_/g, ' ');
}
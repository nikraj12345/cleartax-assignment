export type ToolResultRow = { name: string; data: unknown };

export function ticketMetaFromToolResults(
  results: ToolResultRow[],
): { ticketId?: string; escalated: boolean } {
  for (let i = results.length - 1; i >= 0; i--) {
    const row = results[i];
    if (
      (row.name === 'create_support_ticket' ||
        row.name === 'escalate_support_ticket') &&
      row.data &&
      typeof row.data === 'object' &&
      'id' in row.data &&
      typeof (row.data as { id: unknown }).id === 'string'
    ) {
      const data = row.data as { id: string; status?: string };
      return {
        ticketId: data.id,
        escalated: true,
      };
    }
  }
  return { escalated: false };
}

export function studentAskedForTicket(message: string): boolean {
  const m = message.toLowerCase();
  if (
    m.includes('raise a ticket') ||
    m.includes('open a ticket') ||
    m.includes('create a ticket') ||
    m.includes('log a ticket') ||
    m.includes('file a ticket') ||
    m.includes('raise ticket') ||
    m.includes('want a ticket') ||
    m.includes('need a ticket')
  ) {
    return true;
  }
  return m.includes('ticket') && (m.includes('want') || m.includes('raise'));
}
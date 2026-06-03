export function formatDate(value?: string | Date | null): string {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function parseDate(value: string): Date {
  const brazilianDateTime = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (brazilianDateTime) {
    const [, day, month, year, hour = '00', minute = '00', second = '00'] = brazilianDateTime;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }

  return new Date(value);
}

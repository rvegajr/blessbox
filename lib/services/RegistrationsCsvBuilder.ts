/**
 * Phase E: Registration CSV Builder
 * Pure helper for building CSV exports from registrations
 */

type FormField = { id: string; label: string };

type Registration = {
  id: string;
  qrCodeId: string;
  registeredAt: string;
  deliveryStatus: string;
  checkedInAt: string | null;
  registrationData: string;
};

const UTF8_BOM = '﻿';

/**
 * Escape a CSV cell, including defending against spreadsheet formula injection
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (s.length > 0 && /^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from registrations
 * Always emits BOM + header row, even when registrations array is empty
 */
export function buildCsv({
  registrations,
  formFields,
  timezone,
}: {
  registrations: Registration[];
  formFields?: FormField[];
  timezone: string;
}): string {
  const standardFields = [
    'Registration ID',
    'QR Code ID',
    'Registered At',
    'Status',
    'Checked In',
    'Checked In At',
  ];

  let dynamicHeaders: string[] = [];
  let getRowDynamicValues: (formData: Record<string, any>) => any[] = () => [];

  if (registrations.length > 0) {
    if (formFields && formFields.length > 0) {
      dynamicHeaders = formFields.map((f) => f.label);
      getRowDynamicValues = (formData) => formFields.map((f) => formData[f.id] ?? '');
    } else {
      const firstFormData = JSON.parse(registrations[0].registrationData);
      const dynamicFieldKeys = Object.keys(firstFormData);
      dynamicHeaders = dynamicFieldKeys.map(
        (key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      );
      getRowDynamicValues = (formData) => dynamicFieldKeys.map((key) => formData[key]);
    }
  }

  const headers = [...standardFields, ...dynamicHeaders];

  const rows = registrations.map((reg) => {
    const formData = JSON.parse(reg.registrationData);
    const standardValues = [
      reg.id,
      reg.qrCodeId,
      new Date(reg.registeredAt).toLocaleString('en-US', { timeZone: timezone }),
      reg.deliveryStatus,
      reg.checkedInAt ? 'Yes' : 'No',
      reg.checkedInAt
        ? new Date(reg.checkedInAt).toLocaleString('en-US', { timeZone: timezone })
        : '',
    ];
    const dynamicValues = getRowDynamicValues(formData);
    return [...standardValues, ...dynamicValues].map(csvEscape);
  });

  return UTF8_BOM + [headers.map(csvEscape).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

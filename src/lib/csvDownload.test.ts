// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, downloadCsv } from './csv';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const stubUrls = () => {
  const create = vi.fn((blob: Blob) => (void blob, 'blob:fake'));
  const revoke = vi.fn();
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
  return { create, revoke };
};

describe('downloadBlob', () => {
  it('clicks a temporary link, removes it, and revokes the URL later', () => {
    vi.useFakeTimers();
    const { create, revoke } = stubUrls();
    const clicks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this);
    });

    downloadBlob('report.pdf', new Blob(['x']));

    expect(create).toHaveBeenCalledOnce();
    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('report.pdf');
    expect(clicks[0].href).toBe('blob:fake');
    expect(document.querySelector('a')).toBeNull();
    // Revoking straight away can cancel the download.
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:fake');
  });
});

describe('downloadCsv', () => {
  it('saves UTF-8 CSV with a byte order mark so Excel reads Hindi names', async () => {
    const { create } = stubUrls();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('items.csv', 'Name\r\nगेहूं');

    const blob = create.mock.calls[0][0];
    expect(blob.type).toBe('text/csv;charset=utf-8');
    // jsdom's Blob has no arrayBuffer(); FileReader works.
    const buffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const bytes = new Uint8Array(buffer);
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Name\r\nगेहूं');
  });
});

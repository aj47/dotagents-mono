import { describe, expect, it } from 'vitest';
import {
  buildMobileApiActionError,
  buildMobileApiActionResult,
} from './remote-server-route-contracts';

describe('remote server route contracts', () => {
  it('builds mobile api action results with default success status', () => {
    expect(buildMobileApiActionResult({ ok: true })).toEqual({
      statusCode: 200,
      body: { ok: true },
    });
  });

  it('includes mobile api action result status and headers when provided', () => {
    expect(buildMobileApiActionResult('stream-body', 206, { 'content-range': 'bytes 0-4/10' })).toEqual({
      statusCode: 206,
      body: 'stream-body',
      headers: { 'content-range': 'bytes 0-4/10' },
    });
  });

  it('builds mobile api action errors with the shared error response shape', () => {
    expect(buildMobileApiActionError(404, 'Video asset not found', { 'cache-control': 'no-store' })).toEqual({
      statusCode: 404,
      body: { error: 'Video asset not found' },
      headers: { 'cache-control': 'no-store' },
    });
  });
});

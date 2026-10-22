import { describe, expect, it } from 'vitest';
import { GROUNDWORK_FIELDS, GROUNDWORK_LIMITS, quoteActionUrl, quotePageUrl } from '../../src/lib/quote';

describe('quote URL handling', () => {
  it('returns empty when unconfigured or invalid', () => {
    expect(quotePageUrl('')).toBe('');
    expect(quotePageUrl('   ')).toBe('');
    expect(quotePageUrl('javascript:alert(1)')).toBe('');
    expect(quotePageUrl('/r/grizzly')).toBe('');
    expect(quoteActionUrl('')).toBe('');
  });
  it('derives the /send action from the hosted page URL', () => {
    expect(quoteActionUrl('https://gw.example.com/r/grizzly')).toBe('https://gw.example.com/r/grizzly/send');
    expect(quoteActionUrl('https://gw.example.com/r/grizzly/')).toBe('https://gw.example.com/r/grizzly/send');
  });
});

describe('Groundwork contract', () => {
  it('uses the field names Groundwork parses', () => {
    expect(GROUNDWORK_FIELDS).toMatchObject({
      name: 'name', phone: 'phone', email: 'email', address: 'address', service: 'service',
      message: 'message', preferredDates: 'preferred_dates', photos: 'photos', honeypot: 'website',
    });
  });
  it('mirrors its documented limits', () => {
    expect(GROUNDWORK_LIMITS).toEqual({ maxPhotos: 3, maxPhotoMb: 5, ratePerHour: 5 });
  });
});

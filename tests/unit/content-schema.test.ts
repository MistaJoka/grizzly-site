import { describe, expect, it } from 'vitest';
import { areaSchema, projectSchema, serviceSchema, testimonialSchema } from '../../src/lib/schemas';

const validArea = {
  town: 'Miami',
  state: 'FL',
  order: 1,
  headline: 'Lawn care in Miami, FL',
  summary: 'Lawn maintenance, trimming and installs for Miami properties.',
  localNote:
    'Miami properties deal with heat, humidity and heavy summer rain for much of the year, which means turf and hedges grow fast and need steady upkeep. Soil sits over limestone, so planting beds and new trees need to be set and watered with that in mind.',
  neighborhoods: ['Coconut Grove', 'Little Havana', 'Brickell'],
  services: ['lawn-maintenance', 'tree-plant-installation'],
};

describe('areaSchema', () => {
  it('accepts a fully specified area', () => {
    expect(() => areaSchema.parse(validArea)).not.toThrow();
  });
  it('rejects a localNote shorter than 200 characters', () => {
    expect(() => areaSchema.parse({ ...validArea, localNote: 'We serve Miami.' })).toThrow();
  });
  it('rejects fewer than three neighborhoods', () => {
    expect(() => areaSchema.parse({ ...validArea, neighborhoods: ['Brickell'] })).toThrow();
  });
});

describe('serviceSchema', () => {
  const validService = {
    title: 'Pressure Washing',
    order: 1,
    summary: 'Pressure washing for walkways and driveways.',
    heroImage: '/images/services/pressure-washing.jpg',
    heroAlt: 'A pressure washer cleaning a walkway.',
    steps: [
      { title: 'Describe it', body: 'Tell us which surfaces need cleaning and how large they are.' },
      { title: 'Get a quote', body: 'Alex prices the work from your description before it starts.' },
      { title: 'Wash', body: 'Surfaces are washed and the area is left clean when done.' },
    ],
    faqs: [{ question: 'What surfaces?', answer: 'Describe the surface in your request.' }],
  };
  it('accepts a fully specified service', () => {
    expect(() => serviceSchema.parse(validService)).not.toThrow();
  });
  it('has no price field: prices are not published until Alex supplies them', () => {
    expect(Object.keys(serviceSchema.shape)).not.toContain('startingPrice');
  });
  it('requires at least three process steps', () => {
    expect(() => serviceSchema.parse({ ...validService, steps: validService.steps.slice(0, 2) })).toThrow();
  });
  it('requires alt text on the hero image', () => {
    expect(() => serviceSchema.parse({ ...validService, heroAlt: '' })).toThrow();
  });
});

describe('projectSchema', () => {
  const textOnly = {
    title: '40-Tree Installation',
    order: 1,
    service: 'tree-plant-installation',
    summary: 'A single-project installation of 40 trees in 25-gallon containers.',
    scope: ['40 trees in 25-gallon containers', 'Installed as one project'],
  };
  it('accepts a text-only project (photos are optional)', () => {
    expect(() => projectSchema.parse(textOnly)).not.toThrow();
  });
  it('requires alt text whenever a photo is supplied', () => {
    expect(() => projectSchema.parse({ ...textOnly, afterImage: '/images/work/a.jpg' })).toThrow();
    expect(() => projectSchema.parse({ ...textOnly, afterImage: '/images/work/a.jpg', afterAlt: 'Trees in a row.' })).not.toThrow();
  });
});

describe('testimonialSchema', () => {
  const real = { quote: 'Great work.', attribution: 'A. Customer', town: 'Miami', order: 1, source: 'Google review, 2026-11-01', permission: true };
  it('accepts a sourced, permissioned testimonial', () => {
    expect(() => testimonialSchema.parse(real)).not.toThrow();
  });
  it('rejects one without a source or without permission', () => {
    const { source, ...noSource } = real;
    expect(() => testimonialSchema.parse(noSource)).toThrow();
    expect(() => testimonialSchema.parse({ ...real, permission: false })).toThrow();
  });
});

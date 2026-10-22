import { z } from 'astro/zod';

export const serviceSchema = z.object({
  title: z.string().min(1),
  order: z.number().int(),
  summary: z.string().min(20),
  heroImage: z.string().min(1),
  heroAlt: z.string().min(1),
  steps: z.array(z.object({ title: z.string().min(1), body: z.string().min(20) })).min(3),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
});

export const areaSchema = z.object({
  town: z.string().min(1),
  state: z.string().length(2),
  order: z.number().int(),
  headline: z.string().min(1),
  summary: z.string().min(20),
  localNote: z.string().min(200),
  neighborhoods: z.array(z.string().min(1)).min(3),
  services: z.array(z.string().min(1)).min(1),
});

// Only facts Alex confirmed. Photos are optional: a project without photos renders text only.
export const projectSchema = z
  .object({
    title: z.string().min(1),
    order: z.number().int(),
    town: z.string().optional(),
    year: z.number().int().optional(),
    service: z.string().min(1),
    summary: z.string().min(20),
    beforeImage: z.string().optional(),
    beforeAlt: z.string().optional(),
    afterImage: z.string().optional(),
    afterAlt: z.string().optional(),
    scope: z.array(z.string().min(1)).min(2),
  })
  .refine((p) => !p.beforeImage || Boolean(p.beforeAlt), { message: 'beforeImage needs beforeAlt', path: ['beforeAlt'] })
  .refine((p) => !p.afterImage || Boolean(p.afterAlt), { message: 'afterImage needs afterAlt', path: ['afterAlt'] });

// Real, permissioned reviews only. `source` (where it was said) and `permission: true` are
// mandatory so a made-up quote cannot slip in by accident. The folder ships empty.
export const testimonialSchema = z.object({
  quote: z.string().min(1),
  attribution: z.string().min(1),
  town: z.string().min(1),
  order: z.number().int(),
  source: z.string().min(3),
  permission: z.literal(true),
});

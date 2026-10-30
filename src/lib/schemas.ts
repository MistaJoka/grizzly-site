import { z } from 'astro/zod';

export const serviceSchema = z.object({
  title: z.string().min(1),
  order: z.number().int(),
  summary: z.string().min(20),
  heroImage: z.string().min(1),
  heroAlt: z.string().min(1),
  steps: z.array(z.object({ title: z.string().min(1), body: z.string().min(20) })).min(3),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
  /** Optional overrides for the <title> (before the site template) and meta description. */
  seoTitle: z.string().min(1).optional(),
  seoDescription: z.string().min(1).optional(),
});

// A service-in-town landing page. One file per pair, named `<service>--<area>.md`, and the page is
// built ONLY when the file exists. The 300-character floor and the two-FAQ minimum keep these from
// becoming templated doorway pages: every entry has to say something true about that pair.
export const localSchema = z.object({
  service: z.string().min(1),
  area: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(20),
  localNote: z.string().min(300),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(2),
  seoTitle: z.string().min(1).optional(),
  seoDescription: z.string().min(1).optional(),
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
  seoTitle: z.string().min(1).optional(),
  seoDescription: z.string().min(1).optional(),
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

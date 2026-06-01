import { z } from "zod"

export const LinkSchema = z.object({
  href: z.string().max(2048),
  text: z.string().max(512),
  visibleDomain: z.string().max(256).optional()
})

export const AttachmentSchema = z.object({
  name: z.string().max(256),
  extension: z.string().max(16),
  size: z.number().nonnegative().optional()
})

export const RawEmailDomSchema = z.object({
  platform: z.enum(["gmail", "outlook"]),
  id: z.string().min(1).max(512),
  sender: z.string().max(512),
  replyTo: z.string().max(512).optional(),
  subject: z.string().max(1024),
  bodyText: z.string().max(200_000),
  links: z.array(LinkSchema).max(100),
  attachments: z.array(AttachmentSchema).max(50),
  headers: z.record(z.string().max(4096)).optional()
})

export type ValidatedRawEmailDom = z.infer<typeof RawEmailDomSchema>

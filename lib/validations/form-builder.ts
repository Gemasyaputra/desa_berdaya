import { z } from 'zod'

export const customFieldSchema = z.object({
  id: z.number().optional(),
  category_id: z.number().optional(),
  field_name: z.string().min(1, 'Nama field wajib diisi'),
  field_label: z.string().min(1, 'Label field wajib diisi'),
  field_type: z.enum(['text', 'number', 'date', 'url', 'textarea'], {
    required_error: 'Tipe field wajib dipilih',
  }),
  is_required: z.boolean().default(false),
  order_index: z.number().int().nonnegative().default(0),
})

export const formCategoryBaseSchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
})

export const formCategoryWithFieldsSchema = formCategoryBaseSchema.extend({
  fields: z.array(customFieldSchema),
})

export type CustomFieldInput = z.infer<typeof customFieldSchema>
export type FormCategoryInput = z.infer<typeof formCategoryBaseSchema>
export type FormCategoryWithFieldsInput = z.infer<typeof formCategoryWithFieldsSchema>


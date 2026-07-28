import React, {useCallback, useEffect, useId, useState} from 'react'
import {StringInputProps, set, unset} from 'sanity'
import {Box, Card, Flex, Select, Spinner, Stack, Text} from '@sanity/ui'
import {fetchActiveProducts, LmsProduct} from '../lib/supabase'

/**
 * ProductSelectorInput
 * ─────────────────────
 * Custom string input that replaces the plain text field for `productUuid`
 * inside the `courseDetails` document type.
 *
 * Behaviour:
 *  - On mount, fetches all active products from public.products via Supabase.
 *  - Renders a <Select> (native HTML select, styled by @sanity/ui) showing
 *    each product's title. If a thumbnail_url is available it is shown as a
 *    small avatar beside the title using an <img> tag (no Next.js Image here
 *    since this runs inside Sanity Studio, not the Next.js app).
 *  - On selection, stores ONLY the product_uuid in the Sanity field value.
 *  - Shows loading / error / empty states gracefully.
 */
export function ProductSelectorInput(props: StringInputProps) {
  const {onChange, value, readOnly} = props

  const [products, setProducts] = useState<LmsProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const uid = useId()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchActiveProducts()
      .then((rows) => {
        if (!cancelled) {
          setProducts(rows)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load products')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.currentTarget.value
      onChange(selected ? set(selected) : unset())
    },
    [onChange],
  )

  /* ── Loading state ── */
  if (loading) {
    return (
      <Card padding={3} radius={2} tone="transparent">
        <Flex align="center" gap={3}>
          <Spinner muted />
          <Text muted size={1}>
            Loading products from Learning Portal…
          </Text>
        </Flex>
      </Card>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <Card padding={3} radius={2} tone="caution">
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Could not load products
          </Text>
          <Text muted size={1}>
            {error}
          </Text>
          <Text muted size={1}>
            Make sure SANITY_STUDIO_SUPABASE_URL and SANITY_STUDIO_SUPABASE_ANON_KEY are set.
          </Text>
        </Stack>
      </Card>
    )
  }

  /* ── Empty state ── */
  if (products.length === 0) {
    return (
      <Card padding={3} radius={2} tone="transparent">
        <Text muted size={1}>
          No active products found in the Learning Portal.
        </Text>
      </Card>
    )
  }

  /* ── Selected product preview ── */
  const selectedProduct = products.find((p) => p.product_uuid === value) ?? null

  return (
    <Stack space={3}>
      {/* Dropdown */}
      <Select
        id={uid}
        value={value ?? ''}
        onChange={handleChange}
        disabled={readOnly}
        fontSize={2}
        padding={3}
        radius={2}
      >
        <option value="">— Select a product —</option>
        {products.map((product) => (
          <option key={product.product_uuid} value={product.product_uuid}>
            {product.title}
          </option>
        ))}
      </Select>

      {/* Selected product preview card */}
      {selectedProduct && (
        <Card padding={3} radius={2} shadow={1}>
          <Flex align="center" gap={3}>
            {selectedProduct.thumbnail_url && (
              /* Plain <img> — this runs in Studio, not the Next.js app */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedProduct.thumbnail_url}
                alt={selectedProduct.title}
                style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              />
            )}
            <Box>
              <Text size={2} weight="semibold">
                {selectedProduct.title}
              </Text>
              <Text muted size={1} style={{marginTop: 4}}>
                UUID: {selectedProduct.product_uuid}
              </Text>
            </Box>
          </Flex>
        </Card>
      )}
    </Stack>
  )
}

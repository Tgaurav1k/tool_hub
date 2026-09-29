import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Button, Input } from '@toolhub/ui'
import { C } from '@toolhub/config'
import { toolsApi, categoriesApi } from '@toolhub/api-client'
import type { Tool } from '@toolhub/api-client'

interface Props {
  open: boolean
  onClose: () => void
  tool: Tool | null
  defaultCategoryId: string
}

export default function ToolForm({ open, onClose, tool, defaultCategoryId }: Props) {
  const queryClient = useQueryClient()

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    enabled: open,
  })

  const apiCategories = useMemo(() => {
    const list = categoriesRes?.categories ?? []
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [categoriesRes?.categories])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [status, setStatus] = useState<'active' | 'inactive' | 'new'>('active')
  const [slug, setSlug] = useState('')
  const [requiresToolAssignment, setRequiresToolAssignment] = useState(true)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (tool) {
      setName(tool.name)
      setDescription(tool.description)
      setUrl(tool.url)
      setIcon(tool.icon)
      setCategoryId(tool.categoryId)
      setStatus(tool.status)
      setSlug(tool.slug ?? '')
      setRequiresToolAssignment(Boolean(tool.requiresToolAssignment))
    } else {
      setName('')
      setDescription('')
      setUrl('')
      setIcon('')
      setCategoryId(defaultCategoryId || apiCategories[0]?.id || '')
      setStatus('active')
      setSlug('')
      // New tools default to "requires assignment" so they match the existing tools.
      setRequiresToolAssignment(true)
    }
    setError('')
    setConfirmDelete(false)
  }, [tool, open, defaultCategoryId, apiCategories])

  const formatError = (err: unknown) => {
    const e = err as Error & { details?: { field: string; message: string }[] }
    if (e.details?.length) {
      return e.details.map((d) => `${d.field}: ${d.message}`).join('. ')
    }
    return e.message || 'Something went wrong'
  }

  const invalidateToolCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['tools'] })
    queryClient.invalidateQueries({ queryKey: ['assigned-tools'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      toolsApi.createTool({
        name,
        description,
        url,
        icon: icon || undefined,
        categoryId,
        status,
        // Blank slug -> backend auto-generates it from the name.
        slug: slug.trim() || undefined,
        requiresToolAssignment,
      }),
    onSuccess: () => {
      invalidateToolCaches()
      onClose()
    },
    onError: (err: unknown) => setError(formatError(err)),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      toolsApi.updateTool(tool!.id, {
        name,
        description,
        url,
        icon: icon || undefined,
        categoryId,
        status,
        // Blank slug -> backend regenerates it from the name.
        slug: slug.trim() || null,
        requiresToolAssignment,
      }),
    onSuccess: () => {
      invalidateToolCaches()
      onClose()
    },
    onError: (err: unknown) => setError(formatError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => toolsApi.deleteTool(tool!.id),
    onSuccess: () => {
      invalidateToolCaches()
      setConfirmDelete(false)
      onClose()
    },
    onError: (err: unknown) => setError(formatError(err)),
  })

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handleSubmit = () => {
    if (tool) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${C.sand200}`,
    background: C.cardBg,
    color: C.coffee800,
    fontSize: 14,
    outline: 'none',
  } as const

  return (
    <Modal open={open} onClose={onClose} title={tool ? 'Edit Tool' : 'Add Tool'} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#FDF0F0', color: C.danger, padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tool name"
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
        />

        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />

        <Input
          label="Icon (optional)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Lucide icon name (e.g. DollarSign) — defaults to Wrench"
        />

        <Input
          label="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Leave blank to auto-generate from the name (e.g. blog-writer)"
        />

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.coffee800, marginBottom: 6, display: 'block' }}>
            Category
          </label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={selectStyle}>
            {apiCategories.filter((c) => c.name !== 'Favorites').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.coffee800, marginBottom: 6, display: 'block' }}>
            Status
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'new')} style={selectStyle}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="new">New</option>
          </select>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            cursor: 'pointer',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${C.sand200}`,
            background: C.cardBg,
          }}
        >
          <input
            type="checkbox"
            checked={requiresToolAssignment}
            onChange={(e) => setRequiresToolAssignment(e.target.checked)}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: C.coffee800, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: C.coffee800 }}>
            <span style={{ fontWeight: 600 }}>Requires tool assignment</span>
            <br />
            <span style={{ fontSize: 12, color: C.sand700 }}>
              When on, users need an explicit per-tool assignment to see and launch this tool — not just
              category access.
            </span>
          </span>
        </label>

        {tool && confirmDelete && (
          <div
            style={{
              background: '#FDF0F0',
              color: C.danger,
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span>
              Delete <strong>{tool.name}</strong>? This cannot be undone.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
              >
                No
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                disabled={isPending}
                style={{ background: C.danger, borderColor: C.danger }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </Button>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
          }}
        >
          {tool ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending || confirmDelete}
              style={{
                background: 'transparent',
                borderColor: C.danger,
                color: C.danger,
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!name || !url || !categoryId || isPending}
            >
              {isPending ? 'Saving...' : tool ? 'Save Changes' : 'Add Tool'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

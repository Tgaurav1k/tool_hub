import { Modal, Button } from '@toolhub/ui'
import { C } from '@toolhub/config'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

export default function ConfirmDeleteModal({ open, onClose, onConfirm, title, message }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#FDF0F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={28} color={C.danger} />
        </div>

        <p style={{ color: C.coffee800, fontSize: 14, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{ background: C.danger, borderColor: C.danger }}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

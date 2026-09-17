import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '@/components/common/ConfirmModal'

describe('ConfirmModal', () => {
  const onClose = vi.fn()
  const onConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(
      <ConfirmModal open={false} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" />
    )
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument()
  })

  it('renders title and message when open', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" />
    )
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders details when provided', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" details="This cannot be undone" />
    )
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" />
    )
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" />
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses custom confirm and cancel labels', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?"
        confirmLabel="Yes, delete" cancelLabel="No, keep" />
    )
    expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument()
    expect(screen.getByText('No, keep')).toBeInTheDocument()
  })

  it('disables buttons when loading', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" loading={true} />
    )
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })

  it('shows spinner when loading', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" loading={true} />
    )
    expect(screen.getByText('Processing…')).toBeInTheDocument()
  })

  it('renders danger variant with correct button class', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Delete?" message="Are you sure?" variant="danger" />
    )
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    expect(confirmBtn.className).toContain('btn-danger')
  })

  it('renders warning variant with primary button', () => {
    render(
      <ConfirmModal open={true} onClose={onClose} onConfirm={onConfirm}
        title="Warning" message="Be careful" variant="warning" />
    )
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    expect(confirmBtn.className).toContain('btn-primary')
  })
})

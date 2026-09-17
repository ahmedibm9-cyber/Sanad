import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '@/components/common/Modal'

describe('Modal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={onClose}>Content</Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    render(<Modal open={true} onClose={onClose}>Modal body</Modal>)
    expect(screen.getByText('Modal body')).toBeInTheDocument()
  })

  it('renders title and subtitle', () => {
    render(
      <Modal open={true} onClose={onClose} title="My Title" subtitle="My Subtitle">
        Content
      </Modal>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
    expect(screen.getByText('My Subtitle')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(
      <Modal open={true} onClose={onClose} footer={<button>Save</button>}>
        Content
      </Modal>
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<Modal open={true} onClose={onClose}>Content</Modal>)
    const backdrop = document.querySelector('.backdrop')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape key', () => {
    render(<Modal open={true} onClose={onClose}>Content</Modal>)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has correct aria attributes', () => {
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('applies size class', () => {
    const { rerender } = render(
      <Modal open={true} onClose={onClose} size="sm">Content</Modal>
    )
    expect(screen.getByRole('dialog').querySelector('.modal-panel')).toHaveClass('max-w-md')

    rerender(<Modal open={true} onClose={onClose} size="xl">Content</Modal>)
    expect(screen.getByRole('dialog').querySelector('.modal-panel')).toHaveClass('max-w-4xl')
  })

  it('sets body overflow to hidden when open', () => {
    render(<Modal open={true} onClose={onClose}>Content</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
  })
})

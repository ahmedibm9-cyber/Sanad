import { render, screen } from '@testing-library/react'
import EmptyState from '@/components/common/EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No data found" />)
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <EmptyState title="No data" description="Add something to get started" />
    )
    expect(screen.getByText('Add something to get started')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<EmptyState title="Empty" />)
    expect(screen.queryByText(/add something/i)).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState title="Empty" icon={<span data-testid="icon">📦</span>} />
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('does not render icon container when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.querySelector('.mb-3')).not.toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState title="Empty" action={<button>Add Item</button>} />
    )
    expect(screen.getByText('Add Item')).toBeInTheDocument()
  })

  it('renders without action when not provided', () => {
    render(<EmptyState title="Empty" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

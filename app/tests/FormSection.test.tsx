import { render, screen, fireEvent } from '@testing-library/react'
import FormSection from '@/components/common/FormSection'

describe('FormSection', () => {
  it('renders the title', () => {
    render(<FormSection title="Basic Info">Content</FormSection>)
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <FormSection title="Basic Info" subtitle="Optional details">
        Content
      </FormSection>
    )
    expect(screen.getByText('Optional details')).toBeInTheDocument()
  })

  it('renders children when defaultOpen is true', () => {
    render(<FormSection title="Section">Child content</FormSection>)
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('hides children when defaultOpen is false', () => {
    render(
      <FormSection title="Section" defaultOpen={false}>
        Hidden content
      </FormSection>
    )
    const button = screen.getByRole('button', { expanded: false })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    const contentWrapper = screen.getByText('Hidden content').closest('[class*="max-h-0"]')
    expect(contentWrapper).toBeInTheDocument()
  })

  it('toggles open/closed when header button is clicked', () => {
    render(<FormSection title="Section">Content</FormSection>)
    const button = screen.getByRole('button', { expanded: true })
    expect(screen.getByText('Content')).toBeVisible()

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('starts collapsed when defaultOpen is false then expands', () => {
    render(
      <FormSection title="Section" defaultOpen={false}>
        Content
      </FormSection>
    )
    const button = screen.getByRole('button', { expanded: false })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('uses titleAr as subtitle fallback when subtitle is not provided', () => {
    render(
      <FormSection title="Info" titleAr="معلومات">Content</FormSection>
    )
    expect(screen.getByText('معلومات')).toBeInTheDocument()
  })
})

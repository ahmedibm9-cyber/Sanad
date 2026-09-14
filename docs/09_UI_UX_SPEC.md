# SANAD — UI/UX Specification

## 1. Direction

Professional, clean, minimal, enterprise-like.

Avoid:
- crowded single screens
- too many colored cards
- excessive modals
- hidden important actions
- giant Settings page with every control mixed together

## 2. Application shell

Recommended:
- fixed primary sidebar on desktop
- top bar with global search
- active company switcher
- notification access
- user/profile menu
- language switcher

Arabic flips appropriate directional layout.

## 3. Navigation modules

Suggested primary navigation:
- Dashboard
- Projects
- Tasks
- To-dos
- Customers
- Materials
- Factory Code
- Reports
- Activity
- Trash
- Settings

Documents are primarily accessed within Task/Project, not as a disconnected primary workflow. A global Documents Register may exist under Reports or a secondary navigation path.

## 4. Dashboard

Keep concise.

Suggested widgets:
- In Progress Projects
- In Progress Tasks
- Completed recently
- Report Issues open
- Documents created recently
- Overdue Tasks
- Personal To-dos
- Recent Activity

Each relevant widget includes an external-link/redirect-style action to its destination.

## 5. Projects list

- search
- multi-select status filter
- customer filter
- date filter
- pinned items first
- clear project name
- customer
- status
- last updated
- key actions

Archived group at bottom, collapsible.

## 6. Project page

Recommended tabs/sections:
- Overview
- Data
- Materials
- Documents
- Attachments
- Notes & Issues
- Activity

Do not hide critical actions.

Primary document actions:
- Invoice dropdown
- Packing List
- Delivery Note
- Bill of Lading

## 7. Task page

Same major capabilities as Project.

Action:
- Convert to Project

## 8. Forms

- clear labels
- validation near field
- logical sections
- sticky save/action footer only where helpful
- searchable selects for customer/material
- voice input button near text fields where implemented

## 9. Confirmation modal

Use only for consequential actions.

Should state:
- what will change
- what will be affected
- whether reversible
- clear primary action
- clear cancel

Shared-data propagation modal must show affected documents as checklist.

## 10. Permissions screen

GitHub-token-style checklist.

Group permissions:
- Projects
- Tasks
- Documents
- Customers
- Materials
- Files
- Users
- Reports
- Activity
- Trash
- Settings
- Factory Code
- Backup

Critical permissions visually marked.

## 11. Settings

Tabs/categories, not a single page.

## 12. Search

Global:
- categorized result groups
- result type shown
- company context shown

Module:
- only searches current module

## 13. Accessibility

- keyboard reachable controls
- proper focus
- contrast
- labels
- avoid color-only status indication

'use client'

import React, { useState } from 'react'
import type { RowData } from '@tanstack/react-table'
import type { UseTableReturn } from '../src/types'

// ─── Types ────────────────────────────────────────────────

export type DevtoolsPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

export interface TablecraftDevtoolsProps<TData extends RowData> {
  /** Full return value from useTable / useQueryTable */
  tableReturn: UseTableReturn<TData>
  /** Corner position — default 'bottom-right' */
  position?: DevtoolsPosition
  /** Start open or collapsed — default false */
  defaultOpen?: boolean
}

// ─── Styles ───────────────────────────────────────────────

const colors = {
  bg: '#1a1a2e',
  bgSection: '#16213e',
  bgHover: '#0f3460',
  text: '#e0e0e0',
  textMuted: '#8892a4',
  accent: '#e94560',
  accentAlt: '#0ea5e9',
  border: '#2a2a4a',
  badge: '#533483',
  green: '#22c55e',
  yellow: '#eab308',
}

const font = "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace"

function getPositionStyles(position: DevtoolsPosition): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 99999 }
  switch (position) {
    case 'bottom-right': return { ...base, bottom: 12, right: 12 }
    case 'bottom-left':  return { ...base, bottom: 12, left: 12 }
    case 'top-right':    return { ...base, top: 12, right: 12 }
    case 'top-left':     return { ...base, top: 12, left: 12 }
  }
}

// ─── Sub-components ───────────────────────────────────────

function Badge({ children, color = colors.badge }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: font,
        backgroundColor: color,
        color: colors.text,
        marginLeft: 6,
      }}
    >
      {children}
    </span>
  )
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: colors.accentAlt, fontFamily: font, fontSize: 12 }}>
      {children}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ color: colors.textMuted, fontSize: 12 }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}

function Section({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} style={{ marginBottom: 2 }}>
      <summary
        style={{
          cursor: 'pointer',
          padding: '6px 10px',
          backgroundColor: colors.bgSection,
          borderBottom: `1px solid ${colors.border}`,
          fontSize: 12,
          fontWeight: 600,
          color: colors.text,
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span style={{ marginRight: 6, fontSize: 10 }}>&#9654;</span>
        {title}
        {badge}
      </summary>
      <div style={{ padding: '6px 10px' }}>
        {children}
      </div>
    </details>
  )
}

// ─── Main component ───────────────────────────────────────

export function TablecraftDevtools<TData extends RowData>({
  tableReturn,
  position = 'bottom-right',
  defaultOpen = false,
}: TablecraftDevtoolsProps<TData>) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const { table, pagination, sorting, globalFilter, columnFilters, rowSelection, columnVisibility, emptyState } = tableReturn

  const posStyles = getPositionStyles(position)
  const totalRows = table.getPrePaginationRowModel().rows.length
  const visibleRows = table.getRowModel().rows.length
  const columnCount = table.getAllColumns().length
  const visibleColumnCount = table.getVisibleLeafColumns().length

  // ─── Collapsed: floating button ─────────────────────────
  if (!isOpen) {
    return (
      <button
        data-testid="tablecraft-devtools-button"
        onClick={() => setIsOpen(true)}
        style={{
          ...posStyles,
          width: 40,
          height: 40,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          color: colors.accent,
          fontWeight: 700,
          fontSize: 14,
          fontFamily: font,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
        title="Open Tablecraft Devtools"
      >
        TC
      </button>
    )
  }

  // ─── Expanded: devtools panel ───────────────────────────
  return (
    <div
      data-testid="tablecraft-devtools-panel"
      style={{
        ...posStyles,
        width: 320,
        maxHeight: '70vh',
        overflowY: 'auto',
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: font,
        fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSection,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: colors.accent }}>
          Tablecraft Devtools
        </span>
        <button
          data-testid="tablecraft-devtools-close"
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Close"
        >
          &#10005;
        </button>
      </div>

      {/* Table Info */}
      <Section title="Table" badge={<Badge>{visibleRows}/{totalRows} rows</Badge>}>
        <Row label="Total rows"><Value>{totalRows}</Value></Row>
        <Row label="Visible rows"><Value>{visibleRows}</Value></Row>
        <Row label="Columns"><Value>{visibleColumnCount}/{columnCount}</Value></Row>
      </Section>

      {/* Pagination */}
      <Section title="Pagination" badge={<Badge>page {pagination.pageIndex + 1}</Badge>}>
        <Row label="Page"><Value>{pagination.pageIndex + 1} / {pagination.pageCount}</Value></Row>
        <Row label="Page size"><Value>{pagination.pageSize}</Value></Row>
        <Row label="Can prev"><Value>{pagination.canPreviousPage ? 'yes' : 'no'}</Value></Row>
        <Row label="Can next"><Value>{pagination.canNextPage ? 'yes' : 'no'}</Value></Row>
      </Section>

      {/* Sorting */}
      <Section
        title="Sorting"
        badge={
          sorting.sortingState.length > 0
            ? <Badge color={colors.accentAlt}>{sorting.sortingState.length} active</Badge>
            : <Badge color={colors.border}>none</Badge>
        }
      >
        {sorting.sortingState.length === 0 ? (
          <span style={{ color: colors.textMuted, fontSize: 11 }}>No active sorting</span>
        ) : (
          sorting.sortingState.map((s) => (
            <Row key={s.id} label={s.id}>
              <Value>{s.desc ? 'desc' : 'asc'}</Value>
            </Row>
          ))
        )}
      </Section>

      {/* Global Filter */}
      <Section
        title="Global Filter"
        badge={
          globalFilter.value
            ? <Badge color={colors.accentAlt}>active</Badge>
            : <Badge color={colors.border}>none</Badge>
        }
      >
        <Row label="Value">
          <Value>{globalFilter.value || <span style={{ color: colors.textMuted }}>empty</span>}</Value>
        </Row>
      </Section>

      {/* Column Filters */}
      <Section
        title="Column Filters"
        badge={
          columnFilters.state.length > 0
            ? <Badge color={colors.accentAlt}>{columnFilters.state.length} active</Badge>
            : <Badge color={colors.border}>none</Badge>
        }
        defaultOpen={columnFilters.state.length > 0}
      >
        {columnFilters.state.length === 0 ? (
          <span style={{ color: colors.textMuted, fontSize: 11 }}>No active filters</span>
        ) : (
          columnFilters.state.map((f) => (
            <Row key={f.id} label={f.id}>
              <Value>{String(f.value)}</Value>
            </Row>
          ))
        )}
      </Section>

      {/* Row Selection */}
      <Section
        title="Row Selection"
        badge={
          rowSelection.selectedCount > 0
            ? <Badge color={colors.green}>{rowSelection.selectedCount} selected</Badge>
            : <Badge color={colors.border}>none</Badge>
        }
        defaultOpen={rowSelection.selectedCount > 0}
      >
        {rowSelection.selectedCount === 0 ? (
          <span style={{ color: colors.textMuted, fontSize: 11 }}>No rows selected</span>
        ) : (
          <Row label="IDs">
            <Value>{rowSelection.selectedRowIds.join(', ')}</Value>
          </Row>
        )}
      </Section>

      {/* Column Visibility */}
      <Section
        title="Column Visibility"
        badge={
          columnVisibility.hiddenColumns.length > 0
            ? <Badge color={colors.yellow}>{columnVisibility.hiddenColumns.length} hidden</Badge>
            : <Badge color={colors.border}>all visible</Badge>
        }
        defaultOpen={columnVisibility.hiddenColumns.length > 0}
      >
        {columnVisibility.hiddenColumns.length === 0 ? (
          <span style={{ color: colors.textMuted, fontSize: 11 }}>All columns visible</span>
        ) : (
          columnVisibility.hiddenColumns.map((col) => (
            <Row key={col} label={col}>
              <Value>hidden</Value>
            </Row>
          ))
        )}
      </Section>

      {/* Empty State */}
      <Section title="Empty State">
        <Row label="isEmpty">
          <Value>{emptyState.isEmpty ? 'true' : 'false'}</Value>
        </Row>
        <Row label="isFilteredEmpty">
          <Value>{emptyState.isFilteredEmpty ? 'true' : 'false'}</Value>
        </Row>
      </Section>
    </div>
  )
}

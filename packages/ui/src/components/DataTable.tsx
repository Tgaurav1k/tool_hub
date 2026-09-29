import React from 'react'
import { C, shadows, glass } from '@toolhub/config'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  return (
    <div
      style={{
        background: glass.background,
        backdropFilter: glass.blur,
        border: glass.border,
        borderRadius: glass.borderRadius,
        overflow: 'hidden',
        boxShadow: shadows.sm,
      }}
    >
      <div className="tb-datatable-wrap" style={{ overflowX: 'auto' }}>
        <table className="tb-datatable" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.sand100}` }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: C.sand600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: C.sand300,
                    fontSize: '14px',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  style={{
                    borderBottom: `1px solid ${C.sand50}`,
                    cursor: onRowClick ? 'pointer' : undefined,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) e.currentTarget.style.background = C.sand50
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: C.coffee800,
                      }}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import type { ConversionHistoryEntry } from '../hooks/useConversionHistory'

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[]
  onClear: () => void
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 6,
  }).format(value)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatRateDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`))
}

function ConversionHistory({ history, onClear }: ConversionHistoryProps) {
  const handleClear = () => {
    if (window.confirm('Clear all conversion history?')) {
      onClear()
    }
  }

  return (
    <Card className="history-card">
      <Card.Body>
        <div className="history-heading">
          <div>
            <span className="section-label">Recent activity</span>
            <h2>Conversion history</h2>
          </div>
          {history.length > 0 && (
            <Button
              type="button"
              variant="link"
              className="clear-history"
              onClick={handleClear}
            >
              Clear history
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-history">
            <span className="empty-history-icon" aria-hidden="true">
              ↗
            </span>
            <strong>No conversions yet</strong>
            <p>Your successful conversions will appear here.</p>
          </div>
        ) : (
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.id} className="history-item">
                <div className="currency-pair" aria-hidden="true">
                  <span>{entry.from.slice(0, 1)}</span>
                  <small>→</small>
                  <span>{entry.to.slice(0, 1)}</span>
                </div>
                <div className="history-details">
                  <strong>
                    {entry.from} → {entry.to}
                  </strong>
                  <span>{formatDate(entry.createdAt)}</span>
                  <small
                    className={
                      entry.rateDate ? 'rate-label historical' : 'rate-label'
                    }
                  >
                    {entry.rateDate
                      ? `Historical · ${formatRateDate(entry.rateDate)}`
                      : 'Latest rate'}
                  </small>
                </div>
                <div className="history-values">
                  <strong>
                    {formatAmount(entry.convertedAmount, entry.to)}
                  </strong>
                  <span>{formatAmount(entry.amount, entry.from)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  )
}

export default ConversionHistory

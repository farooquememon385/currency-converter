import Form from 'react-bootstrap/Form'
import type { Currency } from '../api/currency'

interface CurrencySelectProps {
  currencies: Currency[]
  id: string
  label: string
  value: string
  disabled?: boolean
  onChange: (currency: string) => void
}

function CurrencySelect({
  currencies,
  id,
  label,
  value,
  disabled = false,
  onChange,
}: CurrencySelectProps) {
  return (
    <Form.Group controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )
}

export default CurrencySelect

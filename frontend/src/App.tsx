import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import {
  getCurrencies,
  getHistoricalRate,
  getLatestRate,
  type Currency,
} from './api/currency'
import ConversionHistory from './components/ConversionHistory'
import CurrencySelect from './components/CurrencySelect'
import { useConversionHistory } from './hooks/useConversionHistory'

interface ConversionResult {
  amount: number
  convertedAmount: number
  from: string
  rate: number
  rateDate?: string
  to: string
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDefaultHistoricalDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return toDateInputValue(yesterday)
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 6,
  }).format(value)
}

function App() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [useHistoricalRate, setUseHistoricalRate] = useState(false)
  const [rateDate, setRateDate] = useState(getDefaultHistoricalDate)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const { history, addConversion, clearHistory } = useConversionHistory()

  useEffect(() => {
    const controller = new AbortController()

    getCurrencies(controller.signal)
      .then((supportedCurrencies) => {
        setCurrencies(supportedCurrencies)
        setFromCurrency(
          supportedCurrencies.some(({ code }) => code === 'USD')
            ? 'USD'
            : (supportedCurrencies[0]?.code ?? ''),
        )
        setToCurrency(
          supportedCurrencies.some(({ code }) => code === 'EUR')
            ? 'EUR'
            : (supportedCurrencies[1]?.code ??
                supportedCurrencies[0]?.code ??
                ''),
        )
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== 'AbortError') {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingCurrencies(false)
        }
      })

    return () => controller.abort()
  }, [])

  const selectedFrom = useMemo(
    () => currencies.find(({ code }) => code === fromCurrency),
    [currencies, fromCurrency],
  )

  const handleConvert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.')
      setResult(null)
      return
    }

    if (useHistoricalRate && !rateDate) {
      setError('Select a date for the historical exchange rate.')
      setResult(null)
      return
    }

    setError('')
    setConverting(true)

    try {
      const rate =
        fromCurrency === toCurrency
          ? 1
          : useHistoricalRate
            ? await getHistoricalRate(rateDate, fromCurrency, toCurrency)
            : await getLatestRate(fromCurrency, toCurrency)
      const conversionResult: ConversionResult = {
        amount: numericAmount,
        convertedAmount: numericAmount * rate,
        from: fromCurrency,
        rate,
        rateDate: useHistoricalRate ? rateDate : undefined,
        to: toCurrency,
      }

      setResult(conversionResult)
      addConversion(conversionResult)
    } catch (requestError: unknown) {
      setResult(null)
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Conversion failed. Please try again.',
      )
    } finally {
      setConverting(false)
    }
  }

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setResult(null)
    setError('')
  }

  const handleSelectionChange = (
    setter: (currency: string) => void,
    currency: string,
  ) => {
    setter(currency)
    setResult(null)
    setError('')
  }

  return (
    <main className="app-shell">
      <Container className="converter-container">
        <header className="page-header">
          <Badge pill bg="light" text="primary" className="eyebrow">
            Live exchange rates
          </Badge>
          <h1>Convert money in seconds.</h1>
          <p>
            Choose from currencies around the world and get the latest rate.
          </p>
        </header>

        <Card className="converter-card">
          <Card.Body>
            <div className="card-heading">
              <div>
                <span className="section-label">Currency converter</span>
                <h2>How much do you want to convert?</h2>
              </div>
              <span className="secure-note">
                <span className="status-dot" aria-hidden="true" />
                Rates online
              </span>
            </div>

            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {loadingCurrencies ? (
              <div className="loading-state" role="status">
                <Spinner animation="border" variant="primary" />
                <span>Loading supported currencies…</span>
              </div>
            ) : (
              <Form onSubmit={handleConvert}>
                <Form.Group controlId="amount" className="amount-field">
                  <Form.Label>Amount</Form.Label>
                  <InputGroup size="lg">
                    <InputGroup.Text>
                      {selectedFrom?.symbol || fromCurrency}
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value)
                        setResult(null)
                        setError('')
                      }}
                      placeholder="0.00"
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Row className="currency-row align-items-end">
                  <Col xs={12} md>
                    <CurrencySelect
                      id="from-currency"
                      label="From"
                      currencies={currencies}
                      value={fromCurrency}
                      onChange={(currency) =>
                        handleSelectionChange(setFromCurrency, currency)
                      }
                    />
                  </Col>

                  <Col xs={12} md="auto" className="swap-column">
                    <Button
                      type="button"
                      variant="light"
                      className="swap-button"
                      onClick={handleSwap}
                      aria-label="Swap currencies"
                      title="Swap currencies"
                    >
                      <span aria-hidden="true">⇅</span>
                    </Button>
                  </Col>

                  <Col xs={12} md>
                    <CurrencySelect
                      id="to-currency"
                      label="To"
                      currencies={currencies}
                      value={toCurrency}
                      onChange={(currency) =>
                        handleSelectionChange(setToCurrency, currency)
                      }
                    />
                  </Col>
                </Row>

                <div className="rate-options">
                  <Form.Check
                    type="switch"
                    id="historical-rate"
                    label="Use a historical exchange rate"
                    checked={useHistoricalRate}
                    onChange={(event) => {
                      setUseHistoricalRate(event.target.checked)
                      setResult(null)
                      setError('')
                    }}
                  />

                  {useHistoricalRate && (
                    <Form.Group controlId="rate-date" className="date-field">
                      <Form.Label>Exchange rate date</Form.Label>
                      <Form.Control
                        type="date"
                        min="1999-01-01"
                        max={getDefaultHistoricalDate()}
                        value={rateDate}
                        onChange={(event) => {
                          setRateDate(event.target.value)
                          setResult(null)
                          setError('')
                        }}
                        required
                      />
                      <Form.Text>
                        Historical end-of-day rates are generally available
                        from 1999.
                      </Form.Text>
                    </Form.Group>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="convert-button"
                  disabled={converting || currencies.length === 0}
                >
                  {converting ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        aria-hidden="true"
                      />
                      Converting…
                    </>
                  ) : (
                    'Convert currency'
                  )}
                </Button>
              </Form>
            )}

            {result && (
              <section className="result-panel" aria-live="polite">
                <span>
                  {formatCurrency(result.amount, result.from)} equals
                </span>
                <strong>
                  {formatCurrency(result.convertedAmount, result.to)}
                </strong>
                <small>
                  1 {result.from} = {result.rate.toLocaleString()} {result.to}
                  {result.rateDate && ` · Rate from ${result.rateDate}`}
                </small>
              </section>
            )}
          </Card.Body>
        </Card>

        <ConversionHistory history={history} onClear={clearHistory} />

        <footer>
          Rates are supplied by FreeCurrencyAPI and may differ from provider
          rates.
        </footer>
      </Container>
    </main>
  )
}

export default App

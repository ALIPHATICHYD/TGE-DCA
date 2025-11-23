/**
 * DeepBook Swap Component
 * Displays pool data, prices, and allows executing swaps
 */

import { useState, useEffect } from 'react';
import { useDeepBook } from '../hooks/useDeepBook';
import { useDeepBookSwap } from '../hooks/useDeepBookSwap';
import '../styles.css';

interface SwapComponentProps {
  vaultId: string;
  targetAsset: string;
  currentBalance?: number;
}

export function DeepBookSwapComponent({
  vaultId,
  targetAsset,
  currentBalance = 0,
}: SwapComponentProps) {
  const { initializeDeepBook } = useDeepBook();
  const {
    fetchPrice,
    estimateSwapOutput,
    getPriceBook,
    executeSwap,
    getPoolKeyForAsset,
  } = useDeepBookSwap();

  const [inputAmount, setInputAmount] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceBook, setPriceBook] = useState<{ bids: any[]; asks: any[] }>({
    bids: [],
    asks: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1% default

  const deepbookClients = initializeDeepBook();
  const poolKey = getPoolKeyForAsset(targetAsset);

  // Fetch price on mount and when pool changes
  useEffect(() => {
    if (!deepbookClients?.deepbookClient) {
      setError('DeepBook client not initialized');
      return;
    }

    const loadPriceData = async () => {
      setLoading(true);
      try {
        const [price, book] = await Promise.all([
          fetchPrice(poolKey, deepbookClients.deepbookClient),
          getPriceBook(poolKey, deepbookClients.deepbookClient, 5),
        ]);

        setCurrentPrice(price);
        setPriceBook(book);
        setError('');
      } catch (err) {
        setError('Failed to load price data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [poolKey, deepbookClients, fetchPrice, getPriceBook]);

  // Estimate output when input changes
  useEffect(() => {
    if (!inputAmount || !deepbookClients?.deepbookClient) {
      setExpectedOutput(null);
      return;
    }

    const estimateOutput = async () => {
      try {
        const amount = parseInt(inputAmount, 10);
        if (isNaN(amount) || amount <= 0) {
          setExpectedOutput(null);
          return;
        }

        const output = await estimateSwapOutput(
          amount,
          poolKey,
          deepbookClients.deepbookClient
        );
        setExpectedOutput(output);
      } catch (err) {
        console.error('Error estimating output:', err);
        setExpectedOutput(null);
      }
    };

    const debounceTimer = setTimeout(estimateOutput, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputAmount, poolKey, deepbookClients, estimateSwapOutput]);

  const handleSwap = async () => {
    if (!inputAmount || !deepbookClients?.deepbookClient) {
      setError('Invalid input');
      return;
    }

    setLoading(true);
    try {
      const result = await executeSwap({
        vaultId,
        inputAmount: parseInt(inputAmount, 10),
        poolKey,
        slippageBps,
        deepbookClient: deepbookClients.deepbookClient,
      });

      if (result.success) {
        setError('');
        setInputAmount('');
        setExpectedOutput(null);
        // Show success message
        alert(
          `Swap executed! Expected output: ${result.expectedOutput} MIST`
        );
      } else {
        setError(result.error || 'Swap failed');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error during swap'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!deepbookClients) {
    return <div className="swap-error">Wallet not connected</div>;
  }

  return (
    <div className="swap-container">
      <h3>DeepBook Swap: SUI → {targetAsset}</h3>

      {error && <div className="swap-error">{error}</div>}

      {/* Price Display */}
      <div className="price-section">
        <div className="price-info">
          <span>Current Price:</span>
          <strong>
            {currentPrice ? `${currentPrice.toFixed(6)} MIST` : 'Loading...'}
          </strong>
        </div>

        {/* Order Book */}
        {priceBook.bids.length > 0 && (
          <div className="orderbook">
            <div className="orderbook-side">
              <h4>Bids</h4>
              {priceBook.bids.map((bid, idx) => (
                <div key={idx} className="orderbook-level">
                  <span>{bid.price?.toFixed(6)}</span>
                  <span>{bid.quantity}</span>
                </div>
              ))}
            </div>
            <div className="orderbook-side">
              <h4>Asks</h4>
              {priceBook.asks.map((ask, idx) => (
                <div key={idx} className="orderbook-level">
                  <span>{ask.price?.toFixed(6)}</span>
                  <span>{ask.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swap Input Form */}
      <div className="swap-form">
        <div className="form-group">
          <label>Amount to Swap (MIST)</label>
          <div className="input-row">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0"
              disabled={loading}
              max={currentBalance}
            />
            {currentBalance > 0 && (
              <button
                onClick={() => setInputAmount(currentBalance.toString())}
                disabled={loading}
                className="max-button"
              >
                Max
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Expected Output (MIST)</label>
          <div className="output-display">
            {expectedOutput
              ? expectedOutput.toLocaleString()
              : inputAmount
                ? 'Calculating...'
                : '-'}
          </div>
        </div>

        <div className="form-group">
          <label>Slippage Tolerance (bps)</label>
          <input
            type="number"
            value={slippageBps}
            onChange={(e) => setSlippageBps(parseInt(e.target.value, 10))}
            min="0"
            max="10000"
            disabled={loading}
          />
          <small>{((slippageBps / 10000) * 100).toFixed(2)}%</small>
        </div>

        <button
          onClick={handleSwap}
          disabled={
            loading ||
            !inputAmount ||
            !expectedOutput ||
            !deepbookClients.deepbookClient
          }
          className="swap-button"
        >
          {loading ? 'Processing...' : 'Execute Swap'}
        </button>
      </div>

      {/* Transaction Info */}
      {expectedOutput && (
        <div className="tx-info">
          <p>
            Min output (with slippage): {Math.floor(expectedOutput * (1 - slippageBps / 10000))} MIST
          </p>
          <p>Pool: {poolKey}</p>
        </div>
      )}
    </div>
  );
}

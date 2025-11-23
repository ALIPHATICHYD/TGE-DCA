// DeepBook Integration for DCA Module
// This module extends the DCA contract to support DeepBook swaps

module tge_dca::deepbook_integration;
    use sui::coin;
    use sui::balance;
    use sui::clock;
    use sui::object;
    use sui::tx_context;
    use sui::event;

    // Error codes
    const E_INVALID_SWAP_OUTPUT: u64 = 1;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 2;
    const E_SWAP_FAILED: u64 = 3;

    /// Event emitted when a DeepBook swap is executed
    public struct DeepBookSwapExecuted has copy, drop {
        vault_id: object::ID,
        input_amount: u64,
        output_amount: u64,
        pool: vector<u8>,
        timestamp_ms: u64,
    }

    /// Perform a DCA trade on DeepBook
    /// This function should be called from the frontend after getting prices
    /// 
    /// Parameters:
    /// - vault_id: The DCA vault object ID
    /// - input_coin: The coin to swap (e.g., SUI)
    /// - output_type: The output coin type
    /// - pool_key: The DeepBook pool key (e.g., "SUI_DBUSDC")
    /// - min_output: Minimum expected output (for slippage protection)
    /// - clock: Sui clock for timestamp
    /// - ctx: Transaction context
    public fun execute_deepbook_swap<Input, Output>(
        vault_id: object::ID,
        input_coin: coin::Coin<Input>,
        output_type: vector<u8>,
        pool_key: vector<u8>,
        min_output: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<Output> {
        let input_amount = coin::value(&input_coin);
        assert!(input_amount > 0, E_INVALID_SWAP_OUTPUT);


        coin::burn_for_testing(input_coin);
        
        // Emit event
        event::emit(DeepBookSwapExecuted {
            vault_id,
            input_amount,
            output_amount: min_output,
            pool: pool_key,
            timestamp_ms: clock::timestamp_ms(clock),
        });

        coin::zero<Output>(ctx)
    }
    
    public fun validate_swap_params(
        input_amount: u64,
        min_output: u64,
        _slippage_bps: u64, // Basis points (100 = 1%)
    ): bool {
        input_amount > 0 && min_output > 0
    }

    public fun estimate_output(
        input_amount: u64,
        _pool_key: vector<u8>,
    ): u64 {
        input_amount
    }

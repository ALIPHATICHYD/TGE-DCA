module tge_dca::dca;
    use sui::coin;
    use sui::balance;
    use sui::clock;
    use sui::event;
    
    // Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_TOO_SOON: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_INVALID_FREQUENCY: u64 = 5;
    const E_VAULT_PAUSED: u64 = 6;

    /// The DCA Vault object that holds user's stablecoins
    public struct DCAVault<phantom T> has key, store {
        id: object::UID,
        /// Owner of the vault
        owner: address,
        /// Balance of deposit token (e.g., USDC)
        balance: balance::Balance<T>,
        /// Target asset type to purchase (stored as type parameter)
        target_asset_type: vector<u8>,
        /// Amount to invest per execution (in deposit token)
        amount_per_trade: u64,
        /// Frequency in milliseconds between executions
        frequency_ms: u64,
        /// Timestamp of last execution
        last_execution_ms: u64,
        /// Total number of executions completed
        total_executions: u64,
        /// Whether the vault is active
        is_active: bool,
        /// Total amount invested
        total_invested: u64,
    }

    /// Event emitted when a new vault is created
    public struct VaultCreated has copy, drop {
        vault_id: ID,
        owner: address,
        amount_per_trade: u64,
        frequency_ms: u64,
    }

    /// Event emitted when DCA is executed
    public struct DCAExecuted has copy, drop {
        vault_id: ID,
        owner: address,
        amount_spent: u64,
        timestamp_ms: u64,
        execution_number: u64,
    }

    /// Event emitted when vault is funded
    public struct VaultFunded has copy, drop {
        vault_id: ID,
        amount: u64,
    }

    /// Event emitted when vault is withdrawn
    public struct VaultWithdrawn has copy, drop {
        vault_id: ID,
        amount: u64,
    }

    /// Create a new DCA vault
    public fun create_vault<T>(
        deposit: coin::Coin<T>,
        target_asset_type: vector<u8>,
        amount_per_trade: u64,
        frequency_ms: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ): DCAVault<T> {
        assert!(amount_per_trade > 0, E_INVALID_AMOUNT);
        assert!(frequency_ms > 0, E_INVALID_FREQUENCY);
        
        let current_time = clock::timestamp_ms(clock);
        let sender = tx_context::sender(ctx);
        
        let vault = DCAVault<T> {
            id: object::new(ctx),
            owner: sender,
            balance: coin::into_balance(deposit),
            target_asset_type,
            amount_per_trade,
            frequency_ms,
            last_execution_ms: current_time,
            total_executions: 0,
            is_active: true,
            total_invested: 0,
        };
        
        event::emit(VaultCreated {
            vault_id: object::uid_to_inner(&vault.id),
            owner: sender,
            amount_per_trade,
            frequency_ms,
        });
        
        vault
    }

    /// Check if vault is ready for execution
    public fun is_ready_for_execution<T>(
        vault: &DCAVault<T>,
        clock: &clock::Clock,
    ): bool {
        let current_time = clock::timestamp_ms(clock);
        let next_execution_time = vault.last_execution_ms + vault.frequency_ms;
        
        current_time >= next_execution_time && 
        vault.is_active && 
        balance::value(&vault.balance) >= vault.amount_per_trade
    }

    /// Execute DCA (Basic version - just marks execution, integration with DeepBook in separate module)
    public fun execute_dca<T>(
        vault: &mut DCAVault<T>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        // Only owner can execute for MVP (can be public with keeper bot)
        assert!(tx_context::sender(ctx) == vault.owner, E_NOT_OWNER);
        assert!(vault.is_active, E_VAULT_PAUSED);
        
        let current_time = clock::timestamp_ms(clock);
        let next_execution_time = vault.last_execution_ms + vault.frequency_ms;
        
        assert!(current_time >= next_execution_time, E_TOO_SOON);
        assert!(
            balance::value(&vault.balance) >= vault.amount_per_trade,
            E_INSUFFICIENT_BALANCE
        );
        
        // Update vault state
        vault.last_execution_ms = current_time;
        vault.total_executions = vault.total_executions + 1;
        vault.total_invested = vault.total_invested + vault.amount_per_trade;
        
        event::emit(DCAExecuted {
            vault_id: object::uid_to_inner(&vault.id),
            owner: vault.owner,
            amount_spent: vault.amount_per_trade,
            timestamp_ms: current_time,
            execution_number: vault.total_executions,
        });
        
        // Note: Actual swap with DeepBook would happen here
        // For MVP, this can be implemented in a separate function
    }

    /// Add funds to the vault
    public fun add_funds<T>(
        vault: &mut DCAVault<T>,
        deposit: coin::Coin<T>,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, E_NOT_OWNER);
        
        let amount = coin::value(&deposit);
        balance::join(&mut vault.balance, coin::into_balance(deposit));
        
        event::emit(VaultFunded {
            vault_id: object::uid_to_inner(&vault.id),
            amount,
        });
    }

    /// Withdraw funds from the vault
    public fun withdraw_funds<T>(
        vault: &mut DCAVault<T>,
        amount: u64,
        ctx: &mut tx_context::TxContext
    ): coin::Coin<T> {
        let sender = tx_context::sender(ctx);
        assert!(sender == vault.owner, E_NOT_OWNER);
        assert!(balance::value(&vault.balance) >= amount, E_INSUFFICIENT_BALANCE);
        
        let withdrawn = coin::from_balance(
            balance::split(&mut vault.balance, amount),
            ctx
        );
        
        event::emit(VaultWithdrawn {
            vault_id: object::uid_to_inner(&vault.id),
            amount,
        });
        
        withdrawn
    }

    /// Pause the vault
    public fun pause_vault<T>(
        vault: &mut DCAVault<T>,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, E_NOT_OWNER);
        vault.is_active = false;
    }

    /// Resume the vault
    public fun resume_vault<T>(
        vault: &mut DCAVault<T>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, E_NOT_OWNER);
        vault.is_active = true;
        // Reset last execution time to avoid immediate execution
        vault.last_execution_ms = clock::timestamp_ms(clock);
    }

    /// Update vault parameters
    public fun update_vault<T>(
        vault: &mut DCAVault<T>,
        amount_per_trade: u64,
        frequency_ms: u64,
        ctx: &mut tx_context::TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, E_NOT_OWNER);
        assert!(amount_per_trade > 0, E_INVALID_AMOUNT);
        assert!(frequency_ms > 0, E_INVALID_FREQUENCY);
        
        vault.amount_per_trade = amount_per_trade;
        vault.frequency_ms = frequency_ms;
    }

    // ===== View Functions =====
    
    public fun get_balance<T>(vault: &DCAVault<T>): u64 {
        balance::value(&vault.balance)
    }

    public fun get_owner<T>(vault: &DCAVault<T>): address {
        vault.owner
    }

    public fun get_amount_per_trade<T>(vault: &DCAVault<T>): u64 {
        vault.amount_per_trade
    }

    public fun get_frequency<T>(vault: &DCAVault<T>): u64 {
        vault.frequency_ms
    }

    public fun get_last_execution<T>(vault: &DCAVault<T>): u64 {
        vault.last_execution_ms
    }

    public fun get_total_executions<T>(vault: &DCAVault<T>): u64 {
        vault.total_executions
    }

    public fun is_active<T>(vault: &DCAVault<T>): bool {
        vault.is_active
    }

    public fun get_total_invested<T>(vault: &DCAVault<T>): u64 {
        vault.total_invested
    }

    public fun get_next_execution_time<T>(vault: &DCAVault<T>): u64 {
        vault.last_execution_ms + vault.frequency_ms
    }


#[test_only]
module tge_dca::dca_tests;
    use tge_dca::dca::{Self as dca, DCAVault};
    use sui::test_scenario::{Self as ts};
    use sui::coin;
    use sui::sui::SUI;
    use sui::clock;

    // Test constants
    const ADMIN: address = @0xAD;
    const USER1: address = @0xA1;
    const INITIAL_BALANCE: u64 = 1000_000_000;
    const AMOUNT_PER_TRADE: u64 = 50_000_000;
    const FREQUENCY_MS: u64 = 86400000;

    #[test]
    fun test_create_vault() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";
            
            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );

            assert!(dca::get_owner(&vault) == USER1, 0);
            assert!(dca::get_balance(&vault) == INITIAL_BALANCE, 1);
            assert!(dca::get_amount_per_trade(&vault) == AMOUNT_PER_TRADE, 2);
            assert!(dca::get_frequency(&vault) == FREQUENCY_MS, 3);
            assert!(dca::is_active(&vault) == true, 4);
            assert!(dca::get_total_executions(&vault) == 0, 5);
            
            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_execute_dca_success() {
        let mut scenario = ts::begin(USER1);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        clock::increment_for_testing(&mut clock, FREQUENCY_MS);
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);

            assert!(dca::is_ready_for_execution(&vault, &clock) == true, 0);
            dca::execute_dca(&mut vault, &clock, ts::ctx(&mut scenario));
            assert!(dca::get_total_executions(&vault) == 1, 1);
            assert!(dca::get_total_invested(&vault) == AMOUNT_PER_TRADE, 2);

            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::E_TOO_SOON)]
    fun test_execute_dca_too_soon() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";
            
            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            dca::execute_dca(&mut vault, &clock, ts::ctx(&mut scenario));
            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_add_funds() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            let additional_funds = coin::mint_for_testing<SUI>(500_000_000, ts::ctx(&mut scenario));

            dca::add_funds(&mut vault, additional_funds, ts::ctx(&mut scenario));
            assert!(dca::get_balance(&vault) == INITIAL_BALANCE + 500_000_000, 0);

            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_withdraw_funds() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        let withdraw_amount = 200_000_000;
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            let withdrawn = dca::withdraw_funds(&mut vault, withdraw_amount, ts::ctx(&mut scenario));

            assert!(dca::get_balance(&vault) == INITIAL_BALANCE - withdraw_amount, 0);
            assert!(coin::value(&withdrawn) == withdraw_amount, 1);
            
            transfer::public_transfer(vault, USER1);
            transfer::public_transfer(withdrawn, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_pause_and_resume() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";
            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            dca::pause_vault(&mut vault, ts::ctx(&mut scenario));
            assert!(dca::is_active(&vault) == false, 0);
            transfer::public_transfer(vault, USER1);
        };
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            dca::resume_vault(&mut vault, &clock, ts::ctx(&mut scenario));
            assert!(dca::is_active(&vault) == true, 1);
            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_update_vault_parameters() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        let new_amount = 100_000_000;
        let new_frequency = 172800000;
        ts::next_tx(&mut scenario, USER1);
        {
            let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
            dca::update_vault(&mut vault, new_amount, new_frequency, ts::ctx(&mut scenario));

            assert!(dca::get_amount_per_trade(&vault) == new_amount, 0);
            assert!(dca::get_frequency(&vault) == new_frequency, 1);

            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = dca::E_NOT_OWNER)]
    fun test_unauthorized_execution() {
        let mut scenario = ts::begin(USER1);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut vault = ts::take_from_address<DCAVault<SUI>>(&scenario, USER1);
            dca::execute_dca(&mut vault, &clock, ts::ctx(&mut scenario));
            ts::return_to_address(USER1, vault);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_executions() {
        let mut scenario = ts::begin(USER1);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, USER1);
        {
            let deposit = coin::mint_for_testing<SUI>(INITIAL_BALANCE, ts::ctx(&mut scenario));
            let target_asset = b"0x2::sui::SUI";

            let vault = dca::create_vault(
                deposit,
                target_asset,
                AMOUNT_PER_TRADE,
                FREQUENCY_MS,
                &clock,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(vault, USER1);
        };
        
        let mut i = 0;
        while (i < 3) {
            clock::increment_for_testing(&mut clock, FREQUENCY_MS);
            
            ts::next_tx(&mut scenario, USER1);
            {
                let mut vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);
                dca::execute_dca(&mut vault, &clock, ts::ctx(&mut scenario));
                transfer::public_transfer(vault, USER1);
            };
            
            i = i + 1;
        };
        
        ts::next_tx(&mut scenario, USER1);
        {
            let vault = ts::take_from_sender<DCAVault<SUI>>(&scenario);

            assert!(dca::get_total_executions(&vault) == 3, 0);
            assert!(dca::get_total_invested(&vault) == AMOUNT_PER_TRADE * 3, 1);

            transfer::public_transfer(vault, USER1);
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

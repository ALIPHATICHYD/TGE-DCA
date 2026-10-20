import { useCallback, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { CLOCK_OBJECT_ID, IS_CONFIGURED, MODULE, SUI_TYPE } from '../lib/config';
import { useToast } from './useToast';

export type ActionName = 'create' | 'execute' | 'fund' | 'withdraw' | 'pause' | 'resume' | 'update' | 'close';

const ABORT_REASONS: Record<string, string> = {
  '1': 'Only the vault owner can do this.',
  '2': 'Too soon: the next buy is not due yet.',
  '3': 'The vault balance is too low for this.',
  '4': 'Amount must be more than 0.',
  '5': 'Frequency must be more than 0.',
  '6': 'The vault is paused. Resume it first.',
};

function explain(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const abort = msg.match(/MoveAbort.*?,\s*(\d+)\)/);
  if (abort && ABORT_REASONS[abort[1]]) return ABORT_REASONS[abort[1]];
  if (/reject/i.test(msg)) return 'Request was rejected in the wallet.';
  if (/insufficient/i.test(msg)) return 'Not enough SUI in the wallet for this and gas.';
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}

export interface CreateParams {
  deposit: bigint;
  perTrade: bigint;
  frequencyMs: number;
  target: string;
}

/** Every vault write, signed by the connected wallet and confirmed before resolving. */
export function useVaultActions() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const { mutateAsync } = useSignAndExecuteTransaction();
  const { notify } = useToast();
  const [pending, setPending] = useState<ActionName | null>(null);

  const run = useCallback(
    async (name: ActionName, build: (tx: Transaction) => void, success: string): Promise<boolean> => {
      if (!IS_CONFIGURED) {
        notify('Package ID is not set. Add VITE_PACKAGE_ID to app/.env.', 'error');
        return false;
      }
      if (!account?.address) {
        notify('Connect a wallet first.', 'error');
        return false;
      }
      setPending(name);
      try {
        const tx = new Transaction();
        build(tx);
        const { digest } = await mutateAsync({ transaction: tx });
        const res = await client.waitForTransaction({ digest, options: { showEffects: true } });
        if (res.effects?.status.status === 'failure') {
          throw new Error(res.effects.status.error ?? 'Transaction failed');
        }
        await queryClient.invalidateQueries();
        notify(success);
        return true;
      } catch (err) {
        console.error(`[vault:${name}]`, err);
        notify(explain(err), 'error');
        return false;
      } finally {
        setPending(null);
      }
    },
    [account?.address, client, mutateAsync, notify, queryClient]
  );

  const create = (p: CreateParams) =>
    run(
      'create',
      (tx) => {
        const [coin] = tx.splitCoins(tx.gas, [p.deposit]);
        const vault = tx.moveCall({
          target: `${MODULE}::create_vault`,
          arguments: [
            coin,
            tx.pure.string(p.target),
            tx.pure.u64(p.perTrade),
            tx.pure.u64(BigInt(p.frequencyMs)),
            tx.object(CLOCK_OBJECT_ID),
          ],
          typeArguments: [SUI_TYPE],
        });
        tx.transferObjects([vault], account!.address);
      },
      'Vault created.'
    );

  const execute = (vaultId: string) =>
    run(
      'execute',
      (tx) => {
        tx.moveCall({
          target: `${MODULE}::execute_dca`,
          arguments: [tx.object(vaultId), tx.object(CLOCK_OBJECT_ID)],
          typeArguments: [SUI_TYPE],
        });
      },
      'Buy executed.'
    );

  const fund = (vaultId: string, amount: bigint) =>
    run(
      'fund',
      (tx) => {
        const [coin] = tx.splitCoins(tx.gas, [amount]);
        tx.moveCall({
          target: `${MODULE}::add_funds`,
          arguments: [tx.object(vaultId), coin],
          typeArguments: [SUI_TYPE],
        });
      },
      'Funds added.'
    );

  const withdraw = (vaultId: string, amount: bigint) =>
    run(
      'withdraw',
      (tx) => {
        const coin = tx.moveCall({
          target: `${MODULE}::withdraw_funds`,
          arguments: [tx.object(vaultId), tx.pure.u64(amount)],
          typeArguments: [SUI_TYPE],
        });
        tx.transferObjects([coin], account!.address);
      },
      'Withdrawn to your wallet.'
    );

  const pause = (vaultId: string) =>
    run(
      'pause',
      (tx) => {
        tx.moveCall({ target: `${MODULE}::pause_vault`, arguments: [tx.object(vaultId)], typeArguments: [SUI_TYPE] });
      },
      'Vault paused.'
    );

  const resume = (vaultId: string) =>
    run(
      'resume',
      (tx) => {
        tx.moveCall({
          target: `${MODULE}::resume_vault`,
          arguments: [tx.object(vaultId), tx.object(CLOCK_OBJECT_ID)],
          typeArguments: [SUI_TYPE],
        });
      },
      'Vault resumed. The next buy is one period from now.'
    );

  const update = (vaultId: string, perTrade: bigint, frequencyMs: number) =>
    run(
      'update',
      (tx) => {
        tx.moveCall({
          target: `${MODULE}::update_vault`,
          arguments: [tx.object(vaultId), tx.pure.u64(perTrade), tx.pure.u64(BigInt(frequencyMs))],
          typeArguments: [SUI_TYPE],
        });
      },
      'Rules saved.'
    );

  /** Withdraw the whole balance and pause, in one transaction. */
  const close = (vaultId: string, balance: bigint, active: boolean) =>
    run(
      'close',
      (tx) => {
        if (balance > 0n) {
          const coin = tx.moveCall({
            target: `${MODULE}::withdraw_funds`,
            arguments: [tx.object(vaultId), tx.pure.u64(balance)],
            typeArguments: [SUI_TYPE],
          });
          tx.transferObjects([coin], account!.address);
        }
        if (active) {
          tx.moveCall({ target: `${MODULE}::pause_vault`, arguments: [tx.object(vaultId)], typeArguments: [SUI_TYPE] });
        }
      },
      'Vault closed. Balance returned to your wallet.'
    );

  return { pending, create, execute, fund, withdraw, pause, resume, update, close };
}

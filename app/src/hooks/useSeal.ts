import { useCallback, useEffect, useMemo, useState } from 'react';
import { SuiClient } from '@mysten/sui.js/client';

type SealClientType = any;
type SessionKeyType = any;

interface UseSealOpts {
  network?: 'testnet' | 'mainnet' | string;
  keyServerObjectIds?: string[]; // on-chain KeyServer object ids
  verifyKeyServers?: boolean;
}

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function useSeal(opts?: UseSealOpts) {
  const [sealClient, setSealClient] = useState<SealClientType | null>(null);
  const [sessionKey, setSessionKey] = useState<SessionKeyType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = opts?.network ?? (import.meta.env.VITE_DEEPBOOK_NETWORK ?? 'testnet');

  const init = useCallback(async (keyServerObjectIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const SealModule = await import('@mysten/seal');
      const SealClient = SealModule.SealClient;

      const suiUrl = network === 'mainnet' ? 'https://fullnode.mainnet.sui.io:443' : 'https://fullnode.testnet.sui.io:443';
      const suiClient = new SuiClient({ url: suiUrl });

      const serverIds = keyServerObjectIds ?? opts?.keyServerObjectIds ?? [];

      const client = new SealClient({
        suiClient,
        serverConfigs: serverIds.map((id) => ({ objectId: id, weight: 1 })),
        verifyKeyServers: opts?.verifyKeyServers ?? false,
      });

      setSealClient(client);
      return client;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setSealClient(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [network, opts]);

  const createSessionKey = useCallback(async (address: string, packageId: string, ttlMin = 10, signer?: any) => {
    if (!sealClient) throw new Error('seal client not initialized');
    setLoading(true);
    try {
      // @ts-ignore
      const SealModule = await import('@mysten/seal');
      const SessionKey = SealModule.SessionKey;
      const session = await SessionKey.create({
        address,
        packageId,
        ttlMin,
        suiClient: (sealClient as any).suiClient,
      });

      // If signer provided, sign message immediately (optional)
      if (signer?.signMessage) {
        const message = session.getPersonalMessage();
        const sig = await signer.signMessage(message);
        session.setPersonalMessageSignature(sig);
      }

      setSessionKey(session);
      return session;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [sealClient]);

  const encrypt = useCallback(async (params: { threshold: number; packageId: string; id: string; data: Uint8Array | string; algorithm?: string }) => {
    if (!sealClient) throw new Error('seal client not initialized');
    const alg = params.algorithm ?? 'HMAC_CTR';
    const dataBytes = typeof params.data === 'string' ? new TextEncoder().encode(params.data) : params.data;
    const { encryptedObject, key } = await (sealClient as any).encrypt({
      threshold: params.threshold,
      packageId: params.packageId,
      id: params.id,
      data: dataBytes,
      algorithm: alg,
    });
    return { encryptedObject, key };
  }, [sealClient]);

  const decryptOnChain = useCallback(async (params: { encryptedBytes: Uint8Array | string; txBytes: Uint8Array | string; sessionKey?: any }) => {
    if (!sealClient) throw new Error('seal client not initialized');
    const sKey = params.sessionKey ?? sessionKey;
    if (!sKey) throw new Error('session key required for decryption');

    const encBytes = typeof params.encryptedBytes === 'string' ? hexToUint8Array(params.encryptedBytes) : params.encryptedBytes;
    const tb = typeof params.txBytes === 'string' ? hexToUint8Array(params.txBytes) : params.txBytes;

    const decrypted = await (sealClient as any).decrypt({
      data: encBytes,
      sessionKey: sKey,
      txBytes: tb,
    });

    return decrypted; // typically Option<vector<u8>> BCS encoded
  }, [sealClient, sessionKey]);

  // convenience: get derived keys for on-chain flow
  const getDerivedKeys = useCallback(async (params: { id: string; txBytes: Uint8Array | string; sessionKey?: any; threshold?: number }) => {
    if (!sealClient) throw new Error('seal client not initialized');
    const sKey = params.sessionKey ?? sessionKey;
    if (!sKey) throw new Error('session key required');
    const tb = typeof params.txBytes === 'string' ? hexToUint8Array(params.txBytes) : params.txBytes;
    return await (sealClient as any).getDerivedKeys({ id: params.id, txBytes: tb, sessionKey: sKey, threshold: params.threshold });
  }, [sealClient, sessionKey]);

  useEffect(() => {
    // If user provided key servers, auto init on mount
    if (!sealClient && opts?.keyServerObjectIds && opts.keyServerObjectIds.length > 0) {
      init(opts.keyServerObjectIds).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => ({
    init,
    sealClient,
    sessionKey,
    createSessionKey,
    encrypt,
    decryptOnChain,
    getDerivedKeys,
    loading,
    error,
  }), [init, sealClient, sessionKey, createSessionKey, encrypt, decryptOnChain, getDerivedKeys, loading, error]);
}

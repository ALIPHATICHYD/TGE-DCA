export interface VaultData {
  id: { id: string };
  owner: string;
  balance: string;
  target_asset_type: string;
  amount_per_trade: string;
  frequency_ms: string;
  last_execution_ms: string;
  total_executions: string;
  is_active: boolean;
  total_invested: string;
}

export interface VaultObject {
  data: {
    objectId: string;
    version: string;
    digest: string;
    type: string;
    content: {
      dataType: 'moveObject';
      type: string;
      hasPublicTransfer: boolean;
      fields: VaultData;
    };
  };
}

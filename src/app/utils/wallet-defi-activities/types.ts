export type DefiPosition = {
  protocol_name: string;
  protocol_id: string;
  protocol_url: string;
  protocol_logo: string;
  protocol: string;
  totalValueLocked: number;
  rewardTokens: string[];
  apr: number;
  position: {
    label: string;
    value: number;
  };
}; 
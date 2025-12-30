export interface MasternodeAwarenessInput {
  active: number;
  standby: number;
}

export function formatMasternodeAwarenessTweet(
  input: MasternodeAwarenessInput
): string {
  const totalNodes = input.active + input.standby;

  return `
🌐 XDC Network Health Check 🌐

Secured🔐 by ${totalNodes} nodes worldwide (Validators + Standby Nodes)
Delivering fast finality, low fees, and enterprise-grade reliability.

Want to run an XDC Masternode (Validator)?
⚙️ Stake 10M XDC & follow the setup guide:
https://docs.xdc.network

#XDCNetwork #BuildOnXDC #Validators
`.trim();
}

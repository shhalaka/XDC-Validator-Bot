import { ethers } from "ethers";

export function shortAddr(addr: string): string {
  if (!addr) return "";
  const a = addr.toLowerCase();
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function toXdcAddress(addr: string): string {
  // XDC tooling often uses "xdc" prefix, but the chain is EVM-compatible.
  // Keep display friendly; do NOT change checksum semantics.
  if (!addr) return addr;
  if (addr.startsWith("0x") || addr.startsWith("0X")) return `xdc${addr.slice(2)}`;
  return addr;
}

export function formatNativeAmount(weiLike: bigint, symbol: string): string {
  const v = ethers.formatEther(weiLike);
  // Keep concise: trim trailing zeros
  const trimmed = v.includes(".") ? v.replace(/\.?0+$/, "") : v;
  return `${trimmed} ${symbol}`;
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  if (maxLen <= 1) return text.slice(0, maxLen);
  return `${text.slice(0, maxLen - 1)}…`;
}



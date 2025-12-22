import { type Log, type Interface } from "ethers";
import {
  formatNativeAmount,
  shortAddr,
  toXdcAddress,
  truncate
} from "../utils/format.js";

export type TweetFormatContext = {
  nativeSymbol: string;
  txExplorerBase: string;
  maxLen: number;
};

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  return String(v);
}

export function formatTweetForLog(
  iface: Interface,
  log: Log,
  ctx: TweetFormatContext
): { text: string; eventId: string } | null {
  let parsed: ReturnType<Interface["parseLog"]>;
  try {
    parsed = iface.parseLog(log);
  } catch {
    return null;
  }

  if (!parsed) return null;

  const eventName = parsed.name;
  const args = parsed.args;

  const block = log.blockNumber ?? 0;
  const tx = log.transactionHash ?? "";
  const idx = log.index ?? 0;
  const eventId = `${block}:${tx}:${idx}`;

  const explorerBase = ctx.txExplorerBase.replace(/\/$/, "");
  const explorerLink =
    tx && explorerBase
      ? explorerBase.endsWith("/tx")
        ? `${explorerBase}/${tx}`
        : `${explorerBase}/tx/${tx}`
      : "";


  const lines: string[] = [];
  lines.push(`🚨 XDC VALIDATOR ALERT 🚨`);
  lines.push(`🧩 Event: ${eventName} | Block: ${block}`);

  switch (eventName) {
    case "Vote": {
      const voter = safeStr(args._voter);
      const candidate = safeStr(args._candidate);
      const cap = BigInt(args._cap);

      lines.push(`🗳️ Voter: ${toXdcAddress(shortAddr(voter))}`);
      lines.push(`💼 Candidate: ${toXdcAddress(shortAddr(candidate))}`);
      lines.push(`💰 Stake: ${formatNativeAmount(cap, ctx.nativeSymbol)}`);
      break;
    }

    case "Unvote": {
      const voter = safeStr(args._voter);
      const candidate = safeStr(args._candidate);
      const cap = BigInt(args._cap);

      lines.push(`🗳️ Voter: ${toXdcAddress(shortAddr(voter))}`);
      lines.push(`💼 Candidate: ${toXdcAddress(shortAddr(candidate))}`);
      lines.push(`💰 Stake: ${formatNativeAmount(cap, ctx.nativeSymbol)}`);
      break;
    }

    case "Propose": {
      const owner = safeStr(args._owner);
      const candidate = safeStr(args._candidate);
      const cap = BigInt(args._cap);

      lines.push(`🗳️ Validator Proposal Submitted | 👨🏻‍💼 Owner: ${toXdcAddress(shortAddr(owner))}`);
      lines.push(`💼 Candidate: ${toXdcAddress(shortAddr(candidate))}`);
      lines.push(`💰 Stake: ${formatNativeAmount(cap, ctx.nativeSymbol)}`);
      break;
    }

    case "Resign": {
      const owner = safeStr(args._owner);
      const candidate = safeStr(args._candidate);

      lines.push(`⚠️ Validator Resignation Detected | 👨🏻‍💼 Owner: ${toXdcAddress(shortAddr(owner))}`);
      lines.push(`💼 Candidate: ${toXdcAddress(shortAddr(candidate))}`);
      lines.push(`🌐 Network: XDC Mainnet`);
      break;
    }

    case "Withdraw": {
      const owner = safeStr(args._owner);
      const blockNumber = BigInt(args._blockNumber);
      const cap = BigInt(args._cap);

      lines.push(`💸 Stake Withdrawal Executed | 👨🏻‍💼 Owner: ${toXdcAddress(shortAddr(owner))}`);
      lines.push(`🔓 Unlock Block: ${blockNumber.toString()}`);
      lines.push(`💲 Amount: ${formatNativeAmount(cap, ctx.nativeSymbol)}`);
      break;
    }

    case "UploadedKYC": {
      const owner = safeStr(args._owner);
      const kycHash = safeStr(args.kycHash);

      lines.push(`🏛️ KYC Uploaded | 👨🏻‍💼 Owner: ${toXdcAddress(shortAddr(owner))}`);
      lines.push(`📋 KYC Hash: ${truncate(kycHash, 32)}`);
      break;
    }

    case "InvalidatedNode": {
      const owner = safeStr(args._masternodeOwner);
      const nodes = args._masternodes as unknown as string[];

      lines.push(`🔺 Validator Node Invalidated | 👨🏻‍💼 Owner: ${toXdcAddress(shortAddr(owner))}`);
      lines.push(
        `📉 Nodes Affected: ${Array.isArray(nodes) ? nodes.length : 0}`
      );

      if (Array.isArray(nodes) && nodes.length > 0) {
        const preview = nodes
          .slice(0, 3)
          .map((a) => toXdcAddress(shortAddr(String(a))));
        lines.push(
          `🧩 Nodes: ${preview.join(", ")}${nodes.length > 3 ? ", …" : ""}`
        );
      }
      break;
    }

    default:
      lines.push(`⚠️ Unrecognized validator event detected`);
  }

  const hashtags = ["#XDC", "#XDCNetwork", "#Blockchain"];

  switch (eventName) {
    case "Vote":
    case "Unvote":
      hashtags.push("#Governance");
      break;
    case "Propose":
    case "Resign":
      hashtags.push("#Validator");
      break;
    case "Withdraw":
      hashtags.push("#Staking");
      break;
    case "UploadedKYC":
      hashtags.push("#Compliance");
      break;
    case "InvalidatedNode":
      hashtags.push("#NetworkSecurity");
      break;
  }

  const body = lines.join("\n");
  const linkBlock = explorerLink ? `\n\n🔗 ${explorerLink}` : "";
  const maxBodyLen = ctx.maxLen - linkBlock.length;

  const safeBody =
    body.length > maxBodyLen
      ? truncate(body, maxBodyLen - 1) + "…"
      : body;

const text = explorerLink
  ? `${safeBody}${linkBlock}\n\n${hashtags.join(" ")}`
  : `${safeBody}\n\n${hashtags.join(" ")}`;

  return { text, eventId };
}

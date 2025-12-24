import fetch from "node-fetch";

export type NetworkValidatorStats = {
  active: number;
  standby: number;
  total: number;
  owners: number;
};

export async function fetchValidatorNetworkStats(): Promise<NetworkValidatorStats> {
  const url = "https://mn.xinfin.network/api/candidates/masternodes";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`XDC masternode API failed: ${res.status}`);
  }

  const json: any = await res.json();

  console.log(
        "Masternode API keys:",
        Object.keys(json),
        "nested data keys:",
        json?.data ? Object.keys(json.data) : "no data"
    );

  //Robust candidate extraction
  const candidates = Array.isArray(json?.items) ? json.items : [];

  if (candidates.length === 0) {
    console.warn("Masternode API returned zero candidates");
    return { active: 0, standby: 0, total: 0, owners: 0 };
  }

  const total = candidates.length;

  const active = candidates.filter(
    (c: any) => c.status === "MASTERNODE"
).length;

  const standby = candidates.filter(
    (c: any) => c.status !== "MASTERNODE"
).length;

  const owners = new Set(candidates.map((c: any) => c.owner)).size;

  return { active, standby, total, owners };
}
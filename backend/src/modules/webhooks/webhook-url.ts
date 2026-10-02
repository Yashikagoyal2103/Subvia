import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const WEBHOOK_TIMEOUT_MS = 10_000;

function ipv4ToBigInt(ip: string) {
  return ip.split(".").reduce((value, part) => (value << 8n) + BigInt(Number(part)), 0n);
}

function ipv4InRange(ip: string, network: string, prefix: number) {
  const value = ipv4ToBigInt(ip);
  const base = ipv4ToBigInt(network);
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(32 - prefix);
  return (value & mask) === base;
}

function isPrivateIpv4(ip: string) {
  const ranges: Array<[string, number]> = [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
    ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
    ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4], ["255.255.255.255", 32],
  ];
  return ranges.some(([network, prefix]) => ipv4InRange(ip, network, prefix));
}

function parseIpv6(ip: string): bigint | null {
  const normalized = ip.toLowerCase().split("%")[0];
  const halves = normalized.split("::");
  if (halves.length > 2) return null;

  const expand = (part: string): number[] | null => {
    if (!part) return [];
    const pieces = part.split(":");
    const result: number[] = [];
    for (const piece of pieces) {
      if (piece.includes(".")) {
        if (pieces[pieces.length - 1] !== piece || net.isIP(piece) !== 4) return null;
        const value = ipv4ToBigInt(piece);
        result.push(Number((value >> 16n) & 0xffffn), Number(value & 0xffffn));
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(piece)) return null;
        result.push(parseInt(piece, 16));
      }
    }
    return result;
  };

  const left = expand(halves[0]);
  const right = expand(halves.length === 2 ? halves[1] : "");
  if (!left || !right) return null;
  const total = left.length + right.length;
  if (halves.length === 1 ? total !== 8 : total >= 8) return null;
  const parts = halves.length === 2 ? [...left, ...Array(8 - total).fill(0), ...right] : [...left, ...right];
  return parts.reduce((value, part) => (value << 16n) + BigInt(part), 0n);
}

function ipv6Prefix(value: bigint, prefix: number) {
  return value >> BigInt(128 - prefix);
}

function isPrivateIpv6(ip: string) {
  const normalized = ip.toLowerCase().split("%")[0];

  // URL parsers normalize bracketed IPv4-compatible/mapped IPv6 literals
  // such as [::127.0.0.1] to forms like ::7f00:1. Reject the whole
  // ::/96 range and the special transition/documentation ranges explicitly.
  if (normalized === "::" || normalized.startsWith("::")) return true;
  if (normalized.startsWith("2002:")) return true; // 6to4
  if (normalized.startsWith("2001:0:")) return true; // Teredo
  if (normalized.startsWith("2001:db8:")) return true; // documentation

  const value = parseIpv6(normalized);
  if (value === null) return true;

  if (value === 0n || value === 1n) return true; // :: / ::1
  if (ipv6Prefix(value, 8) === 0xffn) return true; // multicast
  if (ipv6Prefix(value, 7) === 0b1111110n) return true; // fc00::/7
  if (ipv6Prefix(value, 10) === 0b1111111010n) return true; // fe80::/10
  if (ipv6Prefix(value, 16) === 0x2002n) return true; // 6to4
  if (ipv6Prefix(value, 32) === 0x20010000n) return true; // Teredo
  if (ipv6Prefix(value, 32) === 0x20010db8n) return true; // documentation
  if (ipv6Prefix(value, 48) === 0x200102n) return true; // benchmark/special-use range
  if (ipv6Prefix(value, 96) === 0x64ff9b000000000000000000n) return true; // NAT64
  if (ipv6Prefix(value, 64) === 0x1000000000000000n) return true; // discard-only 100::/64
  if (ipv6Prefix(value, 16) === 0x3ffen) return true; // 6bone
  if (ipv6Prefix(value, 10) === 0b1111111011n) return true; // site-local fec0::/10

  const high96 = value >> 32n;
  if (high96 === 0n || high96 === 0xffffffffffffffffffffffffn) return true; // IPv4-compatible / mapped forms

  const embeddedIpv4 = Number(value & 0xffffffffn);
  const embedded = `${embeddedIpv4 >>> 24}.${(embeddedIpv4 >>> 16) & 255}.${(embeddedIpv4 >>> 8) & 255}.${embeddedIpv4 & 255}`;
  if (ipv6Prefix(value, 96) === 0n || ipv6Prefix(value, 96) === 0xffffffffffffffffffffffffn) return isPrivateIpv4(embedded);

  return false;
}

function isBlockedAddress(ip: string) {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) return isPrivateIpv6(ip);
  return true;
}

async function resolvePublicAddress(hostname: string) {
  const family = net.isIP(hostname);
  if (family) {
    if (isBlockedAddress(hostname)) throw new Error("WEBHOOK_URL_NOT_ALLOWED");
    return { address: hostname, family };
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isBlockedAddress(record.address))) {
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }
  const record = records.find((item) => item.family === 4) ?? records[0];
  return { address: record.address, family: record.family };
}

export async function validateWebhookUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("WEBHOOK_URL_NOT_ALLOWED"); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || (process.env.NODE_ENV !== "test" && url.protocol !== "https:")) {
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }
  try { await resolvePublicAddress(url.hostname.replace(/^\[|\]$/g, "")); }
  catch (error) {
    if (error instanceof Error && error.message === "WEBHOOK_URL_NOT_ALLOWED") throw error;
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }
}

export async function postWebhook(urlValue: string, headers: Record<string, string>, body: string) {
  const url = new URL(urlValue);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const resolved = await resolvePublicAddress(hostname);
  const client = url.protocol === "https:" ? https : http;

  return new Promise<number>((resolve, reject) => {
    const request = client.request({
      protocol: url.protocol, hostname, port: url.port || undefined,
      path: `${url.pathname}${url.search}`, method: "POST", headers,
      lookup: (_hostname, _options, callback) => callback(null, resolved.address, resolved.family),
    }, (response) => { response.resume(); resolve(response.statusCode ?? 0); });
    request.setTimeout(WEBHOOK_TIMEOUT_MS, () => request.destroy(new Error("WEBHOOK_TIMEOUT")));
    request.on("error", reject); request.write(body); request.end();
  });
}

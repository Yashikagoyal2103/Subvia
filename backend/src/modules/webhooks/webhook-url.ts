import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const WEBHOOK_TIMEOUT_MS = 10_000;

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((value, part) => value * 256 + Number(part), 0) >>> 0;
}

function isPrivateIpv4(ip: string) {
  const value = ipv4ToNumber(ip);
  const ranges = [
    [0x00000000, 0xff000000],
    [0x0a000000, 0xff000000],
    [0x64400000, 0xffc00000],
    [0x7f000000, 0xff000000],
    [0xa9fe0000, 0xffff0000],
    [0xac100000, 0xfff00000],
    [0xc0000000, 0xffffff00],
    [0xc0000200, 0xffffff00],
    [0xc0a80000, 0xffff0000],
    [0xc6120000, 0xfffe0000],
    [0xc6336400, 0xffffff00],
    [0xcb007100, 0xffffff00],
    [0xe0000000, 0xf0000000],
  ] as const;

  return ranges.some(([network, mask]) => (value & mask) === network);
}

function expandIpv6(ip: string) {
  const normalized = ip.toLowerCase().split("%")[0];
  const halves = normalized.split("::");

  if (halves.length > 2) {
    return null;
  }

  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];

  const expandPart = (part: string) => {
    if (!part.includes(".")) return [part];

    const octets = part.split(".");
    if (octets.length !== 4 || octets.some((octet) => !/^\d+$/.test(octet) || Number(octet) > 255)) {
      return null;
    }

    const value = ipv4ToNumber(part);
    return [(value >>> 16).toString(16), (value & 0xffff).toString(16)];
  };

  const leftExpanded = left.flatMap((part) => expandPart(part) ?? []);
  const rightExpanded = right.flatMap((part) => expandPart(part) ?? []);

  if (leftExpanded.length + rightExpanded.length > 8) {
    return null;
  }

  const missing = 8 - leftExpanded.length - rightExpanded.length;
  if (halves.length === 1 && missing !== 0) {
    return null;
  }

  return [...leftExpanded, ...Array(missing).fill("0"), ...rightExpanded].map((part) => parseInt(part, 16));
}

function isPrivateIpv6(ip: string) {
  const parts = expandIpv6(ip);
  if (!parts) return true;

  const allZero = parts.every((part) => part === 0);
  if (allZero || (parts[0] === 0 && parts[7] === 1)) return true;

  const firstByte = parts[0] >> 8;
  const secondByte = parts[0] & 0xff;

  if (firstByte === 0xff) return true;
  if (firstByte === 0xfc || firstByte === 0xfd) return true;
  if (firstByte === 0xfe && secondByte >= 0x80 && secondByte <= 0xbf) return true;

  const isMappedIpv4 = parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff;
  if (isMappedIpv4) {
    const ipv4 = `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`;
    return isPrivateIpv4(ipv4);
  }

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
    if (isBlockedAddress(hostname)) {
      throw new Error("WEBHOOK_URL_NOT_ALLOWED");
    }
    return { address: hostname, family };
  }

  const records = await dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (records.length === 0 || records.some((record) => isBlockedAddress(record.address))) {
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }

  const record = records.find((item) => item.family === 4) ?? records[0];
  return { address: record.address, family: record.family };
}

export async function validateWebhookUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }

  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error("WEBHOOK_URL_NOT_ALLOWED");
  }

  try {
    await resolvePublicAddress(url.hostname.replace(/^\[|\]$/g, ""));
  } catch (error) {
    if (error instanceof Error && error.message === "WEBHOOK_URL_NOT_ALLOWED") {
      throw error;
    }
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
      protocol: url.protocol,
      hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers,
      lookup: (_hostname, _options, callback) => {
        callback(null, resolved.address, resolved.family);
      },
    }, (response) => {
      response.resume();
      resolve(response.statusCode ?? 0);
    });

    request.setTimeout(WEBHOOK_TIMEOUT_MS, () => {
      request.destroy(new Error("WEBHOOK_TIMEOUT"));
    });

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

const API_BASE = 'https://api.cloudflare.com/client/v4';

const env = process.env;
const accountId = required('CLOUDFLARE_ACCOUNT_ID');
const apiToken = required('CLOUDFLARE_API_TOKEN');
const zoneName = env.CLOUDFLARE_ZONE_NAME || 'dotagents.app';
const pagesProject = env.CLOUDFLARE_PAGES_PROJECT || 'dotagents-docs';
const pagesTarget = env.CLOUDFLARE_PAGES_TARGET || `${pagesProject}.pages.dev`;
const pagesDomains = listEnv('CLOUDFLARE_DOCS_DOMAINS', [
  'dotagents.app',
  'www.dotagents.app',
  'docs.dotagents.app',
]);
const dnsNames = listEnv('CLOUDFLARE_DOCS_DNS_NAMES', [
  'dotagents.app',
  'www.dotagents.app',
]);

function required(name) {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function listEnv(name, fallback) {
  const raw = env[name];
  if (!raw) {
    return fallback;
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function cloudflare(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok || payload.success === false) {
    const message =
      payload.errors
        ?.map((error) => `${error.code || 'error'} ${error.message}`)
        .join('; ') || text;
    throw new Error(
      `Cloudflare API ${options.method || 'GET'} ${path} failed (${response.status}): ${message}`,
    );
  }

  return payload;
}

async function getZoneId() {
  if (env.CLOUDFLARE_ZONE_ID) {
    return env.CLOUDFLARE_ZONE_ID;
  }

  const payload = await cloudflare(`/zones?name=${encodeURIComponent(zoneName)}&per_page=1`);
  const zone = payload.result?.[0];
  if (!zone?.id) {
    throw new Error(`Cloudflare zone not found: ${zoneName}`);
  }
  return zone.id;
}

async function ensurePagesDomains() {
  const path = `/accounts/${accountId}/pages/projects/${pagesProject}/domains`;
  const payload = await cloudflare(path);
  const existing = new Set((payload.result || []).map((domain) => domain.name));

  for (const domain of pagesDomains) {
    if (existing.has(domain)) {
      console.log(`pages domain exists: ${domain}`);
      continue;
    }

    await cloudflare(path, {
      method: 'POST',
      body: JSON.stringify({name: domain}),
    });
    console.log(`pages domain added: ${domain}`);
  }
}

async function listDnsRecords(zoneId, name) {
  const records = [];
  let page = 1;

  while (true) {
    const payload = await cloudflare(
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&per_page=100&page=${page}`,
    );
    records.push(...(payload.result || []));

    const totalPages = payload.result_info?.total_pages || 1;
    if (page >= totalPages) {
      return records;
    }
    page += 1;
  }
}

async function syncDnsRecord(zoneId, name) {
  const records = await listDnsRecords(zoneId, name);
  const desiredContent = pagesTarget.replace(/\.$/, '');
  const conflictingTypes = new Set(['A', 'AAAA', 'CNAME']);
  const desired = records.find(
    (record) =>
      record.type === 'CNAME' && String(record.content).replace(/\.$/, '') === desiredContent,
  );

  for (const record of records) {
    if (!conflictingTypes.has(record.type) || record.id === desired?.id) {
      continue;
    }

    await cloudflare(`/zones/${zoneId}/dns_records/${record.id}`, {
      method: 'DELETE',
    });
    console.log(`dns record deleted: ${name} ${record.type} ${record.content}`);
  }

  const body = {
    type: 'CNAME',
    name,
    content: desiredContent,
    ttl: 1,
    proxied: true,
    comment: 'Managed by dotagents-mono docs deploy',
  };

  if (desired) {
    await cloudflare(`/zones/${zoneId}/dns_records/${desired.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    console.log(`dns record updated: ${name} -> ${desiredContent}`);
    return;
  }

  await cloudflare(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  console.log(`dns record created: ${name} -> ${desiredContent}`);
}

async function printPagesDomainStatus() {
  const payload = await cloudflare(
    `/accounts/${accountId}/pages/projects/${pagesProject}/domains`,
  );
  const wanted = new Set(pagesDomains);

  for (const domain of payload.result || []) {
    if (!wanted.has(domain.name)) {
      continue;
    }

    const error = domain.verification_data?.error_message;
    console.log(
      `pages domain status: ${domain.name} ${domain.status}${error ? ` (${error})` : ''}`,
    );
  }
}

async function main() {
  console.log(`syncing Cloudflare Pages domains for ${pagesProject}`);
  await ensurePagesDomains();

  const zoneId = await getZoneId();
  for (const name of dnsNames) {
    await syncDnsRecord(zoneId, name);
  }

  await printPagesDomainStatus();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

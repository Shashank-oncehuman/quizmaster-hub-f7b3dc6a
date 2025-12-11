import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowlist of domains that can be proxied
const ALLOWED_DOMAINS = [
  'studyuk.site',
  'classx.co.in',
  'testseries-assets.classx.co.in',
  'appx.co.in',
  'akamai.net.in'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      console.error('Missing url parameter');
      return new Response(
        JSON.stringify({ error: 'Missing url parameter', data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      console.error('Invalid URL format:', targetUrl);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format', data: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the domain is in the allowlist (SSRF protection)
    const targetHost = parsedUrl.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      targetHost === domain || targetHost.endsWith('.' + domain)
    );

    if (!isAllowed) {
      console.error('Domain not allowed:', targetHost);
      return new Response(
        JSON.stringify({ error: 'Domain not allowed', data: [] }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying request to:', targetUrl);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    
    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response preview:', text.substring(0, 500));

    // Check if response looks like HTML (error page)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<div')) {
      console.warn('Received HTML instead of JSON - external API error');
      return new Response(
        JSON.stringify({ error: 'External API returned error page', data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Failed to parse JSON response');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response', data: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch data', message: errorMessage, data: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

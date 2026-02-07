#!/usr/bin/env node

/**
 * Command-line interface for subconverter
 * Usage: subconverter --url <subscription-url> --target <format> [options]
 */

import { subconvert } from './index.js';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    target: null,
    output: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--url' || arg === '-u') {
      options.url = args[++i];
    } else if (arg === '--target' || arg === '-t') {
      options.target = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    }
  }

  return options;
}

// Show help message
function showHelp() {
  console.log(`
Subconverter CLI - Convert proxy subscriptions between formats

Usage: subconverter --url <subscription-url> --target <format> [options]

Options:
  -u, --url <url>       Subscription URL or file path to convert (required)
  -t, --target <format> Target format (required)
                        Supported: clash, clashr, surge, quanx, v2ray,
                                   ss, ssr, trojan, mixed, singbox
  -o, --output <file>   Output file path (default: stdout)
  -h, --help           Show this help message

Examples:
  # Convert to Clash and output to file
  subconverter --url "https://example.com/sub" --target clash --output clash.yaml

  # Convert local file to Surge
  subconverter --url ./subscription.txt --target surge

  # Convert to V2Ray JSON format
  subconverter -u "https://example.com/sub" -t v2ray -o v2ray.json

Supported target formats:
  clash, clashr  - Clash YAML configuration
  surge          - Surge configuration
  quanx          - Quantumult X configuration
  v2ray          - V2Ray JSON configuration
  singbox        - SingBox JSON configuration
  ss, ssr        - Shadowsocks/ShadowsocksR links
  trojan         - Trojan links
  mixed          - Mixed format (all proxy types)
`);
}

// Fetch URL content
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    // Set a timeout and follow redirects
    const request = client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'subconverter-cli/1.0'
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Load content from URL or file
async function loadContent(urlOrPath) {
  // Check if it's a URL
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return await fetchUrl(urlOrPath);
  }
  
  // Otherwise treat as file path
  try {
    return fs.readFileSync(urlOrPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.url) {
    console.error('Error: --url parameter is required\n');
    showHelp();
    process.exit(1);
  }

  if (!options.target) {
    console.error('Error: --target parameter is required\n');
    showHelp();
    process.exit(1);
  }

  try {
    // Load subscription content
    const isUrl = options.url.startsWith('http://') || options.url.startsWith('https://');
    console.error(`${isUrl ? 'Fetching' : 'Loading'} subscription from: ${options.url}`);
    const subscriptionContent = await loadContent(options.url);
    
    // Convert subscription
    console.error(`Converting to ${options.target} format...`);
    const result = subconvert(subscriptionContent, options.target);

    // Output result
    if (options.output) {
      fs.writeFileSync(options.output, result, 'utf-8');
      console.error(`Successfully saved to: ${options.output}`);
    } else {
      console.log(result);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

import { subconvert } from '../src/index.js';

const DEFAULT_TARGET = 'clash';
const JSON_TARGETS = new Set(['v2ray', 'singbox']);

const CUSTOM_CONFIG = {
  clashOptions: {
    logLevel: 'info',
    groups: [
      {
        name: 'select',
        type: 'select',
        'include-all': true
      },
      {
        name: 'auto',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        'include-all': true
      },
      {
        name: 'AI Services',
        type: 'url-test',
        url: 'http://www.gstatic.com/generate_204',
        interval: 300,
        'include-all': true,
        filter: '(?i)美国'
      }
    ],
    ruleProviders: {
      reject: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
        path: './ruleset/reject.yaml',
        interval: 86400
      },
      icloud: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt',
        path: './ruleset/icloud.yaml',
        interval: 86400
      },
      apple: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt',
        path: './ruleset/apple.yaml',
        interval: 86400
      },
      google: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt',
        path: './ruleset/google.yaml',
        interval: 86400
      },
      proxy: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
        path: './ruleset/proxy.yaml',
        interval: 86400
      },
      direct: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
        path: './ruleset/direct.yaml',
        interval: 86400
      },
      private: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt',
        path: './ruleset/private.yaml',
        interval: 86400
      },
      gfw: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
        path: './ruleset/gfw.yaml',
        interval: 86400
      },
      'tld-not-cn': {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt',
        path: './ruleset/tld-not-cn.yaml',
        interval: 86400
      },
      telegramcidr: {
        type: 'http',
        behavior: 'ipcidr',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt',
        path: './ruleset/telegramcidr.yaml',
        interval: 86400
      },
      cncidr: {
        type: 'http',
        behavior: 'ipcidr',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt',
        path: './ruleset/cncidr.yaml',
        interval: 86400
      },
      lancidr: {
        type: 'http',
        behavior: 'ipcidr',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt',
        path: './ruleset/lancidr.yaml',
        interval: 86400
      },
      applications: {
        type: 'http',
        behavior: 'classical',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt',
        path: './ruleset/applications.yaml',
        interval: 86400
      }
    },
    rules: [
      // local networks
      'DOMAIN-SUFFIX,local,DIRECT',
      'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
      'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
      'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
      'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
      'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
      'IP-CIDR6,::1/128,DIRECT,no-resolve',
      'IP-CIDR6,fc00::/7,DIRECT,no-resolve',
      'IP-CIDR6,fe80::/10,DIRECT,no-resolve',
      'IP-CIDR6,fd00::/8,DIRECT,no-resolve',
      // AI Services
      'DOMAIN-KEYWORD,gemini,AI Services',
      'DOMAIN-KEYWORD,youtube,AI Services',
      'DOMAIN-KEYWORD,google,AI Services',
      'DOMAIN-KEYWORD,chatgpt,AI Services',
      'DOMAIN-KEYWORD,livekit,AI Services',
      'DOMAIN-KEYWORD,openai,AI Services',
      'DOMAIN-KEYWORD,claude,AI Services',
      'DOMAIN-KEYWORD,anthropic,AI Services',
      'DOMAIN-KEYWORD,openrouter,AI Services',
      'DOMAIN-SUFFIX,chat.com,AI Services',
      'DOMAIN-SUFFIX,sora.com,AI Services',
      'DOMAIN-SUFFIX,chat.com,AI Services',
      // Rulesets
      'RULE-SET,applications,DIRECT',
      'RULE-SET,private,DIRECT',
      'RULE-SET,reject,REJECT',
      'RULE-SET,gfw,auto',
      'RULE-SET,telegramcidr,auto',
      'MATCH,DIRECT'
    ]
  },
  outputJson: false
};

function getContentType(target, outputJson) {
  if (outputJson || JSON_TARGETS.has(target)) {
    return 'application/json; charset=utf-8';
  }
  return 'text/plain; charset=utf-8';
}

export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);
    const subscriptionUrl = searchParams.get('url');
    if (!subscriptionUrl) {
      return new Response('Missing url parameter.', { status: 400 });
    }

    const target = (searchParams.get('target') || DEFAULT_TARGET).toLowerCase();

    let subscriptionResponse;
    try {
      subscriptionResponse = await fetch(subscriptionUrl);
    } catch (error) {
      return new Response('Failed to fetch subscription.', { status: 502 });
    }

    if (!subscriptionResponse.ok) {
      return new Response(`Failed to fetch subscription: ${subscriptionResponse.status}`, { status: 502 });
    }

    const subscriptionString = await subscriptionResponse.text();

    try {
      const result = subconvert(subscriptionString, target, CUSTOM_CONFIG);
      return new Response(result, {
        headers: {
          'content-type': getContentType(target, CUSTOM_CONFIG.outputJson)
        }
      });
    } catch (error) {
      return new Response(`Conversion failed: ${error.message}`, { status: 400 });
    }
  }
};

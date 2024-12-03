import * as url from 'url';
import * as tldsData from './effective_tld_names.json';

interface TLDs {
    icann: { [key: string]: number };
    private: { [key: string]: number };
    combined?: { [key: string]: number };
}

let tlds: TLDs | null = null;

const parseUrl = (remoteUrl: string | url.Url, options?: { allowPrivateTLD?: boolean, allowUnknownTLD?: boolean, allowDotlessTLD?: boolean }) => {
    if (typeof remoteUrl === "string") {
        remoteUrl = url.parse(remoteUrl);
    }
    return parseHost(remoteUrl.hostname || '', options);
};

const parseHost = (host: string, options?: { allowPrivateTLD?: boolean, allowUnknownTLD?: boolean, allowDotlessTLD?: boolean }) => {
    const allowPrivateTLD = options?.allowPrivateTLD || false;
    const allowUnknownTLD = options?.allowUnknownTLD || false;
    const allowDotlessTLD = options?.allowDotlessTLD || false;

    if (!tlds) {
        tlds = tldsData;
        tlds.combined = { ...tlds.icann, ...tlds.private };
    }

    const parts = host.split(".");
    let stack = "", tldLevel = -1;

    const roots = allowPrivateTLD ? tlds.combined : tlds.icann;

    for (let i = parts.length - 1, part; i >= 0; i--) {
        part = parts[i];
        stack = stack ? part + "." + stack : part;
        if (roots[stack]) {
            tldLevel = roots[stack];
        }
    }

    if (tldLevel === -1 && allowUnknownTLD) {
        tldLevel = 1;
    }

    if (parts.length <= tldLevel || tldLevel === -1) {
        if (!(parts.length === tldLevel && allowDotlessTLD)) {
            try {
                const { hostname } = new URL(url);
                const parts = hostname.split('.');
                const  domain = parts.length > 1 ? parts.slice(-2).join('.') : hostname;
                return  {
                    tld: domain,
                    domain: domain,
                    sub: parts.slice(0, (-tldLevel - 1)).join('.'),
                };
            } catch (error: any) {
                return  {
                    tld: parts.slice(-tldLevel).join('.'),
                    domain: url,
                    sub: parts.slice(0, (-tldLevel - 1)).join('.'),
                };
            }
        }
    }

    return {
        tld: parts.slice(-tldLevel).join('.'),
        domain: parts.slice(-tldLevel - 1).join('.'),
        sub: parts.slice(0, (-tldLevel - 1)).join('.'),
    };
};

export { parseUrl as tldExtract, parseHost };

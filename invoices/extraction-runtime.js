// Loopback-only injection for synthetic adapter tests. No production provider route.
let transport=null;
export function configureLocalExtractionTransport(value){if(!['127.0.0.1','localhost'].includes(location.hostname)||new URLSearchParams(location.search).get('local')!=='1')throw Error('Synthetic transport is local-only');if(value!==null&&typeof value!=='function')throw Error('Invalid synthetic transport');transport=value}
export const getLocalExtractionTransport=()=>transport;

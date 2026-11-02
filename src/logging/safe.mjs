export function safeLogRecord(args,level) {
 const object=args.find(value=>value && typeof value==='object') || {},error=object.err || object.error;
 const code=error?.code || error?.cause?.code;
 return {event:level>=50?'cms_error':level>=40?'cms_warning':'cms_event',
  ...(typeof code==='string' && /^[0-9A-Z]{5}$/.test(code)?{code}:{}),
  ...(Number.isInteger(error?.status) && error.status>=400 && error.status<=599?{status:error.status}:{}),
  ...(typeof object.correlationId==='string' && /^[a-f0-9-]{36}$/.test(object.correlationId)?{correlationId:object.correlationId}:{}),
  ...(Number.isSafeInteger(object.assetId)?{assetId:object.assetId}:{}),
 };
}

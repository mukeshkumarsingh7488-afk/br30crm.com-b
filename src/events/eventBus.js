const subscribers = new Map();
const subscribe = (event, handler) => {
  if (!subscribers.has(event)) subscribers.set(event, new Set());
  subscribers.get(event).add(handler);
  return () => subscribers.get(event)?.delete(handler);
};
const publish = async (event, payload = {}) => {
  const handlers = [...(subscribers.get(event) || []), ...(subscribers.get("*") || [])];
  await Promise.allSettled(handlers.map((handler) => Promise.resolve().then(() => handler(payload, event))));
  return { event, handlers: handlers.length };
};
const listSubscribers = () => Object.fromEntries([...subscribers.entries()].map(([k, v]) => [k, v.size]));
module.exports = { subscribe, publish, listSubscribers };

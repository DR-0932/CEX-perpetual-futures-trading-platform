import { redisSub } from "@cex/redis";
import type { UserEvent, MarketEvent } from "@cex/shared";

type Callback = (event: UserEvent | MarketEvent) => void;

const listeners = new Map<string, Set<Callback>>();
const subscribed = new Set<string>();
const pending = new Map<string, Promise<void>>();

redisSub.on("message", (channel: string, raw: string) => {
  const cbs = listeners.get(channel);
 
  if (!cbs || cbs.size === 0) return;

  let event: UserEvent | MarketEvent;
 
  try {
    event = JSON.parse(raw) as UserEvent | MarketEvent;
  } catch {
    console.error("[redis-sub] bad JSON on", channel);
    return;
  }

  for (const cb of cbs) {
    try {
      cb(event);
    } catch (err) {
      console.error("[redis-sub] callback error on", channel, err);
    }
  }
});

export async function subscribeChannel(
  channel: string,
  cb: Callback,
): Promise<void> {
  let set = listeners.get(channel);
  if (!set) {
    set = new Set();
    listeners.set(channel, set);
  }
  set.add(cb);

  if (subscribed.has(channel)) return;

  // share one in-flight subscribe between concurrent callers
  let p = pending.get(channel);
  if (!p) {
    p = redisSub
      .subscribe(channel)
      .then(() => {
        subscribed.add(channel);
      })
      .finally(() => {
        pending.delete(channel);
      });
    pending.set(channel, p);
  }

  try {
    await p;
  } catch (err) {
    // roll back so the next call can retry
    const current = listeners.get(channel);
    current?.delete(cb);
    if (current && current.size === 0) listeners.delete(channel);
    throw err;
  }
}

export async function unsubscribeChannel(
  channel: string,
  cb: Callback,
): Promise<void> {
  const set = listeners.get(channel);
  if (!set) return;

  set.delete(cb);
  if (set.size > 0) return;

  listeners.delete(channel);

  // wait for any in-flight subscribe before unsubscribing
  const p = pending.get(channel);
  if (p) await p.catch(() => {});

  // someone subscribed again while we were waiting
  if (listeners.has(channel)) return;

  subscribed.delete(channel);
  await redisSub.unsubscribe(channel);
}

export async function closeSubscriber(): Promise<void> {
  listeners.clear();
  subscribed.clear();
  pending.clear();
  await redisSub.quit().catch(() => {});
}
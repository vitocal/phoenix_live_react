/*
 * Svelte synchronization with Phoenix LiveStreams
 */
export interface ILiveStream {
    name: string,
    inserts: ILiveStreamDeltaInsert[],
    deletes: ILiveStreamDeltaDelete[]
}
export type ILiveStreamDeltaInsert = [string, number, any, number | null]
export type ILiveStreamDeltaDelete = string
export type ILiveStreamItem = Record<any, any> & { dom_id: string }

export function LiveStreamItem(delta: ILiveStreamDeltaInsert): ILiveStreamItem {
    const [dom_id, _at, item, _length] = delta;
    return { ...item, dom_id };
}

/**
 * Holds the streamed collections
 */
let liveStreamItems: Record<string, ILiveStreamItem[]> = {};

/**
  Reads the `stream` updates and returns a array for svelte.

  @usage: In your svelte file:
  <script>
   export let items = from_stream(stream);
   export let stream;

   // Setup updates from stream
   $: { items = from_stream(stream) }
  </script>

   {#each items as item (item.dom_id)}
     <Post post={item} {live} />
   {/each}

 */
export function from_stream(stream: ILiveStream): ILiveStreamItem[] {
    let items = liveStreamItems[stream.name] || [];
    if (stream.inserts.length >= 1) {
        insert(stream.inserts);
    } else if (stream.deletes.length >= 1) {
        deletes(stream.deletes);
    }

    commit();
    return items;

    /** Find item id corresponding to dom_id */
    function findItemIdx(dom_id: string): number {
        return items.findIndex((item) => item.dom_id === dom_id)
    }

    /** Remove items */
    function deletes(streamed_deletes: ILiveStreamDeltaDelete[]) {
        items = items.filter(item => !streamed_deletes.includes(item.dom_id));
    }

    /**
     * Insert many or update a single item
     */
    function insert(streamed_inserts: ILiveStreamDeltaInsert[]) {
        if (streamed_inserts.length > 1) {
            items = [...items, ...streamed_inserts.map(LiveStreamItem).filter((item) => findItemIdx(item.dom_id) == -1)];
        } else {
            const [dom_id, at, _item, _length] = streamed_inserts[0];
            const item = LiveStreamItem(streamed_inserts[0]);
            const is_edit = findItemIdx(dom_id);

            if (is_edit >= 0) {
                items[findItemIdx(dom_id)] = item;
            } else {
                const end = (at >= 0 ? at : items.length);
                items = [
                    ...items.slice(0, end),
                    item,
                    ...items.slice(end, items.length)
                ];
            }
        }
    };

    function commit() {
        liveStreamItems[stream.name] = items;
    }
}

/**
 * Reset the stream items
 */
export function reset_stream(stream: ILiveStream): ILiveStreamItem[] {
    liveStreamItems[stream.name] = []
    return liveStreamItems[stream.name];
}
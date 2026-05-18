module lethe::npc {
    use std::string::String;
    use std::vector;
    use sui::object::UID;
    use sui::object;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::clock::Clock;

    public struct NPC has key {
        id: UID,
        name: String,
        memories: vector<MemoryEntry>,
    }

    public struct MemoryEntry has store, copy, drop {
        player_address: address,
        blob_id: String,
        timestamp_ms: u64,
    }

    public entry fun create_npc(name: vector<u8>, ctx: &mut TxContext) {
        let npc = NPC {
            id: object::new(ctx),
            name: std::string::utf8(name),
            memories: vector[],
        };
        transfer::share_object(npc);
    }

    public entry fun add_memory(npc: &mut NPC, blob_id: vector<u8>, clock: &Clock, ctx: &TxContext) {
        let entry = MemoryEntry {
            player_address: sui::tx_context::sender(ctx),
            blob_id: std::string::utf8(blob_id),
            timestamp_ms: sui::clock::timestamp_ms(clock),
        };
        vector::push_back(&mut npc.memories, entry);
    }

    public fun get_memories_for(npc: &NPC, player: address): vector<MemoryEntry> {
        let mut result = vector[];
        let mut i = 0;
        let len = vector::length(&npc.memories);
        while (i < len) {
            let entry = vector::borrow(&npc.memories, i);
            if (entry.player_address == player) {
                vector::push_back(&mut result, *entry);
            };
            i = i + 1;
        };
        result
    }
}
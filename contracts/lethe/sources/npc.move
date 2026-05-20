module lethe::npc {
    use std::string::String;
    use std::vector;
    use sui::object::UID;
    use sui::object;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::clock::Clock;
    use sui::event;
    use sui::clock::timestamp_ms;

    // ─── Errors ────────────────────────────────────────────────────────

    const ENotAuthorized: u64 = 1;

    // ─── Objects ───────────────────────────────────────────────────────

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

    // ─── Events ────────────────────────────────────────────────────────

    public struct NPCCreated has copy, drop {
        npc_id: ID,
        name: String,
        created_by: address,
        timestamp_ms: u64,
    }

    public struct MemoryAdded has copy, drop {
        npc_id: ID,
        player: address,
        blob_id: String,
        timestamp_ms: u64,
        memory_count: u64,
    }

    public struct MemoryForgotten has copy, drop {
        npc_id: ID,
        player: address,
        memories_removed: u64,
        timestamp_ms: u64,
    }

    // ─── Entry Functions ───────────────────────────────────────────────

    public entry fun create_npc(
        name: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let id = object::new(ctx);
        let npc_id_inner = object::uid_to_inner(&id);
        let npc_name = std::string::utf8(name);
        let npc = NPC {
            id,
            name: npc_name,
            memories: vector[],
        };
        let sender = tx_context::sender(ctx);
        let ts = timestamp_ms(clock);
        transfer::share_object(npc);
        event::emit(NPCCreated {
            npc_id: npc_id_inner,
            name: npc_name,
            created_by: sender,
            timestamp_ms: ts,
        });
    }

    public entry fun add_memory(
        npc: &mut NPC,
        blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let blob_string = std::string::utf8(blob_id);
        let entry = MemoryEntry {
            player_address: tx_context::sender(ctx),
            blob_id: blob_string,
            timestamp_ms: timestamp_ms(clock),
        };
        let count_before = vector::length(&npc.memories);
        vector::push_back(&mut npc.memories, entry);
        event::emit(MemoryAdded {
            npc_id: object::uid_to_inner(&npc.id),
            player: tx_context::sender(ctx),
            blob_id: blob_string,
            timestamp_ms: timestamp_ms(clock),
            memory_count: count_before + 1,
        });
    }

    /// Remove all memories for a specific player. Caller must be the player themselves.
    public entry fun forget_player(
        npc: &mut NPC,
        player: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == player, ENotAuthorized);

        let original_len = vector::length(&npc.memories);
        let mut filtered = vector[];
        let mut i = 0;
        while (i < original_len) {
            let entry = vector::borrow(&npc.memories, i);
            if (entry.player_address != player) {
                vector::push_back(&mut filtered, *entry);
            };
            i = i + 1;
        };

        let removed = original_len - vector::length(&filtered);
        npc.memories = filtered;

        event::emit(MemoryForgotten {
            npc_id: object::uid_to_inner(&npc.id),
            player,
            memories_removed: removed,
            timestamp_ms: timestamp_ms(clock),
        });
    }

    // ─── Read Functions ────────────────────────────────────────────────

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
/// Lethe — community head-to-head battles (foundation).
///
/// A `Battle` is a SHARED object: two artworks face off and anyone can vote
/// for a side; tallies live on-chain. Kept intentionally minimal for this
/// phase — no dedup, no close/resolve, no leaderboard (see BATTLE_DESIGN.md).
module lethe_battle::battle {
    use sui::event;

    const EBattleClosed: u64 = 1;
    const EBadSide: u64 = 2;

    const STATUS_OPEN: u8 = 0;

    /// Shared so any user can vote.
    public struct Battle has key {
        id: UID,
        artwork_a: address,
        artwork_b: address,
        votes_a: u64,
        votes_b: u64,
        status: u8,
        created_at_ms: u64,
    }

    public struct BattleCreated has copy, drop {
        battle_id: ID,
        artwork_a: address,
        artwork_b: address,
        created_at_ms: u64,
    }

    public struct Voted has copy, drop {
        battle_id: ID,
        side: u8,
        votes_a: u64,
        votes_b: u64,
        voter: address,
    }

    /// Create a battle between two artworks and share it.
    public entry fun create_battle(
        artwork_a: address,
        artwork_b: address,
        created_at_ms: u64,
        ctx: &mut TxContext,
    ) {
        let id = object::new(ctx);
        let battle_id = id.to_inner();
        let battle = Battle {
            id,
            artwork_a,
            artwork_b,
            votes_a: 0,
            votes_b: 0,
            status: STATUS_OPEN,
            created_at_ms,
        };
        event::emit(BattleCreated { battle_id, artwork_a, artwork_b, created_at_ms });
        transfer::share_object(battle);
    }

    /// Vote for a side: 0 = artwork_a, 1 = artwork_b.
    public entry fun vote(battle: &mut Battle, side: u8, ctx: &mut TxContext) {
        assert!(battle.status == STATUS_OPEN, EBattleClosed);
        assert!(side == 0 || side == 1, EBadSide);
        if (side == 0) {
            battle.votes_a = battle.votes_a + 1;
        } else {
            battle.votes_b = battle.votes_b + 1;
        };
        event::emit(Voted {
            battle_id: object::uid_to_inner(&battle.id),
            side,
            votes_a: battle.votes_a,
            votes_b: battle.votes_b,
            voter: ctx.sender(),
        });
    }

    // ─── Read helpers ───────────────────────────────────────────────────
    public fun votes(battle: &Battle): (u64, u64) { (battle.votes_a, battle.votes_b) }
    public fun status(battle: &Battle): u8 { battle.status }
}

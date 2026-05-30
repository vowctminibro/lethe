/// Lethe — community head-to-head battles.
///
/// A `Battle` is a SHARED object: two artworks face off, anyone can vote for a
/// side (one vote per address, enforced via `VecSet<address>`), and the battle
/// CREATOR can close it to declare a winner. Once closed, voting aborts.
module lethe_battle::battle {
    use sui::event;
    use sui::vec_set::{Self, VecSet};

    const EBattleClosed: u64 = 1;
    const EBadSide: u64 = 2;
    const EAlreadyVoted: u64 = 3;
    const ENotCreator: u64 = 4;

    const STATUS_OPEN: u8 = 0;
    const STATUS_CLOSED: u8 = 1;

    const SIDE_A: u8 = 0;
    const SIDE_B: u8 = 1;
    const SIDE_TIE: u8 = 2;
    const SIDE_UNRESOLVED: u8 = 255;

    const ADDR_NONE: address = @0x0;

    /// Shared so any user can vote.
    public struct Battle has key {
        id: UID,
        creator: address,
        artwork_a: address,
        artwork_b: address,
        votes_a: u64,
        votes_b: u64,
        /// Addresses that have already voted — enforces one vote per address.
        voters: VecSet<address>,
        status: u8,
        /// Meaningful only when status == closed: 0=A, 1=B, 2=tie (255 while open).
        winner_side: u8,
        /// Winning artwork id; @0x0 on a tie or while unresolved.
        winner_artwork: address,
        created_at_ms: u64,
    }

    public struct BattleCreated has copy, drop {
        battle_id: ID,
        creator: address,
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

    public struct BattleResolved has copy, drop {
        battle_id: ID,
        winner_side: u8,
        winner_artwork: address,
        votes_a: u64,
        votes_b: u64,
    }

    /// Create a battle between two artworks and share it. Sender is the creator.
    public entry fun create_battle(
        artwork_a: address,
        artwork_b: address,
        created_at_ms: u64,
        ctx: &mut TxContext,
    ) {
        let creator = ctx.sender();
        let id = object::new(ctx);
        let battle_id = id.to_inner();
        let battle = Battle {
            id,
            creator,
            artwork_a,
            artwork_b,
            votes_a: 0,
            votes_b: 0,
            voters: vec_set::empty(),
            status: STATUS_OPEN,
            winner_side: SIDE_UNRESOLVED,
            winner_artwork: ADDR_NONE,
            created_at_ms,
        };
        event::emit(BattleCreated { battle_id, creator, artwork_a, artwork_b, created_at_ms });
        transfer::share_object(battle);
    }

    /// Vote for a side: 0 = artwork_a, 1 = artwork_b. One vote per address.
    /// Aborts if the battle is closed.
    public entry fun vote(battle: &mut Battle, side: u8, ctx: &mut TxContext) {
        assert!(battle.status == STATUS_OPEN, EBattleClosed);
        assert!(side == SIDE_A || side == SIDE_B, EBadSide);

        let voter = ctx.sender();
        assert!(!vec_set::contains(&battle.voters, &voter), EAlreadyVoted);
        vec_set::insert(&mut battle.voters, voter);

        if (side == SIDE_A) {
            battle.votes_a = battle.votes_a + 1;
        } else {
            battle.votes_b = battle.votes_b + 1;
        };
        event::emit(Voted {
            battle_id: object::uid_to_inner(&battle.id),
            side,
            votes_a: battle.votes_a,
            votes_b: battle.votes_b,
            voter,
        });
    }

    /// Close an open battle and declare the winner. Creator only. A tie
    /// (equal votes) closes cleanly with winner_side = 2 and no winning artwork.
    public entry fun resolve_battle(battle: &mut Battle, ctx: &mut TxContext) {
        assert!(battle.status == STATUS_OPEN, EBattleClosed);
        assert!(ctx.sender() == battle.creator, ENotCreator);

        battle.status = STATUS_CLOSED;
        if (battle.votes_a > battle.votes_b) {
            battle.winner_side = SIDE_A;
            battle.winner_artwork = battle.artwork_a;
        } else if (battle.votes_b > battle.votes_a) {
            battle.winner_side = SIDE_B;
            battle.winner_artwork = battle.artwork_b;
        } else {
            battle.winner_side = SIDE_TIE;
            battle.winner_artwork = ADDR_NONE;
        };

        event::emit(BattleResolved {
            battle_id: object::uid_to_inner(&battle.id),
            winner_side: battle.winner_side,
            winner_artwork: battle.winner_artwork,
            votes_a: battle.votes_a,
            votes_b: battle.votes_b,
        });
    }

    // ─── Read helpers ───────────────────────────────────────────────────
    public fun votes(battle: &Battle): (u64, u64) { (battle.votes_a, battle.votes_b) }
    public fun status(battle: &Battle): u8 { battle.status }
    public fun creator(battle: &Battle): address { battle.creator }
    public fun winner_side(battle: &Battle): u8 { battle.winner_side }
    public fun winner_artwork(battle: &Battle): address { battle.winner_artwork }
    public fun has_voted(battle: &Battle, who: address): bool {
        vec_set::contains(&battle.voters, &who)
    }
}

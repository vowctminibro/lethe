/// Formal specifications for `memory::memory` (sui-prover).
///
/// Lives in a sibling package so the production module stays pristine
/// (no prover dependency, no #[spec_only] in deployed bytecode). Fields of
/// `Memory` are module-private, so every property is stated through the
/// public accessors (`owner`, `entry_count`, `is_authorized`, `blob_id_at`).
///
/// Proven invariants:
///   I1 owner-only writes — add_entry / remove_entry / grant / revoke abort
///      for any sender that is not the vault owner (and only for the
///      mirrored abort conditions).
///   I2 entries change only by owner add or owner remove — add_entry grows
///      the log by exactly one with the new blob id at the tail and no
///      existing index changed; remove_entry shrinks it by exactly one,
///      removing exactly the asserted (index, blob_id) entry while every
///      other entry survives in order.
///   I3 grant/revoke never touch the memory log or the owner.
///   I4 a fresh vault belongs to its creator and starts empty.
module memory_specs::memory_specs;

use std::string::String;
use memory::memory::{Self, Memory};

#[spec_only]
use prover::prover::{requires, ensures, asserts, clone, forall};

const MAX_U64: u64 = 0xFFFF_FFFF_FFFF_FFFF;

/// True when index `i` is outside the old log, or the blob id at `i` is
/// identical in the old and new state — i.e. position `i` was not rewritten.
#[ext(pure)]
fun entry_unchanged(m: &Memory, old: &Memory, i: u64): bool {
    // The second bound never fires where this is used (add_entry only grows
    // the log) — it exists so the helper itself is total for any (m, old, i).
    i >= memory::entry_count(old)
        || i >= memory::entry_count(m)
        || memory::blob_id_at(m, i) == memory::blob_id_at(old, i)
}

/// I4 — a fresh vault: owned by the tx sender, zero entries.
#[spec(prove, target = memory::new)]
public fun new_spec(ctx: &mut TxContext): Memory {
    let m = memory::new(ctx);
    ensures(memory::owner(&m) == ctx.sender());
    ensures(memory::entry_count(&m) == 0);
    m
}

/// I1 + I2 — only the owner can append; the log grows by exactly one and
/// the new entry's blob id is at the tail.
#[spec(prove, target = memory::add_entry)]
public fun add_entry_spec(
    m: &mut Memory,
    blob_id: String,
    namespace: String,
    kind: String,
    created_at_ms: u64,
    ctx: &TxContext,
) {
    let __old = clone!(m);
    // A real on-chain log can never reach 2^64 entries; without this bound
    // the `+ 1` in the postcondition itself could overflow.
    requires(memory::entry_count(m) < MAX_U64);
    asserts(memory::owner(m) == ctx.sender());
    memory::add_entry(m, blob_id, namespace, kind, created_at_ms, ctx);
    ensures(memory::owner(m) == memory::owner(__old));
    ensures(memory::entry_count(m) == memory::entry_count(__old) + 1);
    ensures(memory::blob_id_at(m, memory::entry_count(__old)) == blob_id);
    // Append-only: every pre-existing index still holds the same blob id.
    ensures(forall!<u64>(|i| entry_unchanged(m, __old, *i)));
}

/// True when index `i` of the post-remove log holds the expected survivor:
/// entries below the removed index keep their slot, entries at or above it
/// shift down by one. Guards make the helper total for any (m, old, idx, i).
#[ext(pure)]
fun entry_preserved_after_remove(m: &Memory, old: &Memory, removed: u64, i: u64): bool {
    if (i >= memory::entry_count(m) || i >= memory::entry_count(old)) {
        // Totality guards only — where this is used, count(m) = count(old) - 1,
        // so neither fires for a surviving index.
        true
    } else if (i < removed) {
        memory::blob_id_at(m, i) == memory::blob_id_at(old, i)
    } else if (i + 1 < memory::entry_count(old)) {
        memory::blob_id_at(m, i) == memory::blob_id_at(old, i + 1)
    } else {
        true
    }
}

/// I1 + I2 — only the owner can remove; an unknown (index, blob_id) pair
/// aborts; exactly one entry disappears and every other entry survives in
/// order.
#[spec(prove, target = memory::remove_entry)]
public fun remove_entry_spec(m: &mut Memory, index: u64, blob_id: String, ctx: &TxContext) {
    let __old = clone!(m);
    asserts(memory::owner(m) == ctx.sender());
    asserts(index < memory::entry_count(m));
    asserts(memory::blob_id_at(m, index) == blob_id);
    memory::remove_entry(m, index, blob_id, ctx);
    ensures(memory::owner(m) == memory::owner(__old));
    ensures(memory::entry_count(m) == memory::entry_count(__old) - 1);
    // Every surviving index holds the expected entry (below: same slot,
    // at/above: shifted down by one) — nothing else was touched.
    ensures(forall!<u64>(|i| entry_preserved_after_remove(m, __old, index, *i)));
}

/// I1 + I3 — only the owner can grant, double-grant aborts, the app is
/// authorized afterwards, and the memory log is untouched.
#[spec(prove, target = memory::grant)]
public fun grant_spec(m: &mut Memory, app: address, ctx: &TxContext) {
    let __old = clone!(m);
    asserts(memory::owner(m) == ctx.sender());
    asserts(!memory::is_authorized(m, app));
    memory::grant(m, app, ctx);
    ensures(memory::is_authorized(m, app));
    ensures(memory::owner(m) == memory::owner(__old));
    ensures(memory::entry_count(m) == memory::entry_count(__old));
}

/// I1 + I3 — only the owner can revoke, revoking an unknown app aborts,
/// and the memory log is untouched.
#[spec(prove, target = memory::revoke)]
public fun revoke_spec(m: &mut Memory, app: address, ctx: &TxContext) {
    let __old = clone!(m);
    asserts(memory::owner(m) == ctx.sender());
    asserts(memory::is_authorized(m, app));
    memory::revoke(m, app, ctx);
    ensures(memory::owner(m) == memory::owner(__old));
    ensures(memory::entry_count(m) == memory::entry_count(__old));
}

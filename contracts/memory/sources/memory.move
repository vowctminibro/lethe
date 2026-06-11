/// Lethe — user-owned, portable AI memory on Sui + Walrus/MemWal.
///
/// A `Memory` is an address-owned object: the user owns it from second one
/// (minted gasless via Enoki/zkLogin). It holds (1) the list of Walrus blob
/// references that make up the user's memory and (2) the set of app addresses
/// currently authorized to read it. The blob contents live on Walrus, encrypted
/// (SEAL) — see `.walrus-docs/walrus-client/storing-blobs.mdx`: all Walrus blobs
/// are public, so confidentiality + revocation are enforced at the encryption /
/// MemWal access layer. This object is the on-chain source of truth for
/// OWNERSHIP, the blob pointers, and the authorized-reader list.
///
/// Access control uses the central-object + authorized-list pattern rather than
/// handing out capability objects: an owned capability cannot be clawed back,
/// but entries in `authorized` can be removed — i.e. access is REVOCABLE. See
/// `.move-book-docs/book/programmability/capability.md` ("central object ...
/// valuable for revocable capabilities, where the admin can revoke the
/// capability from the user").
module memory::memory;

use std::string::String;
use sui::event;

/// Caller is not the owner of this `Memory`.
const ENotOwner: u64 = 0;
/// The app address is already in the authorized set.
const EAlreadyAuthorized: u64 = 1;
/// The app address is not in the authorized set.
const ENotAuthorized: u64 = 2;
/// No entry exists at the given index with the given blob id.
const EEntryMismatch: u64 = 3;

/// A pointer to one stored memory entry on Walrus, plus its metadata.
/// The semantic embedding + ciphertext live off-chain (MemWal/Walrus);
/// on-chain we keep only the verifiable pointer.
public struct BlobRef has store, copy, drop {
    /// Walrus blob id where the (encrypted) entry is stored.
    blob_id: String,
    /// MemWal namespace / logical store this entry belongs to.
    namespace: String,
    /// Semantic kind of the entry, e.g. "trading-style".
    kind: String,
    created_at_ms: u64,
}

/// A user-owned memory: ownership + Walrus blob refs + authorized readers.
public struct Memory has key, store {
    id: UID,
    /// The owning user's address (also the address-owner of this object).
    owner: address,
    /// All Walrus blob references that make up this memory.
    entries: vector<BlobRef>,
    /// App addresses currently authorized to read this memory.
    authorized: vector<address>,
}

public struct MemoryCreated has copy, drop {
    memory_id: ID,
    owner: address,
}

public struct EntryAdded has copy, drop {
    memory_id: ID,
    blob_id: String,
    namespace: String,
    kind: String,
    created_at_ms: u64,
}

public struct AccessGranted has copy, drop {
    memory_id: ID,
    app: address,
}

/// Emitted when the owner removes an entry (= forgets it). The event name is
/// deliberate: "MemoryForgotten" predates this module and is resurrected here.
public struct MemoryForgotten has copy, drop {
    memory_id: ID,
    blob_id: String,
}

public struct AccessRevoked has copy, drop {
    memory_id: ID,
    app: address,
}

/// Mint a fresh, empty `Memory` owned by the caller. Designed to be called
/// gasless (Enoki-sponsored) right after zkLogin sign-in.
public fun new(ctx: &mut TxContext): Memory {
    let owner = ctx.sender();
    let memory = Memory {
        id: object::new(ctx),
        owner,
        entries: vector[],
        authorized: vector[],
    };
    event::emit(MemoryCreated { memory_id: object::id(&memory), owner });
    memory
}

/// Convenience: mint a `Memory` and transfer it to the caller. Self-transfer
/// is intentional — this is the direct "mint my memory" entry point.
#[allow(lint(self_transfer))]
public fun create(ctx: &mut TxContext) {
    let memory = new(ctx);
    transfer::transfer(memory, ctx.sender());
}

/// Append a Walrus blob reference. Only the owner may write.
public fun add_entry(
    memory: &mut Memory,
    blob_id: String,
    namespace: String,
    kind: String,
    created_at_ms: u64,
    ctx: &TxContext,
) {
    assert!(memory.owner == ctx.sender(), ENotOwner);
    let entry = BlobRef { blob_id, namespace, kind, created_at_ms };
    memory.entries.push_back(entry);
    event::emit(EntryAdded {
        memory_id: object::id(memory),
        blob_id,
        namespace,
        kind,
        created_at_ms,
    });
}

/// Remove one stored entry (= forget). Only the owner may remove. Blob ids
/// are not guaranteed unique across entries, so the entry is keyed by index
/// with a blob-id assertion — exactly the intended entry is removed and the
/// order of the remaining log is preserved. The Walrus blob itself is not
/// (and cannot be) deleted here; dropping the on-chain reference orphans it.
public fun remove_entry(memory: &mut Memory, index: u64, blob_id: String, ctx: &TxContext) {
    assert!(memory.owner == ctx.sender(), ENotOwner);
    assert!(index < memory.entries.length(), EEntryMismatch);
    assert!(memory.entries[index].blob_id == blob_id, EEntryMismatch);
    memory.entries.remove(index);
    event::emit(MemoryForgotten { memory_id: object::id(memory), blob_id });
}

/// Grant an app read access. Only the owner may grant. Aborts if already
/// authorized.
public fun grant(memory: &mut Memory, app: address, ctx: &TxContext) {
    assert!(memory.owner == ctx.sender(), ENotOwner);
    assert!(!memory.authorized.contains(&app), EAlreadyAuthorized);
    memory.authorized.push_back(app);
    event::emit(AccessGranted { memory_id: object::id(memory), app });
}

/// Revoke an app's read access (= forget). Only the owner may revoke.
/// Aborts if the app was not authorized.
public fun revoke(memory: &mut Memory, app: address, ctx: &TxContext) {
    assert!(memory.owner == ctx.sender(), ENotOwner);
    let (found, idx) = memory.authorized.index_of(&app);
    assert!(found, ENotAuthorized);
    memory.authorized.remove(idx);
    event::emit(AccessRevoked { memory_id: object::id(memory), app });
}

// === Read-only accessors (judge-verifiable views) ===

public fun owner(memory: &Memory): address {
    memory.owner
}

public fun entry_count(memory: &Memory): u64 {
    memory.entries.length()
}

public fun is_authorized(memory: &Memory, app: address): bool {
    memory.authorized.contains(&app)
}

public fun blob_id_at(memory: &Memory, i: u64): String {
    memory.entries[i].blob_id
}

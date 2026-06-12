/// Seal access policy for Lethe memories.
///
/// Memory blobs are Seal-threshold-encrypted under the identity
/// `[pkg id][memory object id][nonce]` (pkg id = the FIRST version of this
/// package — Seal normalizes upgrades to the original namespace). Key servers
/// evaluate `seal_approve` via dry-run before releasing derived keys: the
/// caller may decrypt a blob ONLY if the identity's object-id prefix matches
/// the `Memory` passed in AND the caller is its owner or currently on its
/// `authorized` list — the SAME grant state the rest of the app uses, so
/// revoke = the key servers stop approving, live.
///
/// Per Seal conventions: first arg is the identity without the package-id
/// prefix, abort = deny, non-public `entry` for upgrade compatibility,
/// side-effect free.
module memory::memory_policy;

use memory::memory::Memory;

/// Caller is not the owner and holds no active grant (or wrong vault).
const ENoAccess: u64 = 0;

/// key format: [pkg id][memory object id bytes][random nonce]
fun check_policy(caller: address, id: vector<u8>, memory: &Memory): bool {
    // The encrypted identity must be namespaced to THIS vault.
    let prefix = object::id(memory).to_bytes();
    if (prefix.length() > id.length()) {
        return false
    };
    let mut i = 0;
    while (i < prefix.length()) {
        if (prefix[i] != id[i]) {
            return false
        };
        i = i + 1;
    };
    // Owner always; apps only while their grant is active.
    memory.owner() == caller || memory.is_authorized(caller)
}

entry fun seal_approve(id: vector<u8>, memory: &Memory, ctx: &TxContext) {
    assert!(check_policy(ctx.sender(), id, memory), ENoAccess);
}

#[test_only]
public fun check_policy_for_testing(caller: address, id: vector<u8>, memory: &Memory): bool {
    check_policy(caller, id, memory)
}

/// Formal specifications for `memory::memory_policy` — the Seal access policy.
///
/// Proven invariant:
///   I5 (deny-universality) — seal_approve ABORTS for every sender that is
///      neither the vault owner nor currently on its `authorized` list,
///      for ALL identities. Combined with I3 (revoke removes the grant,
///      proven in memory_specs), this is the cryptographic revocation story:
///      after revoke, the key servers can never again approve that app.
///
/// The approve direction (owner/granted + matching vault-id prefix succeeds)
/// is intentionally NOT stated here: `object::id(...).to_bytes()` is
/// uninterpreted in the prover's model, so cross-module byte-prefix
/// equivalence is not expressible — it is covered concretely by the 6 Move
/// unit tests in memory_policy_tests (owner allowed, granted-until-revoked,
/// wrong-prefix denied, entry happy/abort paths).
module memory_specs::memory_policy_specs;

use memory::memory::{Self, Memory};
use memory::memory_policy;

#[spec_only]
use prover::prover::{requires, asserts};

/// I5 — an outsider (not owner, not authorized) is rejected on every path,
/// whatever identity bytes they present. The vault is read-only by signature
/// (&Memory), so an approval attempt can never mutate grant state either.
#[spec(prove, target = memory_policy::seal_approve)]
public fun seal_approve_spec(id: vector<u8>, memory: &Memory, ctx: &TxContext) {
    requires(memory::owner(memory) != ctx.sender());
    requires(!memory::is_authorized(memory, ctx.sender()));
    asserts(false); // under the requires above, seal_approve always aborts
    memory_policy::seal_approve(id, memory, ctx);
}

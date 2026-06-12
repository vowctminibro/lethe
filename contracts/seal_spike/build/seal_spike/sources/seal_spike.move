/// THROWAWAY Phase-1 spike policy — proves the Seal encrypt → seal_approve →
/// decrypt round-trip on testnet before the real memory_policy is written.
/// Not used by the app; superseded by Phase 2. Allows decryption only by the
/// single address baked in at publish time (the deployer).
module seal_spike::seal_spike;

/// Caller is not the allowed spike address.
const ENoAccess: u64 = 0;

/// The only address allowed to decrypt spike-encrypted payloads.
const ALLOWED: address = @0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077;

/// Seal policy: first arg is the requested identity without the package-id
/// prefix; abort = deny, return = approve.
entry fun seal_approve(_id: vector<u8>, ctx: &TxContext) {
    assert!(ctx.sender() == ALLOWED, ENoAccess);
}

/// Unit tests for `memory::memory_policy` — the Seal seal_approve policy.
/// Identity format under test: [memory object id bytes][nonce] (the package-id
/// prefix is stripped by Seal before the call).
#[test_only]
module memory::memory_policy_tests;

use memory::memory::{Self, Memory};
use memory::memory_policy;
use sui::test_scenario as ts;

const OWNER: address = @0xA11CE;
const APP: address = @0xAB1;
const STRANGER: address = @0xB0B;

fun blob(s: vector<u8>): std::string::String { std::string::utf8(s) }

/// [vault object id][nonce] — the inner identity Lethe encrypts under.
fun id_for(mem: &Memory): vector<u8> {
    let mut id = object::id(mem).to_bytes();
    id.append(vector[1, 2, 3, 4]); // nonce
    id
}

fun fresh_vault(scn: &mut ts::Scenario): Memory {
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    scn.take_from_sender<Memory>()
}

#[test]
fun owner_is_allowed() {
    let mut scn = ts::begin(OWNER);
    let mem = fresh_vault(&mut scn);
    assert!(memory_policy::check_policy_for_testing(OWNER, id_for(&mem), &mem));
    scn.return_to_sender(mem);
    scn.end();
}

#[test]
fun granted_app_is_allowed_until_revoked() {
    let mut scn = ts::begin(OWNER);
    let mut mem = fresh_vault(&mut scn);

    // before grant: denied
    assert!(!memory_policy::check_policy_for_testing(APP, id_for(&mem), &mem));
    // granted: allowed
    mem.grant(APP, scn.ctx());
    assert!(memory_policy::check_policy_for_testing(APP, id_for(&mem), &mem));
    // revoked: denied again — revocation bites at the key servers
    mem.revoke(APP, scn.ctx());
    assert!(!memory_policy::check_policy_for_testing(APP, id_for(&mem), &mem));

    scn.return_to_sender(mem);
    scn.end();
}

#[test]
fun stranger_is_denied() {
    let mut scn = ts::begin(OWNER);
    let mem = fresh_vault(&mut scn);
    assert!(!memory_policy::check_policy_for_testing(STRANGER, id_for(&mem), &mem));
    scn.return_to_sender(mem);
    scn.end();
}

#[test]
fun wrong_vault_prefix_is_denied_even_for_owner() {
    let mut scn = ts::begin(OWNER);
    let mem = fresh_vault(&mut scn);

    // Identity from a DIFFERENT vault: owner of vault B must not unlock
    // blobs encrypted for vault A.
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let other = scn.take_from_sender<Memory>();
    let foreign_id = id_for(&other);
    assert!(!memory_policy::check_policy_for_testing(OWNER, foreign_id, &mem));

    // Too-short identity (shorter than an object id) is also denied.
    assert!(!memory_policy::check_policy_for_testing(OWNER, vector[0, 1, 2], &mem));

    scn.return_to_sender(mem);
    scn.return_to_sender(other);
    scn.end();
}

#[test]
fun seal_approve_aborts_and_passes_via_entry() {
    let mut scn = ts::begin(OWNER);
    let mut mem = fresh_vault(&mut scn);
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"kind"), 1, scn.ctx());

    // entry fn happy path: owner approves without abort
    memory_policy::seal_approve(id_for(&mem), &mem, scn.ctx());

    scn.return_to_sender(mem);
    scn.end();
}

#[test, expected_failure(abort_code = memory_policy::ENoAccess)]
fun seal_approve_aborts_for_stranger() {
    let mut scn = ts::begin(OWNER);
    let mem = fresh_vault(&mut scn);

    scn.next_tx(STRANGER);
    memory_policy::seal_approve(id_for(&mem), &mem, scn.ctx());
    abort 0
}

/// Unit tests for `memory::memory` — owner-only enforcement + happy paths.
#[test_only]
module memory::memory_tests;

use memory::memory::{Self, Memory};
use sui::test_scenario as ts;

const OWNER: address = @0xA11CE;
const INTRUDER: address = @0xB0B;
const APP: address = @0xAB1;

fun blob(s: vector<u8>): std::string::String { std::string::utf8(s) }

#[test]
fun create_then_add_grant_revoke_happy_path() {
    let mut scn = ts::begin(OWNER);

    // create → owner receives the Memory object
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    assert!(mem.owner() == OWNER);
    assert!(mem.entry_count() == 0);

    // add_entry by owner
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"trading-style"), 1_000, scn.ctx());
    assert!(mem.entry_count() == 1);
    assert!(mem.blob_id_at(0) == blob(b"blob-1"));

    // grant then revoke by owner
    assert!(!mem.is_authorized(APP));
    mem.grant(APP, scn.ctx());
    assert!(mem.is_authorized(APP));
    mem.revoke(APP, scn.ctx());
    assert!(!mem.is_authorized(APP));

    scn.return_to_sender(mem);
    scn.end();
}

#[test, expected_failure(abort_code = memory::ENotOwner)]
fun add_entry_rejects_non_owner() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();

    scn.next_tx(INTRUDER);
    mem.add_entry(blob(b"x"), blob(b"lethe"), blob(b"k"), 1, scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::ENotOwner)]
fun grant_rejects_non_owner() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();

    scn.next_tx(INTRUDER);
    mem.grant(APP, scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::ENotOwner)]
fun revoke_rejects_non_owner() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.grant(APP, scn.ctx());

    scn.next_tx(INTRUDER);
    mem.revoke(APP, scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::EAlreadyAuthorized)]
fun grant_rejects_duplicate() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.grant(APP, scn.ctx());
    mem.grant(APP, scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::ENotAuthorized)]
fun revoke_rejects_unknown_app() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.revoke(APP, scn.ctx());
    abort 0
}

#[test]
fun remove_entry_removes_exactly_the_matching_entry() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"k"), 1, scn.ctx());
    mem.add_entry(blob(b"blob-2"), blob(b"lethe"), blob(b"k"), 2, scn.ctx());
    mem.add_entry(blob(b"blob-3"), blob(b"lethe"), blob(b"k"), 3, scn.ctx());
    scn.next_tx(OWNER);

    // forget the middle entry; the others keep their order
    mem.remove_entry(1, blob(b"blob-2"), scn.ctx());
    let fx = scn.next_tx(OWNER);
    assert!(fx.num_user_events() == 1); // exactly one MemoryForgotten

    assert!(mem.entry_count() == 2);
    assert!(mem.blob_id_at(0) == blob(b"blob-1"));
    assert!(mem.blob_id_at(1) == blob(b"blob-3"));

    scn.return_to_sender(mem);
    scn.end();
}

#[test, expected_failure(abort_code = memory::ENotOwner)]
fun remove_entry_rejects_non_owner() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"k"), 1, scn.ctx());

    scn.next_tx(INTRUDER);
    mem.remove_entry(0, blob(b"blob-1"), scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::EEntryMismatch)]
fun remove_entry_rejects_wrong_blob_id() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"k"), 1, scn.ctx());
    mem.remove_entry(0, blob(b"not-this-blob"), scn.ctx());
    abort 0
}

#[test, expected_failure(abort_code = memory::EEntryMismatch)]
fun remove_entry_rejects_out_of_bounds_index() {
    let mut scn = ts::begin(OWNER);
    memory::create(scn.ctx());
    scn.next_tx(OWNER);
    let mut mem = scn.take_from_sender<Memory>();
    mem.add_entry(blob(b"blob-1"), blob(b"lethe"), blob(b"k"), 1, scn.ctx());
    mem.remove_entry(1, blob(b"blob-1"), scn.ctx());
    abort 0
}

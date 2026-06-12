
// ** Expanded prelude

// Copyright (c) The Diem Core Contributors
// Copyright (c) The Move Contributors
// SPDX-License-Identifier: Apache-2.0

// Basic theory for vectors using arrays. This version of vectors is not extensional.

datatype Vec<T> {
    Vec(v: [int]T, l: int)
}

function {:builtin "MapConst"} MapConstVec<T>(T): [int]T;
function DefaultVecElem<T>(): T;
function {:inline} DefaultVecMap<T>(): [int]T { MapConstVec(DefaultVecElem()) }

function {:inline} EmptyVec<T>(): Vec T {
    Vec(DefaultVecMap(), 0)
}

function {:inline} MakeVec1<T>(v: T): Vec T {
    Vec(DefaultVecMap()[0 := v], 1)
}

function {:inline} MakeVec2<T>(v1: T, v2: T): Vec T {
    Vec(DefaultVecMap()[0 := v1][1 := v2], 2)
}

function {:inline} MakeVec3<T>(v1: T, v2: T, v3: T): Vec T {
    Vec(DefaultVecMap()[0 := v1][1 := v2][2 := v3], 3)
}

function {:inline} MakeVec4<T>(v1: T, v2: T, v3: T, v4: T): Vec T {
    Vec(DefaultVecMap()[0 := v1][1 := v2][2 := v3][3 := v4], 4)
}

function {:inline} ExtendVec<T>(v: Vec T, elem: T): Vec T {
    (var l := v->l;
    Vec(v->v[l := elem], l + 1))
}

function {:inline} ReadVec<T>(v: Vec T, i: int): T {
    v->v[i]
}

function {:inline} LenVec<T>(v: Vec T): int {
    v->l
}

function {:inline} IsEmptyVec<T>(v: Vec T): bool {
    v->l == 0
}

function {:inline} RemoveVec<T>(v: Vec T): Vec T {
    (var l := v->l - 1;
    Vec(v->v[l := DefaultVecElem()], l))
}

function {:inline} RemoveAtVec<T>(v: Vec T, i: int): Vec T {
    (var l := v->l - 1;
    Vec(
        (lambda j: int ::
           if j >= 0 && j < l then
               if j < i then v->v[j] else v->v[j+1]
           else DefaultVecElem()),
        l))
}

function {:inline} InsertAtVec<T>(v: Vec T, i: int, e: T): Vec T {
    (var l := v->l + 1;
    Vec(
        (lambda j: int ::
           if j >= 0 && j < l then
               if j < i then v->v[j]
               else if j == i then e
               else v->v[j-1]
           else DefaultVecElem()),
        l))
}

function {:inline} ConcatVec<T>(v1: Vec T, v2: Vec T): Vec T {
    (var l1, m1, l2, m2 := v1->l, v1->v, v2->l, v2->v;
    Vec(
        (lambda i: int ::
          if i >= 0 && i < l1 + l2 then
            if i < l1 then m1[i] else m2[i - l1]
          else DefaultVecElem()),
        l1 + l2))
}

function {:inline} ReverseVec<T>(v: Vec T): Vec T {
    (var l := v->l;
    Vec(
        (lambda i: int :: if 0 <= i && i < l then v->v[l - i - 1] else DefaultVecElem()),
        l))
}

function {:inline} SliceVec<T>(v: Vec T, i: int, j: int): Vec T {
    (var m := v->v;
    Vec(
        (lambda k:int ::
          if 0 <= k && k < j - i then
            m[i + k]
          else
            DefaultVecElem()),
        (if j - i < 0 then 0 else j - i)))
}


function {:inline} UpdateVec<T>(v: Vec T, i: int, elem: T): Vec T {
    Vec(v->v[i := elem], v->l)
}

function {:inline} SwapVec<T>(v: Vec T, i: int, j: int): Vec T {
    (var m := v->v;
    Vec(m[i := m[j]][j := m[i]], v->l))
}

function {:inline} ContainsVec<T>(v: Vec T, e: T): bool {
    (var l := v->l;
    (exists i: int :: InRangeVec(v, i) && v->v[i] == e))
}

function IndexOfVec<T>(v: Vec T, e: T): int;
axiom {:ctor "Vec"} (forall<T> v: Vec T, e: T :: {IndexOfVec(v, e)}
    (var i := IndexOfVec(v,e);
     if (!ContainsVec(v, e)) then i == -1
     else InRangeVec(v, i) && ReadVec(v, i) == e &&
        (forall j: int :: j >= 0 && j < i ==> ReadVec(v, j) != e)));

// This function should stay non-inlined as it guards many quantifiers
// over vectors. It appears important to have this uninterpreted for
// quantifier triggering.
function InRangeVec<T>(v: Vec T, i: int): bool {
    i >= 0 && i < LenVec(v)
}

// Copyright (c) The Diem Core Contributors
// Copyright (c) The Move Contributors
// SPDX-License-Identifier: Apache-2.0

// Boogie model for multisets, based on Boogie arrays. This theory assumes extensional equality for element types.

datatype Multiset<T> {
    Multiset(v: [T]int, l: int)
}

function {:builtin "MapConst"} MapConstMultiset<T>(l: int): [T]int;

function {:inline} EmptyMultiset<T>(): Multiset T {
    Multiset(MapConstMultiset(0), 0)
}

function {:inline} LenMultiset<T>(s: Multiset T): int {
    s->l
}

function {:inline} ExtendMultiset<T>(s: Multiset T, v: T): Multiset T {
    (var len := s->l;
    (var cnt := s->v[v];
    Multiset(s->v[v := (cnt + 1)], len + 1)))
}

// This function returns (s1 - s2). This function assumes that s2 is a subset of s1.
function {:inline} SubtractMultiset<T>(s1: Multiset T, s2: Multiset T): Multiset T {
    (var len1 := s1->l;
    (var len2 := s2->l;
    Multiset((lambda v:T :: s1->v[v]-s2->v[v]), len1-len2)))
}

function {:inline} IsEmptyMultiset<T>(s: Multiset T): bool {
    (s->l == 0) &&
    (forall v: T :: s->v[v] == 0)
}

function {:inline} IsSubsetMultiset<T>(s1: Multiset T, s2: Multiset T): bool {
    (s1->l <= s2->l) &&
    (forall v: T :: s1->v[v] <= s2->v[v])
}

function {:inline} ContainsMultiset<T>(s: Multiset T, v: T): bool {
    s->v[v] > 0
}

// Copyright (c) The Diem Core Contributors
// Copyright (c) The Move Contributors
// SPDX-License-Identifier: Apache-2.0

// Theory for tables.

// v is the SMT array holding the key-value assignment. e is an array which
// independently determines whether a key is valid or not. l is the length.
//
// Note that even though the program cannot reflect over existence of a key,
// we want the specification to be able to do this, so it can express
// verification conditions like "key has been inserted".
datatype Table <K, V> {
    Table(v: [K]V, e: [K]bool, l: int)
}

// Functions for default SMT arrays. For the table values, we don't care and
// use an uninterpreted function.
function DefaultTableArray<K, V>(): [K]V;
function DefaultTableKeyExistsArray<K>(): [K]bool;
axiom DefaultTableKeyExistsArray() == (lambda i: int :: false);

function {:inline} EmptyTable<K, V>(): Table K V {
    Table(DefaultTableArray(), DefaultTableKeyExistsArray(), 0)
}

function {:inline} GetTable<K,V>(t: Table K V, k: K): V {
    // Notice we do not check whether key is in the table. The result is undetermined if it is not.
    t->v[k]
}

function {:inline} LenTable<K,V>(t: Table K V): int {
    t->l
}


function {:inline} ContainsTable<K,V>(t: Table K V, k: K): bool {
    t->e[k]
}

function {:inline} UpdateTable<K,V>(t: Table K V, k: K, v: V): Table K V {
    Table(t->v[k := v], t->e, t->l)
}

function {:inline} AddTable<K,V>(t: Table K V, k: K, v: V): Table K V {
    // This function has an undetermined result if the key is already in the table
    // (all specification functions have this "partial definiteness" behavior). Thus we can
    // just increment the length.
    Table(t->v[k := v], t->e[k := true], t->l + 1)
}

function {:inline} RemoveTable<K,V>(t: Table K V, k: K): Table K V {
    // Similar as above, we only need to consider the case where the key is in the table.
    Table(t->v, t->e[k := false], t->l - 1)
}

axiom {:ctor "Table"} (forall<K,V> t: Table K V :: {LenTable(t)}
    (exists k: K :: {ContainsTable(t, k)} ContainsTable(t, k)) ==> LenTable(t) >= 1
);
// TODO: we might want to encoder a stronger property that the length of table
// must be more than N given a set of N items. Currently we don't see a need here
// and the above axiom seems to be sufficient.


// Prover
procedure {:inline 1} $ShlBvBv256From8(src1: bv256, src2: bv8) returns (dst: bv256) {
    call dst := $ShlBv256From8(src1, src2);
}

procedure {:inline 1} $0_prover_requires(p: bool) {
    assume p;
}

type $1_integer_Integer = int;
function {:inline} $IsValid'$1_integer_Integer'(x: int): bool {
    true
}
function {:inline} $IsEqual'$1_integer_Integer'(x: int, y: int): bool {
    x == y
}
procedure {:inline 1} $0_prover_type_inv'$1_integer_Integer'(x: int) returns (y: bool) {
    y := true;
}function {:inline} $1_integer_from_u8(x: int): int {
    x
}
function {:inline} $1_integer_from_u16(x: int): int {
    x
}
function {:inline} $1_integer_from_u32(x: int): int {
    x
}
function {:inline} $1_integer_from_u64(x: int): int {
    x
}
function {:inline} $1_integer_from_u128(x: int): int {
    x
}
function {:inline} $1_integer_from_u256(x: int): int {
    x
}
function {:inline} $1_integer_to_u8(x: int): int {
    x mod 256
}
function {:inline} $1_integer_to_u16(x: int): int {
    x mod 65536
}
function {:inline} $1_integer_to_u32(x: int): int {
    x mod 4294967296
}
function {:inline} $1_integer_to_u64(x: int): int {
    x mod 18446744073709551616
}
function {:inline} $1_integer_to_u128(x: int): int {
    x mod 340282366920938463463374607431768211456
}
function {:inline} $1_integer_to_u256(x: int): int {
    x mod 115792089237316195423570985008687907853269984665640564039457584007913129639936
}

function {:inline} $1_integer_add(x: int, y: int): int {
    x + y
}

function {:inline} $1_integer_sub(x: int, y: int): int {
    x - y
}

function {:inline} $1_integer_neg(x: int): int {
    -x
}

function {:inline} $1_integer_mul(x: int, y: int): int {
    x * y
}

function {:inline} $1_integer_div(x: int, y: int): int {
    x div y
}

function {:inline} $1_integer_mod(x: int, y: int): int {
    x mod y
}

function {:inline} $1_integer_pow(x: int, y: int): int {
    $pow(x, y)
}

function {:inline} $1_integer_sqrt(x: int): int {
    $sqrt_int(x)
}

function $andInt(x: int, y: int) returns (int);
function $orInt(x: int, y: int) returns (int);
function $xorInt(x: int, y: int) returns (int);
function $notInt(x: int) returns (int);

function {:inline} $1_integer_bit_and(x: int, y: int): int {
    $andInt(x, y)
}

function {:inline} $1_integer_bit_or(x: int, y: int): int {
    $orInt(x, y)
}

function {:inline} $1_integer_bit_xor(x: int, y: int): int {
    $xorInt(x, y)
}

function {:inline} $1_integer_bit_not(x: int): int {
    $notInt(x)
}

function {:inline} $1_integer_lt(x: int, y: int): bool {
    x < y
}

function {:inline} $1_integer_gt(x: int, y: int): bool {
    x > y
}

function {:inline} $1_integer_lte(x: int, y: int): bool {
    x <= y
}

function {:inline} $1_integer_gte(x: int, y: int): bool {
    x >= y
}

function {:inline} $1_integer_div_real(x: int, y: int): real {
    x / y
}

// sui::tx_context native functions (uninterpreted)
function $2_tx_context_native_sender(): int;
function $2_tx_context_native_epoch(): int;
function $2_tx_context_native_epoch_timestamp_ms(): int;
function $2_tx_context_native_rgp(): int;
function $2_tx_context_native_gas_price(): int;

axiom $IsValid'address'($2_tx_context_native_sender());
axiom $IsValid'u64'($2_tx_context_native_epoch());
axiom $IsValid'u64'($2_tx_context_native_epoch_timestamp_ms());
axiom $IsValid'u64'($2_tx_context_native_rgp());
axiom $IsValid'u64'($2_tx_context_native_gas_price());

function $to_u8(x: int): int {
    x mod 256
}
function $to_u16(x: int): int {
    x mod 65536
}
function $to_u32(x: int): int {
    x mod 4294967296
}
function $to_u64(x: int): int {
    x mod 18446744073709551616
}
function $to_u128(x: int): int {
    x mod 340282366920938463463374607431768211456
}
function $to_u256(x: int): int {
    x mod 115792089237316195423570985008687907853269984665640564039457584007913129639936
}

function $to_i8(x: int): int {(
    var y := x mod 256;
    if y < 256 - y then
        y
    else
        y - 256
)}
function $to_i16(x: int): int {(
    var y := x mod 65536;
    if y < 65536 - y then
        y
    else
        y - 65536
)}
function $to_i32(x: int): int {(
    var y := x mod 4294967296;
    if y < 4294967296 - y then
        y
    else
        y - 4294967296
)}
function $to_i64(x: int): int {(
    var y := x mod 18446744073709551616;
    if y < 18446744073709551616 - y then
        y
    else
        y - 18446744073709551616
)}
function $to_i128(x: int): int {(
    var y := x mod 340282366920938463463374607431768211456;
    if y < 340282366920938463463374607431768211456 - y then
        y
    else
        y - 340282366920938463463374607431768211456
)}
function $to_i256(x: int): int {(
    var y := x mod 115792089237316195423570985008687907853269984665640564039457584007913129639936;
    if y < 115792089237316195423570985008687907853269984665640564039457584007913129639936 - y then
        y
    else
        y - 115792089237316195423570985008687907853269984665640564039457584007913129639936
)}

type $1_real_Real = real;
function {:inline} $IsValid'$1_real_Real'(x: real): bool {
    true
}
function {:inline} $IsEqual'$1_real_Real'(x: real, y: real): bool {
    x == y
}

function {:inline} $0_prover_type_inv'$1_real_Real'(x: real): bool {
    true
}

function {:inline} $1_real_from_integer(x: int): real {
    real(x)
}

function {:inline} $1_real_to_integer(x: real): int {
    int(x)
}

function {:inline} $1_real_add(x: real, y: real): real {
    x + y
}

function {:inline} $1_real_sub(x: real, y: real): real {
    x - y
}

function {:inline} $1_real_neg(x: real): real {
    -x
}

function {:inline} $1_real_mul(x: real, y: real): real {
    x * y
}

function {:inline} $1_real_div(x: real, y: real): real {
    x / y
}

function {:inline} $1_real_exp(x: real, y: int): real {
    // simplifications
    if y == 0 then 1.0
    else if y == 1 || y == -1 then x
    else if y == 2 then x * x
    else if y == 3 then x * x * x
    else $pow_real(x, y)
}

function {:inline} $1_real_lt(x: real, y: real): bool {
    x < y
}

function {:inline} $1_real_gt(x: real, y: real): bool {
    x > y
}

function {:inline} $1_real_lte(x: real, y: real): bool {
    x <= y
}

function {:inline} $1_real_gte(x: real, y: real): bool {
    x >= y
}

function {:inline} $1_real_sqrt(x: real): real {
    $sqrt_real(x)
}


// temporary stuff
procedure {:inline 1} $0_prover_requires_begin() {}
procedure {:inline 1} $0_prover_requires_end() {}
procedure {:inline 1} $0_prover_ensures_begin() {}
procedure {:inline 1} $0_prover_ensures_end() {}
procedure {:inline 1} $0_prover_aborts_begin() {}
procedure {:inline 1} $0_prover_aborts_end() {}
procedure {:inline 1} $0_prover_invariant_begin() {}
procedure {:inline 1} $0_prover_invariant_end() {}


// ============================================================================================
// Primitive Types

const $MAX_U8: int;
axiom $MAX_U8 == 255;
const $MAX_U16: int;
axiom $MAX_U16 == 65535;
const $MAX_U32: int;
axiom $MAX_U32 == 4294967295;
const $MAX_U64: int;
axiom $MAX_U64 == 18446744073709551615;
const $MAX_U128: int;
axiom $MAX_U128 == 340282366920938463463374607431768211455;
const $MAX_U256: int;
axiom $MAX_U256 == 115792089237316195423570985008687907853269984665640564039457584007913129639935;

const $POW_2_8: int;
axiom $POW_2_8 == 256;
const $POW_2_16: int;
axiom $POW_2_16 == 65536;
const $POW_2_32: int;
axiom $POW_2_32 == 4294967296;
const $POW_2_64: int;
axiom $POW_2_64 == 18446744073709551616;
const $POW_2_128: int;
axiom $POW_2_128 == 340282366920938463463374607431768211456;
const $POW_2_256: int;
axiom $POW_2_256 == 115792089237316195423570985008687907853269984665640564039457584007913129639936;

// Templates for bitvector operations

function {:bvbuiltin "bvand"} $And'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvor"} $Or'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvxor"} $Xor'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvadd"} $Add'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvsub"} $Sub'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvmul"} $Mul'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvudiv"} $Div'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvurem"} $Mod'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvsrem"} $SMod'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvshl"} $Shl'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvlshr"} $Shr'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvashr"} $AShr'Bv8'(bv8,bv8) returns(bv8);
function {:bvbuiltin "bvult"} $Lt'Bv8'(bv8,bv8) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv8'(bv8,bv8) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv8'(bv8,bv8) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv8'(bv8,bv8) returns(bool);

procedure {:inline 1} $AddBv8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if ($Lt'Bv8'($Add'Bv8'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv8'(src1, src2);
}

function {:inline} $AddBv8_unchecked(src1: bv8, src2: bv8): bv8
{
    $Add'Bv8'(src1, src2)
}

procedure {:inline 1} $SubBv8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if ($Lt'Bv8'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv8'(src1, src2);
}

procedure {:inline 1} $MulBv8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if ($Lt'Bv8'($Mul'Bv8'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv8'(src1, src2);
}

procedure {:inline 1} $DivBv8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if (src2 == 0bv8) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv8'(src1, src2);
}

procedure {:inline 1} $ModBv8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if (src2 == 0bv8) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv8'(src1, src2);
}

function {:inline} $AndBv8(src1: bv8, src2: bv8): bv8
{
    $And'Bv8'(src1,src2)
}

function {:inline} $OrBv8(src1: bv8, src2: bv8): bv8
{
    $Or'Bv8'(src1,src2)
}

function {:inline} $XorBv8(src1: bv8, src2: bv8): bv8
{
    $Xor'Bv8'(src1,src2)
}

function {:inline} $LtBv8(src1: bv8, src2: bv8): bool
{
    $Lt'Bv8'(src1,src2)
}

function {:inline} $LeBv8(src1: bv8, src2: bv8): bool
{
    $Le'Bv8'(src1,src2)
}

function {:inline} $GtBv8(src1: bv8, src2: bv8): bool
{
    $Gt'Bv8'(src1,src2)
}

function {:inline} $GeBv8(src1: bv8, src2: bv8): bool
{
    $Ge'Bv8'(src1,src2)
}

function $IsValid'bv8'(v: bv8): bool {
  $Ge'Bv8'(v,0bv8) && $Le'Bv8'(v,255bv8)
}

function {:inline} $IsEqual'bv8'(x: bv8, y: bv8): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv8'(v: bv8) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv8(src: int) returns (dst: bv8)
{
    if (src > 255) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.8(src);
}

procedure {:inline 1} $bv2int8(src: bv8) returns (dst: int)
{
    dst := $bv2int.8(src);
}

function {:builtin "(_ int2bv 8)"} $int2bv.8(i: int) returns (bv8);
function {:builtin "bv2nat"} $bv2int.8(i: bv8) returns (int);

function $andInt'u8'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_8, y mod $POW_2_8)
}
function $andInt'i8'(x: int, y: int) returns (int) {
    $andInt($to_i8(x), $to_i8(y))
}
axiom (forall x, y : int :: {$andInt'u8'(x, y)}
    $andInt'u8'(x, y) == $andInt(x, y) mod $POW_2_8
);
axiom (forall x, y : int :: {$andInt'u8'(x, y)}
    0 <= $andInt'u8'(x, y) && $andInt'u8'(x, y) < $POW_2_8
);
axiom (forall x, y : int :: {$andInt'u8'(x, y)}
    $to_i8($andInt'u8'(x, y)) == $andInt'i8'(x, y)
);
function $orInt'u8'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_8, y mod $POW_2_8)
}
function $orInt'i8'(x: int, y: int) returns (int) {
    $orInt($to_i8(x), $to_i8(y))
}
axiom (forall x, y : int :: {$orInt'u8'(x, y)}
    $orInt'u8'(x, y) == $orInt(x, y) mod $POW_2_8
);
axiom (forall x, y : int :: {$orInt'u8'(x, y)}
    0 <= $orInt'u8'(x, y) && $orInt'u8'(x, y) < $POW_2_8
);
axiom (forall x, y : int :: {$orInt'u8'(x, y)}
    $to_i8($orInt'u8'(x, y)) == $orInt'i8'(x, y)
);
function $xorInt'u8'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_8, y mod $POW_2_8)
}
function $xorInt'i8'(x: int, y: int) returns (int) {
    $xorInt($to_i8(x), $to_i8(y))
}
axiom (forall x, y: int :: {$xorInt'u8'(x, y)}
    $xorInt'u8'(x, y) == $xorInt(x, y) mod $POW_2_8
);
axiom (forall x, y: int :: {$xorInt'u8'(x, y)}
    0 <= $xorInt'u8'(x, y) && $xorInt'u8'(x, y) < $POW_2_8
);
axiom (forall x, y : int :: {$xorInt'u8'(x, y)}
    $to_i8($xorInt'u8'(x, y)) == $xorInt'i8'(x, y)
);

function {:inline} $AndInt'u8'(src1: int, src2: int): int
{
    $andInt'u8'(src1, src2)
}
function {:inline} $OrInt'u8'(src1: int, src2: int): int
{
    $orInt'u8'(src1, src2)
}
function {:inline} $XorInt'u8'(src1: int, src2: int): int
{
    $xorInt'u8'(src1, src2)
}

function {:bvbuiltin "bvand"} $And'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvor"} $Or'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvxor"} $Xor'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvadd"} $Add'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvsub"} $Sub'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvmul"} $Mul'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvudiv"} $Div'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvurem"} $Mod'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvsrem"} $SMod'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvshl"} $Shl'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvlshr"} $Shr'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvashr"} $AShr'Bv16'(bv16,bv16) returns(bv16);
function {:bvbuiltin "bvult"} $Lt'Bv16'(bv16,bv16) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv16'(bv16,bv16) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv16'(bv16,bv16) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv16'(bv16,bv16) returns(bool);

procedure {:inline 1} $AddBv16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if ($Lt'Bv16'($Add'Bv16'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv16'(src1, src2);
}

function {:inline} $AddBv16_unchecked(src1: bv16, src2: bv16): bv16
{
    $Add'Bv16'(src1, src2)
}

procedure {:inline 1} $SubBv16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if ($Lt'Bv16'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv16'(src1, src2);
}

procedure {:inline 1} $MulBv16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if ($Lt'Bv16'($Mul'Bv16'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv16'(src1, src2);
}

procedure {:inline 1} $DivBv16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if (src2 == 0bv16) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv16'(src1, src2);
}

procedure {:inline 1} $ModBv16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if (src2 == 0bv16) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv16'(src1, src2);
}

function {:inline} $AndBv16(src1: bv16, src2: bv16): bv16
{
    $And'Bv16'(src1,src2)
}

function {:inline} $OrBv16(src1: bv16, src2: bv16): bv16
{
    $Or'Bv16'(src1,src2)
}

function {:inline} $XorBv16(src1: bv16, src2: bv16): bv16
{
    $Xor'Bv16'(src1,src2)
}

function {:inline} $LtBv16(src1: bv16, src2: bv16): bool
{
    $Lt'Bv16'(src1,src2)
}

function {:inline} $LeBv16(src1: bv16, src2: bv16): bool
{
    $Le'Bv16'(src1,src2)
}

function {:inline} $GtBv16(src1: bv16, src2: bv16): bool
{
    $Gt'Bv16'(src1,src2)
}

function {:inline} $GeBv16(src1: bv16, src2: bv16): bool
{
    $Ge'Bv16'(src1,src2)
}

function $IsValid'bv16'(v: bv16): bool {
  $Ge'Bv16'(v,0bv16) && $Le'Bv16'(v,65535bv16)
}

function {:inline} $IsEqual'bv16'(x: bv16, y: bv16): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv16'(v: bv16) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv16(src: int) returns (dst: bv16)
{
    if (src > 65535) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.16(src);
}

procedure {:inline 1} $bv2int16(src: bv16) returns (dst: int)
{
    dst := $bv2int.16(src);
}

function {:builtin "(_ int2bv 16)"} $int2bv.16(i: int) returns (bv16);
function {:builtin "bv2nat"} $bv2int.16(i: bv16) returns (int);

function $andInt'u16'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_16, y mod $POW_2_16)
}
function $andInt'i16'(x: int, y: int) returns (int) {
    $andInt($to_i16(x), $to_i16(y))
}
axiom (forall x, y : int :: {$andInt'u16'(x, y)}
    $andInt'u16'(x, y) == $andInt(x, y) mod $POW_2_16
);
axiom (forall x, y : int :: {$andInt'u16'(x, y)}
    0 <= $andInt'u16'(x, y) && $andInt'u16'(x, y) < $POW_2_16
);
axiom (forall x, y : int :: {$andInt'u16'(x, y)}
    $to_i16($andInt'u16'(x, y)) == $andInt'i16'(x, y)
);
function $orInt'u16'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_16, y mod $POW_2_16)
}
function $orInt'i16'(x: int, y: int) returns (int) {
    $orInt($to_i16(x), $to_i16(y))
}
axiom (forall x, y : int :: {$orInt'u16'(x, y)}
    $orInt'u16'(x, y) == $orInt(x, y) mod $POW_2_16
);
axiom (forall x, y : int :: {$orInt'u16'(x, y)}
    0 <= $orInt'u16'(x, y) && $orInt'u16'(x, y) < $POW_2_16
);
axiom (forall x, y : int :: {$orInt'u16'(x, y)}
    $to_i16($orInt'u16'(x, y)) == $orInt'i16'(x, y)
);
function $xorInt'u16'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_16, y mod $POW_2_16)
}
function $xorInt'i16'(x: int, y: int) returns (int) {
    $xorInt($to_i16(x), $to_i16(y))
}
axiom (forall x, y: int :: {$xorInt'u16'(x, y)}
    $xorInt'u16'(x, y) == $xorInt(x, y) mod $POW_2_16
);
axiom (forall x, y: int :: {$xorInt'u16'(x, y)}
    0 <= $xorInt'u16'(x, y) && $xorInt'u16'(x, y) < $POW_2_16
);
axiom (forall x, y : int :: {$xorInt'u16'(x, y)}
    $to_i16($xorInt'u16'(x, y)) == $xorInt'i16'(x, y)
);

function {:inline} $AndInt'u16'(src1: int, src2: int): int
{
    $andInt'u16'(src1, src2)
}
function {:inline} $OrInt'u16'(src1: int, src2: int): int
{
    $orInt'u16'(src1, src2)
}
function {:inline} $XorInt'u16'(src1: int, src2: int): int
{
    $xorInt'u16'(src1, src2)
}

function {:bvbuiltin "bvand"} $And'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvor"} $Or'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvxor"} $Xor'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvadd"} $Add'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvsub"} $Sub'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvmul"} $Mul'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvudiv"} $Div'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvurem"} $Mod'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvsrem"} $SMod'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvshl"} $Shl'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvlshr"} $Shr'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvashr"} $AShr'Bv32'(bv32,bv32) returns(bv32);
function {:bvbuiltin "bvult"} $Lt'Bv32'(bv32,bv32) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv32'(bv32,bv32) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv32'(bv32,bv32) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv32'(bv32,bv32) returns(bool);

procedure {:inline 1} $AddBv32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if ($Lt'Bv32'($Add'Bv32'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv32'(src1, src2);
}

function {:inline} $AddBv32_unchecked(src1: bv32, src2: bv32): bv32
{
    $Add'Bv32'(src1, src2)
}

procedure {:inline 1} $SubBv32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if ($Lt'Bv32'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv32'(src1, src2);
}

procedure {:inline 1} $MulBv32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if ($Lt'Bv32'($Mul'Bv32'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv32'(src1, src2);
}

procedure {:inline 1} $DivBv32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if (src2 == 0bv32) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv32'(src1, src2);
}

procedure {:inline 1} $ModBv32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if (src2 == 0bv32) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv32'(src1, src2);
}

function {:inline} $AndBv32(src1: bv32, src2: bv32): bv32
{
    $And'Bv32'(src1,src2)
}

function {:inline} $OrBv32(src1: bv32, src2: bv32): bv32
{
    $Or'Bv32'(src1,src2)
}

function {:inline} $XorBv32(src1: bv32, src2: bv32): bv32
{
    $Xor'Bv32'(src1,src2)
}

function {:inline} $LtBv32(src1: bv32, src2: bv32): bool
{
    $Lt'Bv32'(src1,src2)
}

function {:inline} $LeBv32(src1: bv32, src2: bv32): bool
{
    $Le'Bv32'(src1,src2)
}

function {:inline} $GtBv32(src1: bv32, src2: bv32): bool
{
    $Gt'Bv32'(src1,src2)
}

function {:inline} $GeBv32(src1: bv32, src2: bv32): bool
{
    $Ge'Bv32'(src1,src2)
}

function $IsValid'bv32'(v: bv32): bool {
  $Ge'Bv32'(v,0bv32) && $Le'Bv32'(v,4294967295bv32)
}

function {:inline} $IsEqual'bv32'(x: bv32, y: bv32): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv32'(v: bv32) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv32(src: int) returns (dst: bv32)
{
    if (src > 4294967295) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.32(src);
}

procedure {:inline 1} $bv2int32(src: bv32) returns (dst: int)
{
    dst := $bv2int.32(src);
}

function {:builtin "(_ int2bv 32)"} $int2bv.32(i: int) returns (bv32);
function {:builtin "bv2nat"} $bv2int.32(i: bv32) returns (int);

function $andInt'u32'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_32, y mod $POW_2_32)
}
function $andInt'i32'(x: int, y: int) returns (int) {
    $andInt($to_i32(x), $to_i32(y))
}
axiom (forall x, y : int :: {$andInt'u32'(x, y)}
    $andInt'u32'(x, y) == $andInt(x, y) mod $POW_2_32
);
axiom (forall x, y : int :: {$andInt'u32'(x, y)}
    0 <= $andInt'u32'(x, y) && $andInt'u32'(x, y) < $POW_2_32
);
axiom (forall x, y : int :: {$andInt'u32'(x, y)}
    $to_i32($andInt'u32'(x, y)) == $andInt'i32'(x, y)
);
function $orInt'u32'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_32, y mod $POW_2_32)
}
function $orInt'i32'(x: int, y: int) returns (int) {
    $orInt($to_i32(x), $to_i32(y))
}
axiom (forall x, y : int :: {$orInt'u32'(x, y)}
    $orInt'u32'(x, y) == $orInt(x, y) mod $POW_2_32
);
axiom (forall x, y : int :: {$orInt'u32'(x, y)}
    0 <= $orInt'u32'(x, y) && $orInt'u32'(x, y) < $POW_2_32
);
axiom (forall x, y : int :: {$orInt'u32'(x, y)}
    $to_i32($orInt'u32'(x, y)) == $orInt'i32'(x, y)
);
function $xorInt'u32'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_32, y mod $POW_2_32)
}
function $xorInt'i32'(x: int, y: int) returns (int) {
    $xorInt($to_i32(x), $to_i32(y))
}
axiom (forall x, y: int :: {$xorInt'u32'(x, y)}
    $xorInt'u32'(x, y) == $xorInt(x, y) mod $POW_2_32
);
axiom (forall x, y: int :: {$xorInt'u32'(x, y)}
    0 <= $xorInt'u32'(x, y) && $xorInt'u32'(x, y) < $POW_2_32
);
axiom (forall x, y : int :: {$xorInt'u32'(x, y)}
    $to_i32($xorInt'u32'(x, y)) == $xorInt'i32'(x, y)
);

function {:inline} $AndInt'u32'(src1: int, src2: int): int
{
    $andInt'u32'(src1, src2)
}
function {:inline} $OrInt'u32'(src1: int, src2: int): int
{
    $orInt'u32'(src1, src2)
}
function {:inline} $XorInt'u32'(src1: int, src2: int): int
{
    $xorInt'u32'(src1, src2)
}

function {:bvbuiltin "bvand"} $And'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvor"} $Or'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvxor"} $Xor'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvadd"} $Add'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvsub"} $Sub'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvmul"} $Mul'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvudiv"} $Div'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvurem"} $Mod'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvsrem"} $SMod'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvshl"} $Shl'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvlshr"} $Shr'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvashr"} $AShr'Bv64'(bv64,bv64) returns(bv64);
function {:bvbuiltin "bvult"} $Lt'Bv64'(bv64,bv64) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv64'(bv64,bv64) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv64'(bv64,bv64) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv64'(bv64,bv64) returns(bool);

procedure {:inline 1} $AddBv64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if ($Lt'Bv64'($Add'Bv64'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv64'(src1, src2);
}

function {:inline} $AddBv64_unchecked(src1: bv64, src2: bv64): bv64
{
    $Add'Bv64'(src1, src2)
}

procedure {:inline 1} $SubBv64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if ($Lt'Bv64'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv64'(src1, src2);
}

procedure {:inline 1} $MulBv64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if ($Lt'Bv64'($Mul'Bv64'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv64'(src1, src2);
}

procedure {:inline 1} $DivBv64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if (src2 == 0bv64) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv64'(src1, src2);
}

procedure {:inline 1} $ModBv64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if (src2 == 0bv64) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv64'(src1, src2);
}

function {:inline} $AndBv64(src1: bv64, src2: bv64): bv64
{
    $And'Bv64'(src1,src2)
}

function {:inline} $OrBv64(src1: bv64, src2: bv64): bv64
{
    $Or'Bv64'(src1,src2)
}

function {:inline} $XorBv64(src1: bv64, src2: bv64): bv64
{
    $Xor'Bv64'(src1,src2)
}

function {:inline} $LtBv64(src1: bv64, src2: bv64): bool
{
    $Lt'Bv64'(src1,src2)
}

function {:inline} $LeBv64(src1: bv64, src2: bv64): bool
{
    $Le'Bv64'(src1,src2)
}

function {:inline} $GtBv64(src1: bv64, src2: bv64): bool
{
    $Gt'Bv64'(src1,src2)
}

function {:inline} $GeBv64(src1: bv64, src2: bv64): bool
{
    $Ge'Bv64'(src1,src2)
}

function $IsValid'bv64'(v: bv64): bool {
  $Ge'Bv64'(v,0bv64) && $Le'Bv64'(v,18446744073709551615bv64)
}

function {:inline} $IsEqual'bv64'(x: bv64, y: bv64): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv64'(v: bv64) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv64(src: int) returns (dst: bv64)
{
    if (src > 18446744073709551615) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.64(src);
}

procedure {:inline 1} $bv2int64(src: bv64) returns (dst: int)
{
    dst := $bv2int.64(src);
}

function {:builtin "(_ int2bv 64)"} $int2bv.64(i: int) returns (bv64);
function {:builtin "bv2nat"} $bv2int.64(i: bv64) returns (int);

function $andInt'u64'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_64, y mod $POW_2_64)
}
function $andInt'i64'(x: int, y: int) returns (int) {
    $andInt($to_i64(x), $to_i64(y))
}
axiom (forall x, y : int :: {$andInt'u64'(x, y)}
    $andInt'u64'(x, y) == $andInt(x, y) mod $POW_2_64
);
axiom (forall x, y : int :: {$andInt'u64'(x, y)}
    0 <= $andInt'u64'(x, y) && $andInt'u64'(x, y) < $POW_2_64
);
axiom (forall x, y : int :: {$andInt'u64'(x, y)}
    $to_i64($andInt'u64'(x, y)) == $andInt'i64'(x, y)
);
function $orInt'u64'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_64, y mod $POW_2_64)
}
function $orInt'i64'(x: int, y: int) returns (int) {
    $orInt($to_i64(x), $to_i64(y))
}
axiom (forall x, y : int :: {$orInt'u64'(x, y)}
    $orInt'u64'(x, y) == $orInt(x, y) mod $POW_2_64
);
axiom (forall x, y : int :: {$orInt'u64'(x, y)}
    0 <= $orInt'u64'(x, y) && $orInt'u64'(x, y) < $POW_2_64
);
axiom (forall x, y : int :: {$orInt'u64'(x, y)}
    $to_i64($orInt'u64'(x, y)) == $orInt'i64'(x, y)
);
function $xorInt'u64'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_64, y mod $POW_2_64)
}
function $xorInt'i64'(x: int, y: int) returns (int) {
    $xorInt($to_i64(x), $to_i64(y))
}
axiom (forall x, y: int :: {$xorInt'u64'(x, y)}
    $xorInt'u64'(x, y) == $xorInt(x, y) mod $POW_2_64
);
axiom (forall x, y: int :: {$xorInt'u64'(x, y)}
    0 <= $xorInt'u64'(x, y) && $xorInt'u64'(x, y) < $POW_2_64
);
axiom (forall x, y : int :: {$xorInt'u64'(x, y)}
    $to_i64($xorInt'u64'(x, y)) == $xorInt'i64'(x, y)
);

function {:inline} $AndInt'u64'(src1: int, src2: int): int
{
    $andInt'u64'(src1, src2)
}
function {:inline} $OrInt'u64'(src1: int, src2: int): int
{
    $orInt'u64'(src1, src2)
}
function {:inline} $XorInt'u64'(src1: int, src2: int): int
{
    $xorInt'u64'(src1, src2)
}

function {:bvbuiltin "bvand"} $And'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvor"} $Or'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvxor"} $Xor'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvadd"} $Add'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvsub"} $Sub'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvmul"} $Mul'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvudiv"} $Div'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvurem"} $Mod'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvsrem"} $SMod'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvshl"} $Shl'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvlshr"} $Shr'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvashr"} $AShr'Bv128'(bv128,bv128) returns(bv128);
function {:bvbuiltin "bvult"} $Lt'Bv128'(bv128,bv128) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv128'(bv128,bv128) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv128'(bv128,bv128) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv128'(bv128,bv128) returns(bool);

procedure {:inline 1} $AddBv128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if ($Lt'Bv128'($Add'Bv128'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv128'(src1, src2);
}

function {:inline} $AddBv128_unchecked(src1: bv128, src2: bv128): bv128
{
    $Add'Bv128'(src1, src2)
}

procedure {:inline 1} $SubBv128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if ($Lt'Bv128'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv128'(src1, src2);
}

procedure {:inline 1} $MulBv128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if ($Lt'Bv128'($Mul'Bv128'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv128'(src1, src2);
}

procedure {:inline 1} $DivBv128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if (src2 == 0bv128) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv128'(src1, src2);
}

procedure {:inline 1} $ModBv128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if (src2 == 0bv128) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv128'(src1, src2);
}

function {:inline} $AndBv128(src1: bv128, src2: bv128): bv128
{
    $And'Bv128'(src1,src2)
}

function {:inline} $OrBv128(src1: bv128, src2: bv128): bv128
{
    $Or'Bv128'(src1,src2)
}

function {:inline} $XorBv128(src1: bv128, src2: bv128): bv128
{
    $Xor'Bv128'(src1,src2)
}

function {:inline} $LtBv128(src1: bv128, src2: bv128): bool
{
    $Lt'Bv128'(src1,src2)
}

function {:inline} $LeBv128(src1: bv128, src2: bv128): bool
{
    $Le'Bv128'(src1,src2)
}

function {:inline} $GtBv128(src1: bv128, src2: bv128): bool
{
    $Gt'Bv128'(src1,src2)
}

function {:inline} $GeBv128(src1: bv128, src2: bv128): bool
{
    $Ge'Bv128'(src1,src2)
}

function $IsValid'bv128'(v: bv128): bool {
  $Ge'Bv128'(v,0bv128) && $Le'Bv128'(v,340282366920938463463374607431768211455bv128)
}

function {:inline} $IsEqual'bv128'(x: bv128, y: bv128): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv128'(v: bv128) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv128(src: int) returns (dst: bv128)
{
    if (src > 340282366920938463463374607431768211455) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.128(src);
}

procedure {:inline 1} $bv2int128(src: bv128) returns (dst: int)
{
    dst := $bv2int.128(src);
}

function {:builtin "(_ int2bv 128)"} $int2bv.128(i: int) returns (bv128);
function {:builtin "bv2nat"} $bv2int.128(i: bv128) returns (int);

function $andInt'u128'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_128, y mod $POW_2_128)
}
function $andInt'i128'(x: int, y: int) returns (int) {
    $andInt($to_i128(x), $to_i128(y))
}
axiom (forall x, y : int :: {$andInt'u128'(x, y)}
    $andInt'u128'(x, y) == $andInt(x, y) mod $POW_2_128
);
axiom (forall x, y : int :: {$andInt'u128'(x, y)}
    0 <= $andInt'u128'(x, y) && $andInt'u128'(x, y) < $POW_2_128
);
axiom (forall x, y : int :: {$andInt'u128'(x, y)}
    $to_i128($andInt'u128'(x, y)) == $andInt'i128'(x, y)
);
function $orInt'u128'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_128, y mod $POW_2_128)
}
function $orInt'i128'(x: int, y: int) returns (int) {
    $orInt($to_i128(x), $to_i128(y))
}
axiom (forall x, y : int :: {$orInt'u128'(x, y)}
    $orInt'u128'(x, y) == $orInt(x, y) mod $POW_2_128
);
axiom (forall x, y : int :: {$orInt'u128'(x, y)}
    0 <= $orInt'u128'(x, y) && $orInt'u128'(x, y) < $POW_2_128
);
axiom (forall x, y : int :: {$orInt'u128'(x, y)}
    $to_i128($orInt'u128'(x, y)) == $orInt'i128'(x, y)
);
function $xorInt'u128'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_128, y mod $POW_2_128)
}
function $xorInt'i128'(x: int, y: int) returns (int) {
    $xorInt($to_i128(x), $to_i128(y))
}
axiom (forall x, y: int :: {$xorInt'u128'(x, y)}
    $xorInt'u128'(x, y) == $xorInt(x, y) mod $POW_2_128
);
axiom (forall x, y: int :: {$xorInt'u128'(x, y)}
    0 <= $xorInt'u128'(x, y) && $xorInt'u128'(x, y) < $POW_2_128
);
axiom (forall x, y : int :: {$xorInt'u128'(x, y)}
    $to_i128($xorInt'u128'(x, y)) == $xorInt'i128'(x, y)
);

function {:inline} $AndInt'u128'(src1: int, src2: int): int
{
    $andInt'u128'(src1, src2)
}
function {:inline} $OrInt'u128'(src1: int, src2: int): int
{
    $orInt'u128'(src1, src2)
}
function {:inline} $XorInt'u128'(src1: int, src2: int): int
{
    $xorInt'u128'(src1, src2)
}

function {:bvbuiltin "bvand"} $And'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvor"} $Or'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvxor"} $Xor'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvadd"} $Add'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvsub"} $Sub'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvmul"} $Mul'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvudiv"} $Div'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvurem"} $Mod'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvsdiv"} $SDiv'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvsrem"} $SMod'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvshl"} $Shl'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvlshr"} $Shr'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvashr"} $AShr'Bv256'(bv256,bv256) returns(bv256);
function {:bvbuiltin "bvult"} $Lt'Bv256'(bv256,bv256) returns(bool);
function {:bvbuiltin "bvule"} $Le'Bv256'(bv256,bv256) returns(bool);
function {:bvbuiltin "bvugt"} $Gt'Bv256'(bv256,bv256) returns(bool);
function {:bvbuiltin "bvuge"} $Ge'Bv256'(bv256,bv256) returns(bool);

procedure {:inline 1} $AddBv256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if ($Lt'Bv256'($Add'Bv256'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Add'Bv256'(src1, src2);
}

function {:inline} $AddBv256_unchecked(src1: bv256, src2: bv256): bv256
{
    $Add'Bv256'(src1, src2)
}

procedure {:inline 1} $SubBv256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if ($Lt'Bv256'(src1, src2)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Sub'Bv256'(src1, src2);
}

procedure {:inline 1} $MulBv256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if ($Lt'Bv256'($Mul'Bv256'(src1, src2), src1)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mul'Bv256'(src1, src2);
}

procedure {:inline 1} $DivBv256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if (src2 == 0bv256) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Div'Bv256'(src1, src2);
}

procedure {:inline 1} $ModBv256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if (src2 == 0bv256) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mod'Bv256'(src1, src2);
}

function {:inline} $AndBv256(src1: bv256, src2: bv256): bv256
{
    $And'Bv256'(src1,src2)
}

function {:inline} $OrBv256(src1: bv256, src2: bv256): bv256
{
    $Or'Bv256'(src1,src2)
}

function {:inline} $XorBv256(src1: bv256, src2: bv256): bv256
{
    $Xor'Bv256'(src1,src2)
}

function {:inline} $LtBv256(src1: bv256, src2: bv256): bool
{
    $Lt'Bv256'(src1,src2)
}

function {:inline} $LeBv256(src1: bv256, src2: bv256): bool
{
    $Le'Bv256'(src1,src2)
}

function {:inline} $GtBv256(src1: bv256, src2: bv256): bool
{
    $Gt'Bv256'(src1,src2)
}

function {:inline} $GeBv256(src1: bv256, src2: bv256): bool
{
    $Ge'Bv256'(src1,src2)
}

function $IsValid'bv256'(v: bv256): bool {
  $Ge'Bv256'(v,0bv256) && $Le'Bv256'(v,115792089237316195423570985008687907853269984665640564039457584007913129639935bv256)
}

function {:inline} $IsEqual'bv256'(x: bv256, y: bv256): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bv256'(v: bv256) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $int2bv256(src: int) returns (dst: bv256)
{
    if (src > 115792089237316195423570985008687907853269984665640564039457584007913129639935) {
        call $ExecFailureAbort();
        return;
    }
    dst := $int2bv.256(src);
}

procedure {:inline 1} $bv2int256(src: bv256) returns (dst: int)
{
    dst := $bv2int.256(src);
}

function {:builtin "(_ int2bv 256)"} $int2bv.256(i: int) returns (bv256);
function {:builtin "bv2nat"} $bv2int.256(i: bv256) returns (int);

function $andInt'u256'(x: int, y: int) returns (int) {
    $andInt(x mod $POW_2_256, y mod $POW_2_256)
}
function $andInt'i256'(x: int, y: int) returns (int) {
    $andInt($to_i256(x), $to_i256(y))
}
axiom (forall x, y : int :: {$andInt'u256'(x, y)}
    $andInt'u256'(x, y) == $andInt(x, y) mod $POW_2_256
);
axiom (forall x, y : int :: {$andInt'u256'(x, y)}
    0 <= $andInt'u256'(x, y) && $andInt'u256'(x, y) < $POW_2_256
);
axiom (forall x, y : int :: {$andInt'u256'(x, y)}
    $to_i256($andInt'u256'(x, y)) == $andInt'i256'(x, y)
);
function $orInt'u256'(x: int, y: int) returns (int) {
    $orInt(x mod $POW_2_256, y mod $POW_2_256)
}
function $orInt'i256'(x: int, y: int) returns (int) {
    $orInt($to_i256(x), $to_i256(y))
}
axiom (forall x, y : int :: {$orInt'u256'(x, y)}
    $orInt'u256'(x, y) == $orInt(x, y) mod $POW_2_256
);
axiom (forall x, y : int :: {$orInt'u256'(x, y)}
    0 <= $orInt'u256'(x, y) && $orInt'u256'(x, y) < $POW_2_256
);
axiom (forall x, y : int :: {$orInt'u256'(x, y)}
    $to_i256($orInt'u256'(x, y)) == $orInt'i256'(x, y)
);
function $xorInt'u256'(x: int, y: int) returns (int) {
    $xorInt(x mod $POW_2_256, y mod $POW_2_256)
}
function $xorInt'i256'(x: int, y: int) returns (int) {
    $xorInt($to_i256(x), $to_i256(y))
}
axiom (forall x, y: int :: {$xorInt'u256'(x, y)}
    $xorInt'u256'(x, y) == $xorInt(x, y) mod $POW_2_256
);
axiom (forall x, y: int :: {$xorInt'u256'(x, y)}
    0 <= $xorInt'u256'(x, y) && $xorInt'u256'(x, y) < $POW_2_256
);
axiom (forall x, y : int :: {$xorInt'u256'(x, y)}
    $to_i256($xorInt'u256'(x, y)) == $xorInt'i256'(x, y)
);

function {:inline} $AndInt'u256'(src1: int, src2: int): int
{
    $andInt'u256'(src1, src2)
}
function {:inline} $OrInt'u256'(src1: int, src2: int): int
{
    $orInt'u256'(src1, src2)
}
function {:inline} $XorInt'u256'(src1: int, src2: int): int
{
    $xorInt'u256'(src1, src2)
}

datatype $Range {
    $Range(lb: int, ub: int)
}

function {:inline} $IsValid'bool'(v: bool): bool {
  true
}

function $IsValid'u8'(v: int): bool {
  v >= 0 && v <= $MAX_U8
}

function $IsValid'u16'(v: int): bool {
  v >= 0 && v <= $MAX_U16
}

function $IsValid'u32'(v: int): bool {
  v >= 0 && v <= $MAX_U32
}

function $IsValid'u64'(v: int): bool {
  v >= 0 && v <= $MAX_U64
}

function $IsValid'u128'(v: int): bool {
  v >= 0 && v <= $MAX_U128
}

function $IsValid'u256'(v: int): bool {
  v >= 0 && v <= $MAX_U256
}

function {:inline} $IsValid'num'(v: int): bool {
  true
}

function $IsValid'address'(v: int): bool {
  // TODO: restrict max to representable addresses?
  v >= 0
}

function {:inline} $IsValidRange(r: $Range): bool {
   $IsValid'u64'(r->lb) &&  $IsValid'u64'(r->ub)
}

// Intentionally not inlined so it serves as a trigger in quantifiers.
function $InRange(r: $Range, i: int): bool {
   r->lb <= i && i < r->ub
}


function {:inline} $IsEqual'u8'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'u16'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'u32'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'u64'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'u128'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'u256'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'num'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'address'(x: int, y: int): bool {
    x == y
}

function {:inline} $IsEqual'bool'(x: bool, y: bool): bool {
    x == y
}

procedure {:inline 1} $0_prover_type_inv'bool'(x: bool) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u8'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u16'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u32'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u64'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u128'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'u256'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'num'(x: int) returns (y: bool) {
    y := true;
}

procedure {:inline 1} $0_prover_type_inv'address'(x: int) returns (y: bool) {
    y := true;
}

// ============================================================================================
// Memory

datatype $Location {
    // A global resource location within the statically known resource type's memory,
    // where `a` is an address.
    $Global(a: int),
    $SpecGlobal(s: string),
    // A local location. `i` is the unique index of the local.
    $Local(i: int),
    // The location of a reference outside of the verification scope, for example, a `&mut` parameter
    // of the function being verified. References with these locations don't need to be written back
    // when mutation ends.
    $Param(i: int),
    // The location of an uninitialized mutation. Using this to make sure that the location
    // will not be equal to any valid mutation locations, i.e., $Local, $Global, or $Param.
    $Uninitialized()
}

// A mutable reference which also carries its current value. Since mutable references
// are single threaded in Move, we can keep them together and treat them as a value
// during mutation until the point they are stored back to their original location.
datatype $Mutation<T> {
    $Mutation(l: $Location, p: Vec int, v: T)
}

// Representation of memory for a given type.
datatype $Memory<T> {
    $Memory(domain: [int]bool, contents: [int]T)
}

function {:builtin "MapConst"} $ConstMemoryDomain(v: bool): [int]bool;
function {:builtin "MapConst"} $ConstMemoryContent<T>(v: T): [int]T;
axiom $ConstMemoryDomain(false) == (lambda i: int :: false);
axiom $ConstMemoryDomain(true) == (lambda i: int :: true);


// Dereferences a mutation.
function {:inline} $Dereference<T>(ref: $Mutation T): T {
    ref->v
}

// Update the value of a mutation.
function {:inline} $UpdateMutation<T>(m: $Mutation T, v: T): $Mutation T {
    $Mutation(m->l, m->p, v)
}

function {:inline} $ChildMutation<T1, T2>(m: $Mutation T1, offset: int, v: T2): $Mutation T2 {
    $Mutation(m->l, ExtendVec(m->p, offset), v)
}

// Return true if two mutations share the location and path
function {:inline} $IsSameMutation<T1, T2>(parent: $Mutation T1, child: $Mutation T2 ): bool {
    parent->l == child->l && parent->p == child->p
}

// Return true if the mutation is a parent of a child which was derived with the given edge offset. This
// is used to implement write-back choices.
function {:inline} $IsParentMutation<T1, T2>(parent: $Mutation T1, edge: int, child: $Mutation T2 ): bool {
    parent->l == child->l &&
    (var pp := parent->p;
    (var cp := child->p;
    (var pl := LenVec(pp);
    (var cl := LenVec(cp);
     cl == pl + 1 &&
     (forall i: int:: i >= 0 && i < pl ==> ReadVec(pp, i) ==  ReadVec(cp, i)) &&
     $EdgeMatches(ReadVec(cp, pl), edge)
    ))))
}

// Return true if the mutation is a parent of a child, for hyper edge.
function {:inline} $IsParentMutationHyper<T1, T2>(parent: $Mutation T1, hyper_edge: Vec int, child: $Mutation T2 ): bool {
    parent->l == child->l &&
    (var pp := parent->p;
    (var cp := child->p;
    (var pl := LenVec(pp);
    (var cl := LenVec(cp);
    (var el := LenVec(hyper_edge);
     cl == pl + el &&
     (forall i: int:: i >= 0 && i < pl ==> ReadVec(pp, i) == ReadVec(cp, i)) &&
     (forall i: int:: i >= 0 && i < el ==> $EdgeMatches(ReadVec(cp, pl + i), ReadVec(hyper_edge, i)))
    )))))
}

function {:inline} $EdgeMatches(edge: int, edge_pattern: int): bool {
    edge_pattern == -1 // wildcard
    || edge_pattern == edge
}



function {:inline} $SameLocation<T1, T2>(m1: $Mutation T1, m2: $Mutation T2): bool {
    m1->l == m2->l
}

function {:inline} $HasGlobalLocation<T>(m: $Mutation T): bool {
    (m->l) is $Global
}

function {:inline} $HasLocalLocation<T>(m: $Mutation T, idx: int): bool {
    m->l == $Local(idx)
}

function {:inline} $GlobalLocationAddress<T>(m: $Mutation T): int {
    (m->l)->a
}



// Tests whether resource exists.
function {:inline} $ResourceExists<T>(m: $Memory T, addr: int): bool {
    m->domain[addr]
}

// Obtains Value of given resource.
function {:inline} $ResourceValue<T>(m: $Memory T, addr: int): T {
    m->contents[addr]
}

// Update resource.
function {:inline} $ResourceUpdate<T>(m: $Memory T, a: int, v: T): $Memory T {
    $Memory(m->domain[a := true], m->contents[a := v])
}

// Remove resource.
function {:inline} $ResourceRemove<T>(m: $Memory T, a: int): $Memory T {
    $Memory(m->domain[a := false], m->contents)
}

// Copies resource from memory s to m.
function {:inline} $ResourceCopy<T>(m: $Memory T, s: $Memory T, a: int): $Memory T {
    $Memory(m->domain[a := s->domain[a]],
            m->contents[a := s->contents[a]])
}



// ============================================================================================
// Abort Handling

var $abort_flag: bool;
var $abort_code: int;

function {:inline} $process_abort_code(code: int): int {
    code
}

const $EXEC_FAILURE_CODE: int;
axiom $EXEC_FAILURE_CODE == -1;

// TODO(wrwg): currently we map aborts of native functions like those for vectors also to
//   execution failure. This may need to be aligned with what the runtime actually does.

procedure {:inline 1} $ExecFailureAbort() {
    $abort_flag := true;
    $abort_code := $EXEC_FAILURE_CODE;
}

procedure {:inline 1} $Abort(code: int) {
    $abort_flag := true;
    $abort_code := code;
}

function {:inline} $StdError(cat: int, reason: int): int {
    reason * 256 + cat
}

procedure {:inline 1} $InitVerification() {
    // Set abort_flag to false, and havoc abort_code
    $abort_flag := false;
    havoc $abort_code;
    // Initialize event store
    call $InitEventStore();
}

// ============================================================================================
// Instructions


procedure {:inline 1} $CastU8(src: int) returns (dst: int)
{
    if (src > $MAX_U8) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $CastU16(src: int) returns (dst: int)
{
    if (src > $MAX_U16) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $CastU32(src: int) returns (dst: int)
{
    if (src > $MAX_U32) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $CastU64(src: int) returns (dst: int)
{
    if (src > $MAX_U64) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $CastU128(src: int) returns (dst: int)
{
    if (src > $MAX_U128) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $CastU256(src: int) returns (dst: int)
{
    if (src > $MAX_U256) {
        call $ExecFailureAbort();
    }
    dst := src;
}

procedure {:inline 1} $AddU8(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U8) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

procedure {:inline 1} $AddU16(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U16) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

function {:inline} $AddU16_unchecked(src1: int, src2: int): int
{
    src1 + src2
}

procedure {:inline 1} $AddU32(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U32) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

function {:inline} $AddU32_unchecked(src1: int, src2: int): int
{
    src1 + src2
}

procedure {:inline 1} $AddU64(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U64) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

function {:inline} $AddU64_unchecked(src1: int, src2: int): int
{
    src1 + src2
}

procedure {:inline 1} $AddU128(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U128) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

function {:inline} $AddU128_unchecked(src1: int, src2: int): int
{
    src1 + src2
}

procedure {:inline 1} $AddU256(src1: int, src2: int) returns (dst: int)
{
    if (src1 + src2 > $MAX_U256) {
        call $ExecFailureAbort();
    }
    dst := src1 + src2;
}

function {:inline} $AddU256_unchecked(src1: int, src2: int): int
{
    src1 + src2
}

procedure {:inline 1} $Sub(src1: int, src2: int) returns (dst: int)
{
    if (src1 < src2) {
        call $ExecFailureAbort();
    }
    dst := src1 - src2;
}

// uninterpreted function to return an undefined value.
function $undefined_int(): int;

// Recursive exponentiation function
// Undefined unless e >=0.  $pow(0,0) is also undefined.
function $pow(n: int, e: int): int {
    if n != 0 && e == 0 then 1
    else if e > 0 then n * $pow(n, e - 1)
    else $undefined_int()
}

function $pow_real(n: real, e: int): real {
    if n == 0.0 then 0.0
    else (
        if e == 0 then 1.0
        else if e > 0 then n * $pow_real(n, e - 1)
        else 1.0 / $pow_real(n, -e)
    )
}

function $shl(src1: int, p: int): int {
    src1 * $pow(2, p)
}

function $shlU8(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 256
}

function $shlU16(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 65536
}

function $shlU32(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 4294967296
}

function $shlU64(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 18446744073709551616
}

function $shlU128(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 340282366920938463463374607431768211456
}

function $shlU256(src1: int, p: int): int {
    (src1 * $pow(2, p)) mod 115792089237316195423570985008687907853269984665640564039457584007913129639936
}

function $shr(src1: int, p: int): int {
    src1 div $pow(2, p)
}

// Integer 2 root function (floor)
// $sqrt_int(x) returns the largest integer r such that r^2 <= x
// i.e., floor(x^(1/2))
// Undefined for x < 0
function $sqrt_int(x: int): int;

// Core axioms for $sqrt_int (these uniquely define the function)
axiom (forall x: int :: x >= 0 ==> $sqrt_int(x) >= 0);
axiom (forall x: int :: x >= 0 ==> $sqrt_int(x) * $sqrt_int(x) <= x);
axiom (forall x: int :: x >= 0 ==> ($sqrt_int(x) + 1) * ($sqrt_int(x) + 1) > x);

// Edge case axioms for $sqrt_int (derived, but help SMT solver)
axiom $sqrt_int(0) == 0;
axiom $sqrt_int(1) == 1;

// Real 2 root function
// $sqrt_real(x, 2) returns x^(1/2) - the 2-th root of x
// Undefined for x < 0
function $sqrt_real(x: real): real;

// Core axioms for $sqrt_real
axiom (forall x: real :: x >= 0.0 ==> $sqrt_real(x) >= 0.0);
axiom (forall x: real :: x >= 0.0 ==> $sqrt_real(x) * $sqrt_real(x) == x);

// Edge case axioms for $sqrt_real
axiom $sqrt_real(0.0) == 0.0;
axiom $sqrt_real(1.0) == 1.0;

// We need to know the size of the destination in order to drop bits
// that have been shifted left more than that, so we have $ShlU8/16/32/64/128/256
procedure {:inline 1} $ShlU8(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 8) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shlU8(src1, src2);
}

// Template for cast and shift operations of bitvector types

procedure {:inline 1} $CastBv8to8(src: bv8) returns (dst: bv8)
{
    dst := src;
}


function $shlBv8From8(src1: bv8, src2: bv8) returns (bv8)
{
    $Shl'Bv8'(src1, src2)
}

procedure {:inline 1} $ShlBv8From8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if ($Ge'Bv8'(src2, 8bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2);
}

function $shrBv8From8(src1: bv8, src2: bv8) returns (bv8)
{
    $Shr'Bv8'(src1, src2)
}

procedure {:inline 1} $ShrBv8From8(src1: bv8, src2: bv8) returns (dst: bv8)
{
    if ($Ge'Bv8'(src2, 8bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2);
}

procedure {:inline 1} $CastBv16to8(src: bv16) returns (dst: bv8)
{
    if ($Gt'Bv16'(src, 255bv16)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[8:0];
}


function $shlBv8From16(src1: bv8, src2: bv16) returns (bv8)
{
    $Shl'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShlBv8From16(src1: bv8, src2: bv16) returns (dst: bv8)
{
    if ($Ge'Bv16'(src2, 8bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2[8:0]);
}

function $shrBv8From16(src1: bv8, src2: bv16) returns (bv8)
{
    $Shr'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShrBv8From16(src1: bv8, src2: bv16) returns (dst: bv8)
{
    if ($Ge'Bv16'(src2, 8bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2[8:0]);
}

procedure {:inline 1} $CastBv32to8(src: bv32) returns (dst: bv8)
{
    if ($Gt'Bv32'(src, 255bv32)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[8:0];
}


function $shlBv8From32(src1: bv8, src2: bv32) returns (bv8)
{
    $Shl'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShlBv8From32(src1: bv8, src2: bv32) returns (dst: bv8)
{
    if ($Ge'Bv32'(src2, 8bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2[8:0]);
}

function $shrBv8From32(src1: bv8, src2: bv32) returns (bv8)
{
    $Shr'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShrBv8From32(src1: bv8, src2: bv32) returns (dst: bv8)
{
    if ($Ge'Bv32'(src2, 8bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2[8:0]);
}

procedure {:inline 1} $CastBv64to8(src: bv64) returns (dst: bv8)
{
    if ($Gt'Bv64'(src, 255bv64)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[8:0];
}


function $shlBv8From64(src1: bv8, src2: bv64) returns (bv8)
{
    $Shl'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShlBv8From64(src1: bv8, src2: bv64) returns (dst: bv8)
{
    if ($Ge'Bv64'(src2, 8bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2[8:0]);
}

function $shrBv8From64(src1: bv8, src2: bv64) returns (bv8)
{
    $Shr'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShrBv8From64(src1: bv8, src2: bv64) returns (dst: bv8)
{
    if ($Ge'Bv64'(src2, 8bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2[8:0]);
}

procedure {:inline 1} $CastBv128to8(src: bv128) returns (dst: bv8)
{
    if ($Gt'Bv128'(src, 255bv128)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[8:0];
}


function $shlBv8From128(src1: bv8, src2: bv128) returns (bv8)
{
    $Shl'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShlBv8From128(src1: bv8, src2: bv128) returns (dst: bv8)
{
    if ($Ge'Bv128'(src2, 8bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2[8:0]);
}

function $shrBv8From128(src1: bv8, src2: bv128) returns (bv8)
{
    $Shr'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShrBv8From128(src1: bv8, src2: bv128) returns (dst: bv8)
{
    if ($Ge'Bv128'(src2, 8bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2[8:0]);
}

procedure {:inline 1} $CastBv256to8(src: bv256) returns (dst: bv8)
{
    if ($Gt'Bv256'(src, 255bv256)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[8:0];
}


function $shlBv8From256(src1: bv8, src2: bv256) returns (bv8)
{
    $Shl'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShlBv8From256(src1: bv8, src2: bv256) returns (dst: bv8)
{
    if ($Ge'Bv256'(src2, 8bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv8'(src1, src2[8:0]);
}

function $shrBv8From256(src1: bv8, src2: bv256) returns (bv8)
{
    $Shr'Bv8'(src1, src2[8:0])
}

procedure {:inline 1} $ShrBv8From256(src1: bv8, src2: bv256) returns (dst: bv8)
{
    if ($Ge'Bv256'(src2, 8bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv8'(src1, src2[8:0]);
}

procedure {:inline 1} $CastBv8to16(src: bv8) returns (dst: bv16)
{
    dst := 0bv8 ++ src;
}


function $shlBv16From8(src1: bv16, src2: bv8) returns (bv16)
{
    $Shl'Bv16'(src1, 0bv8 ++ src2)
}

procedure {:inline 1} $ShlBv16From8(src1: bv16, src2: bv8) returns (dst: bv16)
{
    if ($Ge'Bv8'(src2, 16bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, 0bv8 ++ src2);
}

function $shrBv16From8(src1: bv16, src2: bv8) returns (bv16)
{
    $Shr'Bv16'(src1, 0bv8 ++ src2)
}

procedure {:inline 1} $ShrBv16From8(src1: bv16, src2: bv8) returns (dst: bv16)
{
    if ($Ge'Bv8'(src2, 16bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, 0bv8 ++ src2);
}

procedure {:inline 1} $CastBv16to16(src: bv16) returns (dst: bv16)
{
    dst := src;
}


function $shlBv16From16(src1: bv16, src2: bv16) returns (bv16)
{
    $Shl'Bv16'(src1, src2)
}

procedure {:inline 1} $ShlBv16From16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if ($Ge'Bv16'(src2, 16bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, src2);
}

function $shrBv16From16(src1: bv16, src2: bv16) returns (bv16)
{
    $Shr'Bv16'(src1, src2)
}

procedure {:inline 1} $ShrBv16From16(src1: bv16, src2: bv16) returns (dst: bv16)
{
    if ($Ge'Bv16'(src2, 16bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, src2);
}

procedure {:inline 1} $CastBv32to16(src: bv32) returns (dst: bv16)
{
    if ($Gt'Bv32'(src, 65535bv32)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[16:0];
}


function $shlBv16From32(src1: bv16, src2: bv32) returns (bv16)
{
    $Shl'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShlBv16From32(src1: bv16, src2: bv32) returns (dst: bv16)
{
    if ($Ge'Bv32'(src2, 16bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, src2[16:0]);
}

function $shrBv16From32(src1: bv16, src2: bv32) returns (bv16)
{
    $Shr'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShrBv16From32(src1: bv16, src2: bv32) returns (dst: bv16)
{
    if ($Ge'Bv32'(src2, 16bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, src2[16:0]);
}

procedure {:inline 1} $CastBv64to16(src: bv64) returns (dst: bv16)
{
    if ($Gt'Bv64'(src, 65535bv64)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[16:0];
}


function $shlBv16From64(src1: bv16, src2: bv64) returns (bv16)
{
    $Shl'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShlBv16From64(src1: bv16, src2: bv64) returns (dst: bv16)
{
    if ($Ge'Bv64'(src2, 16bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, src2[16:0]);
}

function $shrBv16From64(src1: bv16, src2: bv64) returns (bv16)
{
    $Shr'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShrBv16From64(src1: bv16, src2: bv64) returns (dst: bv16)
{
    if ($Ge'Bv64'(src2, 16bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, src2[16:0]);
}

procedure {:inline 1} $CastBv128to16(src: bv128) returns (dst: bv16)
{
    if ($Gt'Bv128'(src, 65535bv128)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[16:0];
}


function $shlBv16From128(src1: bv16, src2: bv128) returns (bv16)
{
    $Shl'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShlBv16From128(src1: bv16, src2: bv128) returns (dst: bv16)
{
    if ($Ge'Bv128'(src2, 16bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, src2[16:0]);
}

function $shrBv16From128(src1: bv16, src2: bv128) returns (bv16)
{
    $Shr'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShrBv16From128(src1: bv16, src2: bv128) returns (dst: bv16)
{
    if ($Ge'Bv128'(src2, 16bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, src2[16:0]);
}

procedure {:inline 1} $CastBv256to16(src: bv256) returns (dst: bv16)
{
    if ($Gt'Bv256'(src, 65535bv256)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[16:0];
}


function $shlBv16From256(src1: bv16, src2: bv256) returns (bv16)
{
    $Shl'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShlBv16From256(src1: bv16, src2: bv256) returns (dst: bv16)
{
    if ($Ge'Bv256'(src2, 16bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv16'(src1, src2[16:0]);
}

function $shrBv16From256(src1: bv16, src2: bv256) returns (bv16)
{
    $Shr'Bv16'(src1, src2[16:0])
}

procedure {:inline 1} $ShrBv16From256(src1: bv16, src2: bv256) returns (dst: bv16)
{
    if ($Ge'Bv256'(src2, 16bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv16'(src1, src2[16:0]);
}

procedure {:inline 1} $CastBv8to32(src: bv8) returns (dst: bv32)
{
    dst := 0bv24 ++ src;
}


function $shlBv32From8(src1: bv32, src2: bv8) returns (bv32)
{
    $Shl'Bv32'(src1, 0bv24 ++ src2)
}

procedure {:inline 1} $ShlBv32From8(src1: bv32, src2: bv8) returns (dst: bv32)
{
    if ($Ge'Bv8'(src2, 32bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, 0bv24 ++ src2);
}

function $shrBv32From8(src1: bv32, src2: bv8) returns (bv32)
{
    $Shr'Bv32'(src1, 0bv24 ++ src2)
}

procedure {:inline 1} $ShrBv32From8(src1: bv32, src2: bv8) returns (dst: bv32)
{
    if ($Ge'Bv8'(src2, 32bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, 0bv24 ++ src2);
}

procedure {:inline 1} $CastBv16to32(src: bv16) returns (dst: bv32)
{
    dst := 0bv16 ++ src;
}


function $shlBv32From16(src1: bv32, src2: bv16) returns (bv32)
{
    $Shl'Bv32'(src1, 0bv16 ++ src2)
}

procedure {:inline 1} $ShlBv32From16(src1: bv32, src2: bv16) returns (dst: bv32)
{
    if ($Ge'Bv16'(src2, 32bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, 0bv16 ++ src2);
}

function $shrBv32From16(src1: bv32, src2: bv16) returns (bv32)
{
    $Shr'Bv32'(src1, 0bv16 ++ src2)
}

procedure {:inline 1} $ShrBv32From16(src1: bv32, src2: bv16) returns (dst: bv32)
{
    if ($Ge'Bv16'(src2, 32bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, 0bv16 ++ src2);
}

procedure {:inline 1} $CastBv32to32(src: bv32) returns (dst: bv32)
{
    dst := src;
}


function $shlBv32From32(src1: bv32, src2: bv32) returns (bv32)
{
    $Shl'Bv32'(src1, src2)
}

procedure {:inline 1} $ShlBv32From32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if ($Ge'Bv32'(src2, 32bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, src2);
}

function $shrBv32From32(src1: bv32, src2: bv32) returns (bv32)
{
    $Shr'Bv32'(src1, src2)
}

procedure {:inline 1} $ShrBv32From32(src1: bv32, src2: bv32) returns (dst: bv32)
{
    if ($Ge'Bv32'(src2, 32bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, src2);
}

procedure {:inline 1} $CastBv64to32(src: bv64) returns (dst: bv32)
{
    if ($Gt'Bv64'(src, 4294967295bv64)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[32:0];
}


function $shlBv32From64(src1: bv32, src2: bv64) returns (bv32)
{
    $Shl'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShlBv32From64(src1: bv32, src2: bv64) returns (dst: bv32)
{
    if ($Ge'Bv64'(src2, 32bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, src2[32:0]);
}

function $shrBv32From64(src1: bv32, src2: bv64) returns (bv32)
{
    $Shr'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShrBv32From64(src1: bv32, src2: bv64) returns (dst: bv32)
{
    if ($Ge'Bv64'(src2, 32bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, src2[32:0]);
}

procedure {:inline 1} $CastBv128to32(src: bv128) returns (dst: bv32)
{
    if ($Gt'Bv128'(src, 4294967295bv128)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[32:0];
}


function $shlBv32From128(src1: bv32, src2: bv128) returns (bv32)
{
    $Shl'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShlBv32From128(src1: bv32, src2: bv128) returns (dst: bv32)
{
    if ($Ge'Bv128'(src2, 32bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, src2[32:0]);
}

function $shrBv32From128(src1: bv32, src2: bv128) returns (bv32)
{
    $Shr'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShrBv32From128(src1: bv32, src2: bv128) returns (dst: bv32)
{
    if ($Ge'Bv128'(src2, 32bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, src2[32:0]);
}

procedure {:inline 1} $CastBv256to32(src: bv256) returns (dst: bv32)
{
    if ($Gt'Bv256'(src, 4294967295bv256)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[32:0];
}


function $shlBv32From256(src1: bv32, src2: bv256) returns (bv32)
{
    $Shl'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShlBv32From256(src1: bv32, src2: bv256) returns (dst: bv32)
{
    if ($Ge'Bv256'(src2, 32bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv32'(src1, src2[32:0]);
}

function $shrBv32From256(src1: bv32, src2: bv256) returns (bv32)
{
    $Shr'Bv32'(src1, src2[32:0])
}

procedure {:inline 1} $ShrBv32From256(src1: bv32, src2: bv256) returns (dst: bv32)
{
    if ($Ge'Bv256'(src2, 32bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv32'(src1, src2[32:0]);
}

procedure {:inline 1} $CastBv8to64(src: bv8) returns (dst: bv64)
{
    dst := 0bv56 ++ src;
}


function $shlBv64From8(src1: bv64, src2: bv8) returns (bv64)
{
    $Shl'Bv64'(src1, 0bv56 ++ src2)
}

procedure {:inline 1} $ShlBv64From8(src1: bv64, src2: bv8) returns (dst: bv64)
{
    if ($Ge'Bv8'(src2, 64bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, 0bv56 ++ src2);
}

function $shrBv64From8(src1: bv64, src2: bv8) returns (bv64)
{
    $Shr'Bv64'(src1, 0bv56 ++ src2)
}

procedure {:inline 1} $ShrBv64From8(src1: bv64, src2: bv8) returns (dst: bv64)
{
    if ($Ge'Bv8'(src2, 64bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, 0bv56 ++ src2);
}

procedure {:inline 1} $CastBv16to64(src: bv16) returns (dst: bv64)
{
    dst := 0bv48 ++ src;
}


function $shlBv64From16(src1: bv64, src2: bv16) returns (bv64)
{
    $Shl'Bv64'(src1, 0bv48 ++ src2)
}

procedure {:inline 1} $ShlBv64From16(src1: bv64, src2: bv16) returns (dst: bv64)
{
    if ($Ge'Bv16'(src2, 64bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, 0bv48 ++ src2);
}

function $shrBv64From16(src1: bv64, src2: bv16) returns (bv64)
{
    $Shr'Bv64'(src1, 0bv48 ++ src2)
}

procedure {:inline 1} $ShrBv64From16(src1: bv64, src2: bv16) returns (dst: bv64)
{
    if ($Ge'Bv16'(src2, 64bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, 0bv48 ++ src2);
}

procedure {:inline 1} $CastBv32to64(src: bv32) returns (dst: bv64)
{
    dst := 0bv32 ++ src;
}


function $shlBv64From32(src1: bv64, src2: bv32) returns (bv64)
{
    $Shl'Bv64'(src1, 0bv32 ++ src2)
}

procedure {:inline 1} $ShlBv64From32(src1: bv64, src2: bv32) returns (dst: bv64)
{
    if ($Ge'Bv32'(src2, 64bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, 0bv32 ++ src2);
}

function $shrBv64From32(src1: bv64, src2: bv32) returns (bv64)
{
    $Shr'Bv64'(src1, 0bv32 ++ src2)
}

procedure {:inline 1} $ShrBv64From32(src1: bv64, src2: bv32) returns (dst: bv64)
{
    if ($Ge'Bv32'(src2, 64bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, 0bv32 ++ src2);
}

procedure {:inline 1} $CastBv64to64(src: bv64) returns (dst: bv64)
{
    dst := src;
}


function $shlBv64From64(src1: bv64, src2: bv64) returns (bv64)
{
    $Shl'Bv64'(src1, src2)
}

procedure {:inline 1} $ShlBv64From64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if ($Ge'Bv64'(src2, 64bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, src2);
}

function $shrBv64From64(src1: bv64, src2: bv64) returns (bv64)
{
    $Shr'Bv64'(src1, src2)
}

procedure {:inline 1} $ShrBv64From64(src1: bv64, src2: bv64) returns (dst: bv64)
{
    if ($Ge'Bv64'(src2, 64bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, src2);
}

procedure {:inline 1} $CastBv128to64(src: bv128) returns (dst: bv64)
{
    if ($Gt'Bv128'(src, 18446744073709551615bv128)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[64:0];
}


function $shlBv64From128(src1: bv64, src2: bv128) returns (bv64)
{
    $Shl'Bv64'(src1, src2[64:0])
}

procedure {:inline 1} $ShlBv64From128(src1: bv64, src2: bv128) returns (dst: bv64)
{
    if ($Ge'Bv128'(src2, 64bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, src2[64:0]);
}

function $shrBv64From128(src1: bv64, src2: bv128) returns (bv64)
{
    $Shr'Bv64'(src1, src2[64:0])
}

procedure {:inline 1} $ShrBv64From128(src1: bv64, src2: bv128) returns (dst: bv64)
{
    if ($Ge'Bv128'(src2, 64bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, src2[64:0]);
}

procedure {:inline 1} $CastBv256to64(src: bv256) returns (dst: bv64)
{
    if ($Gt'Bv256'(src, 18446744073709551615bv256)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[64:0];
}


function $shlBv64From256(src1: bv64, src2: bv256) returns (bv64)
{
    $Shl'Bv64'(src1, src2[64:0])
}

procedure {:inline 1} $ShlBv64From256(src1: bv64, src2: bv256) returns (dst: bv64)
{
    if ($Ge'Bv256'(src2, 64bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv64'(src1, src2[64:0]);
}

function $shrBv64From256(src1: bv64, src2: bv256) returns (bv64)
{
    $Shr'Bv64'(src1, src2[64:0])
}

procedure {:inline 1} $ShrBv64From256(src1: bv64, src2: bv256) returns (dst: bv64)
{
    if ($Ge'Bv256'(src2, 64bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv64'(src1, src2[64:0]);
}

procedure {:inline 1} $CastBv8to128(src: bv8) returns (dst: bv128)
{
    dst := 0bv120 ++ src;
}


function $shlBv128From8(src1: bv128, src2: bv8) returns (bv128)
{
    $Shl'Bv128'(src1, 0bv120 ++ src2)
}

procedure {:inline 1} $ShlBv128From8(src1: bv128, src2: bv8) returns (dst: bv128)
{
    if ($Ge'Bv8'(src2, 128bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, 0bv120 ++ src2);
}

function $shrBv128From8(src1: bv128, src2: bv8) returns (bv128)
{
    $Shr'Bv128'(src1, 0bv120 ++ src2)
}

procedure {:inline 1} $ShrBv128From8(src1: bv128, src2: bv8) returns (dst: bv128)
{
    if ($Ge'Bv8'(src2, 128bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, 0bv120 ++ src2);
}

procedure {:inline 1} $CastBv16to128(src: bv16) returns (dst: bv128)
{
    dst := 0bv112 ++ src;
}


function $shlBv128From16(src1: bv128, src2: bv16) returns (bv128)
{
    $Shl'Bv128'(src1, 0bv112 ++ src2)
}

procedure {:inline 1} $ShlBv128From16(src1: bv128, src2: bv16) returns (dst: bv128)
{
    if ($Ge'Bv16'(src2, 128bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, 0bv112 ++ src2);
}

function $shrBv128From16(src1: bv128, src2: bv16) returns (bv128)
{
    $Shr'Bv128'(src1, 0bv112 ++ src2)
}

procedure {:inline 1} $ShrBv128From16(src1: bv128, src2: bv16) returns (dst: bv128)
{
    if ($Ge'Bv16'(src2, 128bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, 0bv112 ++ src2);
}

procedure {:inline 1} $CastBv32to128(src: bv32) returns (dst: bv128)
{
    dst := 0bv96 ++ src;
}


function $shlBv128From32(src1: bv128, src2: bv32) returns (bv128)
{
    $Shl'Bv128'(src1, 0bv96 ++ src2)
}

procedure {:inline 1} $ShlBv128From32(src1: bv128, src2: bv32) returns (dst: bv128)
{
    if ($Ge'Bv32'(src2, 128bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, 0bv96 ++ src2);
}

function $shrBv128From32(src1: bv128, src2: bv32) returns (bv128)
{
    $Shr'Bv128'(src1, 0bv96 ++ src2)
}

procedure {:inline 1} $ShrBv128From32(src1: bv128, src2: bv32) returns (dst: bv128)
{
    if ($Ge'Bv32'(src2, 128bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, 0bv96 ++ src2);
}

procedure {:inline 1} $CastBv64to128(src: bv64) returns (dst: bv128)
{
    dst := 0bv64 ++ src;
}


function $shlBv128From64(src1: bv128, src2: bv64) returns (bv128)
{
    $Shl'Bv128'(src1, 0bv64 ++ src2)
}

procedure {:inline 1} $ShlBv128From64(src1: bv128, src2: bv64) returns (dst: bv128)
{
    if ($Ge'Bv64'(src2, 128bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, 0bv64 ++ src2);
}

function $shrBv128From64(src1: bv128, src2: bv64) returns (bv128)
{
    $Shr'Bv128'(src1, 0bv64 ++ src2)
}

procedure {:inline 1} $ShrBv128From64(src1: bv128, src2: bv64) returns (dst: bv128)
{
    if ($Ge'Bv64'(src2, 128bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, 0bv64 ++ src2);
}

procedure {:inline 1} $CastBv128to128(src: bv128) returns (dst: bv128)
{
    dst := src;
}


function $shlBv128From128(src1: bv128, src2: bv128) returns (bv128)
{
    $Shl'Bv128'(src1, src2)
}

procedure {:inline 1} $ShlBv128From128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if ($Ge'Bv128'(src2, 128bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, src2);
}

function $shrBv128From128(src1: bv128, src2: bv128) returns (bv128)
{
    $Shr'Bv128'(src1, src2)
}

procedure {:inline 1} $ShrBv128From128(src1: bv128, src2: bv128) returns (dst: bv128)
{
    if ($Ge'Bv128'(src2, 128bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, src2);
}

procedure {:inline 1} $CastBv256to128(src: bv256) returns (dst: bv128)
{
    if ($Gt'Bv256'(src, 340282366920938463463374607431768211455bv256)) {
            call $ExecFailureAbort();
            return;
    }
    dst := src[128:0];
}


function $shlBv128From256(src1: bv128, src2: bv256) returns (bv128)
{
    $Shl'Bv128'(src1, src2[128:0])
}

procedure {:inline 1} $ShlBv128From256(src1: bv128, src2: bv256) returns (dst: bv128)
{
    if ($Ge'Bv256'(src2, 128bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv128'(src1, src2[128:0]);
}

function $shrBv128From256(src1: bv128, src2: bv256) returns (bv128)
{
    $Shr'Bv128'(src1, src2[128:0])
}

procedure {:inline 1} $ShrBv128From256(src1: bv128, src2: bv256) returns (dst: bv128)
{
    if ($Ge'Bv256'(src2, 128bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv128'(src1, src2[128:0]);
}

procedure {:inline 1} $CastBv8to256(src: bv8) returns (dst: bv256)
{
    dst := 0bv248 ++ src;
}


function $shlBv256From8(src1: bv256, src2: bv8) returns (bv256)
{
    $Shl'Bv256'(src1, 0bv248 ++ src2)
}

procedure {:inline 1} $ShlBv256From8(src1: bv256, src2: bv8) returns (dst: bv256)
{
    if ($Ge'Bv8'(src2, 256bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, 0bv248 ++ src2);
}

function $shrBv256From8(src1: bv256, src2: bv8) returns (bv256)
{
    $Shr'Bv256'(src1, 0bv248 ++ src2)
}

procedure {:inline 1} $ShrBv256From8(src1: bv256, src2: bv8) returns (dst: bv256)
{
    if ($Ge'Bv8'(src2, 256bv8)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, 0bv248 ++ src2);
}

procedure {:inline 1} $CastBv16to256(src: bv16) returns (dst: bv256)
{
    dst := 0bv240 ++ src;
}


function $shlBv256From16(src1: bv256, src2: bv16) returns (bv256)
{
    $Shl'Bv256'(src1, 0bv240 ++ src2)
}

procedure {:inline 1} $ShlBv256From16(src1: bv256, src2: bv16) returns (dst: bv256)
{
    if ($Ge'Bv16'(src2, 256bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, 0bv240 ++ src2);
}

function $shrBv256From16(src1: bv256, src2: bv16) returns (bv256)
{
    $Shr'Bv256'(src1, 0bv240 ++ src2)
}

procedure {:inline 1} $ShrBv256From16(src1: bv256, src2: bv16) returns (dst: bv256)
{
    if ($Ge'Bv16'(src2, 256bv16)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, 0bv240 ++ src2);
}

procedure {:inline 1} $CastBv32to256(src: bv32) returns (dst: bv256)
{
    dst := 0bv224 ++ src;
}


function $shlBv256From32(src1: bv256, src2: bv32) returns (bv256)
{
    $Shl'Bv256'(src1, 0bv224 ++ src2)
}

procedure {:inline 1} $ShlBv256From32(src1: bv256, src2: bv32) returns (dst: bv256)
{
    if ($Ge'Bv32'(src2, 256bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, 0bv224 ++ src2);
}

function $shrBv256From32(src1: bv256, src2: bv32) returns (bv256)
{
    $Shr'Bv256'(src1, 0bv224 ++ src2)
}

procedure {:inline 1} $ShrBv256From32(src1: bv256, src2: bv32) returns (dst: bv256)
{
    if ($Ge'Bv32'(src2, 256bv32)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, 0bv224 ++ src2);
}

procedure {:inline 1} $CastBv64to256(src: bv64) returns (dst: bv256)
{
    dst := 0bv192 ++ src;
}


function $shlBv256From64(src1: bv256, src2: bv64) returns (bv256)
{
    $Shl'Bv256'(src1, 0bv192 ++ src2)
}

procedure {:inline 1} $ShlBv256From64(src1: bv256, src2: bv64) returns (dst: bv256)
{
    if ($Ge'Bv64'(src2, 256bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, 0bv192 ++ src2);
}

function $shrBv256From64(src1: bv256, src2: bv64) returns (bv256)
{
    $Shr'Bv256'(src1, 0bv192 ++ src2)
}

procedure {:inline 1} $ShrBv256From64(src1: bv256, src2: bv64) returns (dst: bv256)
{
    if ($Ge'Bv64'(src2, 256bv64)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, 0bv192 ++ src2);
}

procedure {:inline 1} $CastBv128to256(src: bv128) returns (dst: bv256)
{
    dst := 0bv128 ++ src;
}


function $shlBv256From128(src1: bv256, src2: bv128) returns (bv256)
{
    $Shl'Bv256'(src1, 0bv128 ++ src2)
}

procedure {:inline 1} $ShlBv256From128(src1: bv256, src2: bv128) returns (dst: bv256)
{
    if ($Ge'Bv128'(src2, 256bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, 0bv128 ++ src2);
}

function $shrBv256From128(src1: bv256, src2: bv128) returns (bv256)
{
    $Shr'Bv256'(src1, 0bv128 ++ src2)
}

procedure {:inline 1} $ShrBv256From128(src1: bv256, src2: bv128) returns (dst: bv256)
{
    if ($Ge'Bv128'(src2, 256bv128)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, 0bv128 ++ src2);
}

procedure {:inline 1} $CastBv256to256(src: bv256) returns (dst: bv256)
{
    dst := src;
}


function $shlBv256From256(src1: bv256, src2: bv256) returns (bv256)
{
    $Shl'Bv256'(src1, src2)
}

procedure {:inline 1} $ShlBv256From256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if ($Ge'Bv256'(src2, 256bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shl'Bv256'(src1, src2);
}

function $shrBv256From256(src1: bv256, src2: bv256) returns (bv256)
{
    $Shr'Bv256'(src1, src2)
}

procedure {:inline 1} $ShrBv256From256(src1: bv256, src2: bv256) returns (dst: bv256)
{
    if ($Ge'Bv256'(src2, 256bv256)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Shr'Bv256'(src1, src2);
}

procedure {:inline 1} $ShlU16(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 16) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shlU16(src1, src2);
}

procedure {:inline 1} $ShlU32(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 32) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shlU32(src1, src2);
}

procedure {:inline 1} $ShlU64(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 64) {
       call $ExecFailureAbort();
       return;
    }
    dst := $shlU64(src1, src2);
}

procedure {:inline 1} $ShlU128(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 128) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shlU128(src1, src2);
}

procedure {:inline 1} $ShlU256(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    dst := $shlU256(src1, src2);
}

procedure {:inline 1} $Shr(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU8(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 8) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU16(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 16) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU32(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 32) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU64(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 64) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU128(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    if (src2 >= 128) {
        call $ExecFailureAbort();
        return;
    }
    dst := $shr(src1, src2);
}

procedure {:inline 1} $ShrU256(src1: int, src2: int) returns (dst: int)
{
    var res: int;
    // src2 is a u8
    assume src2 >= 0 && src2 < 256;
    dst := $shr(src1, src2);
}

procedure {:inline 1} $MulU8(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U8) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $MulU16(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U16) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $MulU32(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U32) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $MulU64(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U64) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $MulU128(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U128) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $MulU256(src1: int, src2: int) returns (dst: int)
{
    if (src1 * src2 > $MAX_U256) {
        call $ExecFailureAbort();
    }
    dst := src1 * src2;
}

procedure {:inline 1} $Div(src1: int, src2: int) returns (dst: int)
{
    if (src2 == 0) {
        call $ExecFailureAbort();
    }
    dst := src1 div src2;
}

procedure {:inline 1} $Mod(src1: int, src2: int) returns (dst: int)
{
    if (src2 == 0) {
        call $ExecFailureAbort();
    }
    dst := src1 mod src2;
}

procedure {:inline 1} $ArithBinaryUnimplemented(src1: int, src2: int) returns (dst: int);

function {:inline} $Lt(src1: int, src2: int): bool
{
    src1 < src2
}

function {:inline} $Gt(src1: int, src2: int): bool
{
    src1 > src2
}

function {:inline} $Le(src1: int, src2: int): bool
{
    src1 <= src2
}

function {:inline} $Ge(src1: int, src2: int): bool
{
    src1 >= src2
}

function {:inline} $And(src1: bool, src2: bool): bool
{
    src1 && src2
}

function {:inline} $Or(src1: bool, src2: bool): bool
{
    src1 || src2
}

function {:inline} $Not(src: bool): bool
{
    !src
}

// Pack and Unpack are auto-generated for each type T

// ==================================================================================
// Native Option


// ==================================================================================
// Native Vector

function {:inline} $SliceVecByRange<T>(v: Vec T, r: $Range): Vec T {
    SliceVec(v, r->lb, r->ub)
}

// ----------------------------------------------------------------------------------
// Native Vector implementation for element type `$0_memory_BlobRef`

// Not inlined. It appears faster this way.
function $IsEqual'vec'$0_memory_BlobRef''(v1: Vec ($0_memory_BlobRef), v2: Vec ($0_memory_BlobRef)): bool {
    LenVec(v1) == LenVec(v2) &&
    (forall i: int:: InRangeVec(v1, i) ==> $IsEqual'$0_memory_BlobRef'(ReadVec(v1, i), ReadVec(v2, i)))
}

// Not inlined.
function $IsPrefix'vec'$0_memory_BlobRef''(v: Vec ($0_memory_BlobRef), prefix: Vec ($0_memory_BlobRef)): bool {
    LenVec(v) >= LenVec(prefix) &&
    (forall i: int:: InRangeVec(prefix, i) ==> $IsEqual'$0_memory_BlobRef'(ReadVec(v, i), ReadVec(prefix, i)))
}

// Not inlined.
function $IsSuffix'vec'$0_memory_BlobRef''(v: Vec ($0_memory_BlobRef), suffix: Vec ($0_memory_BlobRef)): bool {
    LenVec(v) >= LenVec(suffix) &&
    (forall i: int:: InRangeVec(suffix, i) ==> $IsEqual'$0_memory_BlobRef'(ReadVec(v, LenVec(v) - LenVec(suffix) + i), ReadVec(suffix, i)))
}

// Not inlined.
function $IsValid'vec'$0_memory_BlobRef''(v: Vec ($0_memory_BlobRef)): bool {
    $IsValid'u64'(LenVec(v)) &&
    (forall i: int:: InRangeVec(v, i) ==> $IsValid'$0_memory_BlobRef'(ReadVec(v, i)))
}

// Not inlined.
procedure {:inline 1} $0_prover_type_inv'vec'$0_memory_BlobRef''(v: Vec ($0_memory_BlobRef)) returns (res: bool) {
    res := true;
}


function {:inline} $ContainsVec'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef): bool {
    (exists i: int :: $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'$0_memory_BlobRef'(ReadVec(v, i), e))
}

function $IndexOfVec'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef): int;
axiom (forall v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef:: {$IndexOfVec'$0_memory_BlobRef'(v, e)}
    (var i := $IndexOfVec'$0_memory_BlobRef'(v, e);
     if (!$ContainsVec'$0_memory_BlobRef'(v, e)) then i == -1
     else $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'$0_memory_BlobRef'(ReadVec(v, i), e) &&
        (forall j: int :: $IsValid'u64'(j) && j >= 0 && j < i ==> !$IsEqual'$0_memory_BlobRef'(ReadVec(v, j), e))));


function {:inline} $RangeVec'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)): $Range {
    $Range(0, LenVec(v))
}
function {:inline} $EmptyVec'$0_memory_BlobRef'(): Vec ($0_memory_BlobRef) {
    EmptyVec()
}

function {:inline} $1_vector_empty'$0_memory_BlobRef'(): Vec ($0_memory_BlobRef) {
    EmptyVec()
}

function {:inline} $1_vector_is_empty'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)): bool {
    IsEmptyVec(v)
}

function {:inline} $1_vector_push_back'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), val: $0_memory_BlobRef): $Mutation (Vec ($0_memory_BlobRef)) {
    $UpdateMutation(m, ExtendVec($Dereference(m), val))
}

function {:inline} $1_vector_$push_back'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), val: $0_memory_BlobRef): Vec ($0_memory_BlobRef) {
    ExtendVec(v, val)
}

procedure {:inline 1} $1_vector_pop_back'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef))) returns (e: $0_memory_BlobRef, m': $Mutation (Vec ($0_memory_BlobRef))) {
    var v: Vec ($0_memory_BlobRef);
    var len: int;
    v := $Dereference(m);
    len := LenVec(v);
    if (len == 0) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, len-1);
    m' := $UpdateMutation(m, RemoveVec(v));
}

function {:inline} $1_vector_append'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), other: Vec ($0_memory_BlobRef)): $Mutation (Vec ($0_memory_BlobRef)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), other))
}

function {:inline} $1_vector_reverse'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef))): $Mutation (Vec ($0_memory_BlobRef)) {
    $UpdateMutation(m, ReverseVec($Dereference(m)))
}

function {:inline} $1_vector_reverse_append'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), other: Vec ($0_memory_BlobRef)): $Mutation (Vec ($0_memory_BlobRef)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), ReverseVec(other)))
}

procedure {:inline 1} $1_vector_trim_reverse'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), new_len: int) returns (v: (Vec ($0_memory_BlobRef)), m': $Mutation (Vec ($0_memory_BlobRef))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    v := ReverseVec(v);
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_trim'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), new_len: int) returns (v: (Vec ($0_memory_BlobRef)), m': $Mutation (Vec ($0_memory_BlobRef))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_reverse_slice'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), left: int, right: int) returns (m': $Mutation (Vec ($0_memory_BlobRef))) {
    var left_vec: Vec ($0_memory_BlobRef);
    var mid_vec: Vec ($0_memory_BlobRef);
    var right_vec: Vec ($0_memory_BlobRef);
    var v: Vec ($0_memory_BlobRef);
    if (left > right) {
        call $ExecFailureAbort();
        return;
    }
    if (left == right) {
        m' := m;
        return;
    }
    v := $Dereference(m);
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_vec := ReverseVec(SliceVec(v, left, right));
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
}

procedure {:inline 1} $1_vector_rotate'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), rot: int) returns (n: int, m': $Mutation (Vec ($0_memory_BlobRef))) {
    var v: Vec ($0_memory_BlobRef);
    var len: int;
    var left_vec: Vec ($0_memory_BlobRef);
    var right_vec: Vec ($0_memory_BlobRef);
    v := $Dereference(m);
    if (!(rot >= 0 && rot <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, rot);
    right_vec := SliceVec(v, rot, LenVec(v));
    m' := $UpdateMutation(m, ConcatVec(right_vec, left_vec));
    n := LenVec(v) - rot;
}

procedure {:inline 1} $1_vector_rotate_slice'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), left: int, rot: int, right: int) returns (n: int, m': $Mutation (Vec ($0_memory_BlobRef))) {
    var left_vec: Vec ($0_memory_BlobRef);
    var mid_vec: Vec ($0_memory_BlobRef);
    var right_vec: Vec ($0_memory_BlobRef);
    var mid_left_vec: Vec ($0_memory_BlobRef);
    var mid_right_vec: Vec ($0_memory_BlobRef);
    var v: Vec ($0_memory_BlobRef);
    v := $Dereference(m);
    if (!(left <= rot && rot <= right)) {
        call $ExecFailureAbort();
        return;
    }
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    v := $Dereference(m);
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_left_vec := SliceVec(v, left, rot);
    mid_right_vec := SliceVec(v, rot, right);
    mid_vec := ConcatVec(mid_right_vec, mid_left_vec);
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
    n := left + (right - rot);
}

procedure {:inline 1} $1_vector_insert'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), e: $0_memory_BlobRef, i: int) returns (m': $Mutation (Vec ($0_memory_BlobRef))) {
    var left_vec: Vec ($0_memory_BlobRef);
    var right_vec: Vec ($0_memory_BlobRef);
    var v: Vec ($0_memory_BlobRef);
    v := $Dereference(m);
    if (!(i >= 0 && i <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    if (i == LenVec(v)) {
        m' := $UpdateMutation(m, ExtendVec(v, e));
    } else {
        left_vec := ExtendVec(SliceVec(v, 0, i), e);
        right_vec := SliceVec(v, i, LenVec(v));
        m' := $UpdateMutation(m, ConcatVec(left_vec, right_vec));
    }
}

function {:inline} $1_vector_length'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)): int {
    LenVec(v)
}

procedure {:inline 1} $1_vector_borrow'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), i: int) returns (dst: $0_memory_BlobRef) {
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    dst := ReadVec(v, i);
}

function {:inline} $1_vector_borrow'$0_memory_BlobRef'$pure(v: Vec ($0_memory_BlobRef), i: int): $0_memory_BlobRef {
    ReadVec(v, i)
}

procedure {:inline 1} $1_vector_borrow_mut'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), index: int)
returns (dst: $Mutation ($0_memory_BlobRef), m': $Mutation (Vec ($0_memory_BlobRef)))
{
    var v: Vec ($0_memory_BlobRef);
    v := $Dereference(m);
    if (!InRangeVec(v, index)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mutation(m->l, ExtendVec(m->p, index), ReadVec(v, index));
    m' := m;
}

procedure {:inline 1} $1_vector_destroy_empty'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)) {
    if (!IsEmptyVec(v)) {
      call $ExecFailureAbort();
    }
}

procedure {:inline 1} $1_vector_swap'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), i: int, j: int) returns (m': $Mutation (Vec ($0_memory_BlobRef)))
{
    var v: Vec ($0_memory_BlobRef);
    v := $Dereference(m);
    if (!InRangeVec(v, i) || !InRangeVec(v, j)) {
        call $ExecFailureAbort();
        return;
    }
    m' := $UpdateMutation(m, SwapVec(v, i, j));
}

function {:inline} $1_vector_$swap'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), i: int, j: int): Vec ($0_memory_BlobRef) {
    SwapVec(v, i, j)
}

procedure {:inline 1} $1_vector_remove'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), i: int) returns (e: $0_memory_BlobRef, m': $Mutation (Vec ($0_memory_BlobRef)))
{
    var v: Vec ($0_memory_BlobRef);

    v := $Dereference(m);

    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveAtVec(v, i));
}

procedure {:inline 1} $1_vector_swap_remove'$0_memory_BlobRef'(m: $Mutation (Vec ($0_memory_BlobRef)), i: int) returns (e: $0_memory_BlobRef, m': $Mutation (Vec ($0_memory_BlobRef)))
{
    var len: int;
    var v: Vec ($0_memory_BlobRef);

    v := $Dereference(m);
    len := LenVec(v);
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveVec(SwapVec(v, i, len-1)));
}

function {:inline} $1_vector_contains'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef): bool {
    $ContainsVec'$0_memory_BlobRef'(v, e)
}

function {:inline} $1_vector_singleton'$0_memory_BlobRef'(e: $0_memory_BlobRef): Vec ($0_memory_BlobRef) {
    MakeVec1(e)
}

procedure {:inline 1}
$1_vector_index_of'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef) returns (res1: bool, res2: int) {
    res2 := $IndexOfVec'$0_memory_BlobRef'(v, e);
    if (res2 >= 0) {
        res1 := true;
    } else {
        res1 := false;
        res2 := 0;
    }
}

procedure {:inline 1} $1_vector_take'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), n: int) returns (res: Vec ($0_memory_BlobRef)) {
    var len: int;
    len := LenVec(v);
    if (n > len) {
        call $ExecFailureAbort();
        return;
    }
    if (n == len) {
        res := v;
    } else {
        res := SliceVec(v, 0, n);
    }
}

function {:inline} $1_vector_$take'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), n: int): Vec ($0_memory_BlobRef) {
    (if n >= LenVec(v) then v else SliceVec(v, 0, n))
}

procedure {:inline 1} $1_vector_skip'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), n: int) returns (res: Vec ($0_memory_BlobRef)) {
    var len: int;
    len := LenVec(v);
    if (n >= len) {
        res := EmptyVec();
    } else {
        res := SliceVec(v, n, len);
    }
}

function {:inline} $1_vector_$skip'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), n: int): Vec ($0_memory_BlobRef) {
    (if n >= LenVec(v) then EmptyVec() else SliceVec(v, n, LenVec(v)))
}

function {:inline} $0_vector_iter_slice'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), start: int, end: int): Vec ($0_memory_BlobRef) {
    SliceVec(v, start, end)
}

// std::vector::append_pure — functional concatenation.
function {:inline} $1_vector_append_pure'$0_memory_BlobRef'(v1: Vec ($0_memory_BlobRef), v2: Vec ($0_memory_BlobRef)): Vec ($0_memory_BlobRef) {
    ConcatVec(v1, v2)
}

// std::vector::borrow_or_unknown — total borrow. Out-of-range
// returns an uninterpreted (but deterministic) value. Never aborts.
function {:inline} $1_vector_borrow_or_unknown'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), i: int): $0_memory_BlobRef {
    ReadVec(v, i)
}

// std::vector::push_back_pure
function {:inline} $1_vector_push_back_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef): Vec ($0_memory_BlobRef) {
    ExtendVec(v, e)
}

// std::vector::pop_back_pure — drop last; unchanged if empty.
function {:inline} $1_vector_pop_back_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)): Vec ($0_memory_BlobRef) {
    (if LenVec(v) == 0 then v else SliceVec(v, 0, LenVec(v) - 1))
}

// std::vector::push_front_pure
function {:inline} $1_vector_push_front_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef): Vec ($0_memory_BlobRef) {
    InsertAtVec(v, 0, e)
}

// std::vector::pop_front_pure — drop first; unchanged if empty.
function {:inline} $1_vector_pop_front_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef)): Vec ($0_memory_BlobRef) {
    (if LenVec(v) == 0 then v else RemoveAtVec(v, 0))
}

// std::vector::insert_pure — insert at i; unchanged if i > length.
function {:inline} $1_vector_insert_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), e: $0_memory_BlobRef, i: int): Vec ($0_memory_BlobRef) {
    (if i > LenVec(v) then v else InsertAtVec(v, i, e))
}

// std::vector::remove_pure — remove at i; unchanged if i out of range.
function {:inline} $1_vector_remove_pure'$0_memory_BlobRef'(v: Vec ($0_memory_BlobRef), i: int): Vec ($0_memory_BlobRef) {
    (if InRangeVec(v, i) then RemoveAtVec(v, i) else v)
}



// ----------------------------------------------------------------------------------
// Native Vector implementation for element type `address`

// Not inlined. It appears faster this way.
function $IsEqual'vec'address''(v1: Vec (int), v2: Vec (int)): bool {
    LenVec(v1) == LenVec(v2) &&
    (forall i: int:: InRangeVec(v1, i) ==> $IsEqual'address'(ReadVec(v1, i), ReadVec(v2, i)))
}

// Not inlined.
function $IsPrefix'vec'address''(v: Vec (int), prefix: Vec (int)): bool {
    LenVec(v) >= LenVec(prefix) &&
    (forall i: int:: InRangeVec(prefix, i) ==> $IsEqual'address'(ReadVec(v, i), ReadVec(prefix, i)))
}

// Not inlined.
function $IsSuffix'vec'address''(v: Vec (int), suffix: Vec (int)): bool {
    LenVec(v) >= LenVec(suffix) &&
    (forall i: int:: InRangeVec(suffix, i) ==> $IsEqual'address'(ReadVec(v, LenVec(v) - LenVec(suffix) + i), ReadVec(suffix, i)))
}

// Not inlined.
function $IsValid'vec'address''(v: Vec (int)): bool {
    $IsValid'u64'(LenVec(v)) &&
    (forall i: int:: InRangeVec(v, i) ==> $IsValid'address'(ReadVec(v, i)))
}

// Not inlined.
procedure {:inline 1} $0_prover_type_inv'vec'address''(v: Vec (int)) returns (res: bool) {
    res := true;
}


function {:inline} $ContainsVec'address'(v: Vec (int), e: int): bool {
    (exists i: int :: $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'address'(ReadVec(v, i), e))
}

function $IndexOfVec'address'(v: Vec (int), e: int): int;
axiom (forall v: Vec (int), e: int:: {$IndexOfVec'address'(v, e)}
    (var i := $IndexOfVec'address'(v, e);
     if (!$ContainsVec'address'(v, e)) then i == -1
     else $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'address'(ReadVec(v, i), e) &&
        (forall j: int :: $IsValid'u64'(j) && j >= 0 && j < i ==> !$IsEqual'address'(ReadVec(v, j), e))));


function {:inline} $RangeVec'address'(v: Vec (int)): $Range {
    $Range(0, LenVec(v))
}
function {:inline} $EmptyVec'address'(): Vec (int) {
    EmptyVec()
}

function {:inline} $1_vector_empty'address'(): Vec (int) {
    EmptyVec()
}

function {:inline} $1_vector_is_empty'address'(v: Vec (int)): bool {
    IsEmptyVec(v)
}

function {:inline} $1_vector_push_back'address'(m: $Mutation (Vec (int)), val: int): $Mutation (Vec (int)) {
    $UpdateMutation(m, ExtendVec($Dereference(m), val))
}

function {:inline} $1_vector_$push_back'address'(v: Vec (int), val: int): Vec (int) {
    ExtendVec(v, val)
}

procedure {:inline 1} $1_vector_pop_back'address'(m: $Mutation (Vec (int))) returns (e: int, m': $Mutation (Vec (int))) {
    var v: Vec (int);
    var len: int;
    v := $Dereference(m);
    len := LenVec(v);
    if (len == 0) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, len-1);
    m' := $UpdateMutation(m, RemoveVec(v));
}

function {:inline} $1_vector_append'address'(m: $Mutation (Vec (int)), other: Vec (int)): $Mutation (Vec (int)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), other))
}

function {:inline} $1_vector_reverse'address'(m: $Mutation (Vec (int))): $Mutation (Vec (int)) {
    $UpdateMutation(m, ReverseVec($Dereference(m)))
}

function {:inline} $1_vector_reverse_append'address'(m: $Mutation (Vec (int)), other: Vec (int)): $Mutation (Vec (int)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), ReverseVec(other)))
}

procedure {:inline 1} $1_vector_trim_reverse'address'(m: $Mutation (Vec (int)), new_len: int) returns (v: (Vec (int)), m': $Mutation (Vec (int))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    v := ReverseVec(v);
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_trim'address'(m: $Mutation (Vec (int)), new_len: int) returns (v: (Vec (int)), m': $Mutation (Vec (int))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_reverse_slice'address'(m: $Mutation (Vec (int)), left: int, right: int) returns (m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var mid_vec: Vec (int);
    var right_vec: Vec (int);
    var v: Vec (int);
    if (left > right) {
        call $ExecFailureAbort();
        return;
    }
    if (left == right) {
        m' := m;
        return;
    }
    v := $Dereference(m);
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_vec := ReverseVec(SliceVec(v, left, right));
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
}

procedure {:inline 1} $1_vector_rotate'address'(m: $Mutation (Vec (int)), rot: int) returns (n: int, m': $Mutation (Vec (int))) {
    var v: Vec (int);
    var len: int;
    var left_vec: Vec (int);
    var right_vec: Vec (int);
    v := $Dereference(m);
    if (!(rot >= 0 && rot <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, rot);
    right_vec := SliceVec(v, rot, LenVec(v));
    m' := $UpdateMutation(m, ConcatVec(right_vec, left_vec));
    n := LenVec(v) - rot;
}

procedure {:inline 1} $1_vector_rotate_slice'address'(m: $Mutation (Vec (int)), left: int, rot: int, right: int) returns (n: int, m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var mid_vec: Vec (int);
    var right_vec: Vec (int);
    var mid_left_vec: Vec (int);
    var mid_right_vec: Vec (int);
    var v: Vec (int);
    v := $Dereference(m);
    if (!(left <= rot && rot <= right)) {
        call $ExecFailureAbort();
        return;
    }
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    v := $Dereference(m);
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_left_vec := SliceVec(v, left, rot);
    mid_right_vec := SliceVec(v, rot, right);
    mid_vec := ConcatVec(mid_right_vec, mid_left_vec);
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
    n := left + (right - rot);
}

procedure {:inline 1} $1_vector_insert'address'(m: $Mutation (Vec (int)), e: int, i: int) returns (m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var right_vec: Vec (int);
    var v: Vec (int);
    v := $Dereference(m);
    if (!(i >= 0 && i <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    if (i == LenVec(v)) {
        m' := $UpdateMutation(m, ExtendVec(v, e));
    } else {
        left_vec := ExtendVec(SliceVec(v, 0, i), e);
        right_vec := SliceVec(v, i, LenVec(v));
        m' := $UpdateMutation(m, ConcatVec(left_vec, right_vec));
    }
}

function {:inline} $1_vector_length'address'(v: Vec (int)): int {
    LenVec(v)
}

procedure {:inline 1} $1_vector_borrow'address'(v: Vec (int), i: int) returns (dst: int) {
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    dst := ReadVec(v, i);
}

function {:inline} $1_vector_borrow'address'$pure(v: Vec (int), i: int): int {
    ReadVec(v, i)
}

procedure {:inline 1} $1_vector_borrow_mut'address'(m: $Mutation (Vec (int)), index: int)
returns (dst: $Mutation (int), m': $Mutation (Vec (int)))
{
    var v: Vec (int);
    v := $Dereference(m);
    if (!InRangeVec(v, index)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mutation(m->l, ExtendVec(m->p, index), ReadVec(v, index));
    m' := m;
}

procedure {:inline 1} $1_vector_destroy_empty'address'(v: Vec (int)) {
    if (!IsEmptyVec(v)) {
      call $ExecFailureAbort();
    }
}

procedure {:inline 1} $1_vector_swap'address'(m: $Mutation (Vec (int)), i: int, j: int) returns (m': $Mutation (Vec (int)))
{
    var v: Vec (int);
    v := $Dereference(m);
    if (!InRangeVec(v, i) || !InRangeVec(v, j)) {
        call $ExecFailureAbort();
        return;
    }
    m' := $UpdateMutation(m, SwapVec(v, i, j));
}

function {:inline} $1_vector_$swap'address'(v: Vec (int), i: int, j: int): Vec (int) {
    SwapVec(v, i, j)
}

procedure {:inline 1} $1_vector_remove'address'(m: $Mutation (Vec (int)), i: int) returns (e: int, m': $Mutation (Vec (int)))
{
    var v: Vec (int);

    v := $Dereference(m);

    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveAtVec(v, i));
}

procedure {:inline 1} $1_vector_swap_remove'address'(m: $Mutation (Vec (int)), i: int) returns (e: int, m': $Mutation (Vec (int)))
{
    var len: int;
    var v: Vec (int);

    v := $Dereference(m);
    len := LenVec(v);
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveVec(SwapVec(v, i, len-1)));
}

function {:inline} $1_vector_contains'address'(v: Vec (int), e: int): bool {
    $ContainsVec'address'(v, e)
}

function {:inline} $1_vector_singleton'address'(e: int): Vec (int) {
    MakeVec1(e)
}

procedure {:inline 1}
$1_vector_index_of'address'(v: Vec (int), e: int) returns (res1: bool, res2: int) {
    res2 := $IndexOfVec'address'(v, e);
    if (res2 >= 0) {
        res1 := true;
    } else {
        res1 := false;
        res2 := 0;
    }
}

procedure {:inline 1} $1_vector_take'address'(v: Vec (int), n: int) returns (res: Vec (int)) {
    var len: int;
    len := LenVec(v);
    if (n > len) {
        call $ExecFailureAbort();
        return;
    }
    if (n == len) {
        res := v;
    } else {
        res := SliceVec(v, 0, n);
    }
}

function {:inline} $1_vector_$take'address'(v: Vec (int), n: int): Vec (int) {
    (if n >= LenVec(v) then v else SliceVec(v, 0, n))
}

procedure {:inline 1} $1_vector_skip'address'(v: Vec (int), n: int) returns (res: Vec (int)) {
    var len: int;
    len := LenVec(v);
    if (n >= len) {
        res := EmptyVec();
    } else {
        res := SliceVec(v, n, len);
    }
}

function {:inline} $1_vector_$skip'address'(v: Vec (int), n: int): Vec (int) {
    (if n >= LenVec(v) then EmptyVec() else SliceVec(v, n, LenVec(v)))
}

function {:inline} $0_vector_iter_slice'address'(v: Vec (int), start: int, end: int): Vec (int) {
    SliceVec(v, start, end)
}

// std::vector::append_pure — functional concatenation.
function {:inline} $1_vector_append_pure'address'(v1: Vec (int), v2: Vec (int)): Vec (int) {
    ConcatVec(v1, v2)
}

// std::vector::borrow_or_unknown — total borrow. Out-of-range
// returns an uninterpreted (but deterministic) value. Never aborts.
function {:inline} $1_vector_borrow_or_unknown'address'(v: Vec (int), i: int): int {
    ReadVec(v, i)
}

// std::vector::push_back_pure
function {:inline} $1_vector_push_back_pure'address'(v: Vec (int), e: int): Vec (int) {
    ExtendVec(v, e)
}

// std::vector::pop_back_pure — drop last; unchanged if empty.
function {:inline} $1_vector_pop_back_pure'address'(v: Vec (int)): Vec (int) {
    (if LenVec(v) == 0 then v else SliceVec(v, 0, LenVec(v) - 1))
}

// std::vector::push_front_pure
function {:inline} $1_vector_push_front_pure'address'(v: Vec (int), e: int): Vec (int) {
    InsertAtVec(v, 0, e)
}

// std::vector::pop_front_pure — drop first; unchanged if empty.
function {:inline} $1_vector_pop_front_pure'address'(v: Vec (int)): Vec (int) {
    (if LenVec(v) == 0 then v else RemoveAtVec(v, 0))
}

// std::vector::insert_pure — insert at i; unchanged if i > length.
function {:inline} $1_vector_insert_pure'address'(v: Vec (int), e: int, i: int): Vec (int) {
    (if i > LenVec(v) then v else InsertAtVec(v, i, e))
}

// std::vector::remove_pure — remove at i; unchanged if i out of range.
function {:inline} $1_vector_remove_pure'address'(v: Vec (int), i: int): Vec (int) {
    (if InRangeVec(v, i) then RemoveAtVec(v, i) else v)
}



// ----------------------------------------------------------------------------------
// Native Vector implementation for element type `u8`

// Not inlined. It appears faster this way.
function $IsEqual'vec'u8''(v1: Vec (int), v2: Vec (int)): bool {
    LenVec(v1) == LenVec(v2) &&
    (forall i: int:: InRangeVec(v1, i) ==> $IsEqual'u8'(ReadVec(v1, i), ReadVec(v2, i)))
}

// Not inlined.
function $IsPrefix'vec'u8''(v: Vec (int), prefix: Vec (int)): bool {
    LenVec(v) >= LenVec(prefix) &&
    (forall i: int:: InRangeVec(prefix, i) ==> $IsEqual'u8'(ReadVec(v, i), ReadVec(prefix, i)))
}

// Not inlined.
function $IsSuffix'vec'u8''(v: Vec (int), suffix: Vec (int)): bool {
    LenVec(v) >= LenVec(suffix) &&
    (forall i: int:: InRangeVec(suffix, i) ==> $IsEqual'u8'(ReadVec(v, LenVec(v) - LenVec(suffix) + i), ReadVec(suffix, i)))
}

// Not inlined.
function $IsValid'vec'u8''(v: Vec (int)): bool {
    $IsValid'u64'(LenVec(v)) &&
    (forall i: int:: InRangeVec(v, i) ==> $IsValid'u8'(ReadVec(v, i)))
}

// Not inlined.
procedure {:inline 1} $0_prover_type_inv'vec'u8''(v: Vec (int)) returns (res: bool) {
    res := true;
}


function {:inline} $ContainsVec'u8'(v: Vec (int), e: int): bool {
    (exists i: int :: $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'u8'(ReadVec(v, i), e))
}

function $IndexOfVec'u8'(v: Vec (int), e: int): int;
axiom (forall v: Vec (int), e: int:: {$IndexOfVec'u8'(v, e)}
    (var i := $IndexOfVec'u8'(v, e);
     if (!$ContainsVec'u8'(v, e)) then i == -1
     else $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'u8'(ReadVec(v, i), e) &&
        (forall j: int :: $IsValid'u64'(j) && j >= 0 && j < i ==> !$IsEqual'u8'(ReadVec(v, j), e))));


function {:inline} $RangeVec'u8'(v: Vec (int)): $Range {
    $Range(0, LenVec(v))
}
function {:inline} $EmptyVec'u8'(): Vec (int) {
    EmptyVec()
}

function {:inline} $1_vector_empty'u8'(): Vec (int) {
    EmptyVec()
}

function {:inline} $1_vector_is_empty'u8'(v: Vec (int)): bool {
    IsEmptyVec(v)
}

function {:inline} $1_vector_push_back'u8'(m: $Mutation (Vec (int)), val: int): $Mutation (Vec (int)) {
    $UpdateMutation(m, ExtendVec($Dereference(m), val))
}

function {:inline} $1_vector_$push_back'u8'(v: Vec (int), val: int): Vec (int) {
    ExtendVec(v, val)
}

procedure {:inline 1} $1_vector_pop_back'u8'(m: $Mutation (Vec (int))) returns (e: int, m': $Mutation (Vec (int))) {
    var v: Vec (int);
    var len: int;
    v := $Dereference(m);
    len := LenVec(v);
    if (len == 0) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, len-1);
    m' := $UpdateMutation(m, RemoveVec(v));
}

function {:inline} $1_vector_append'u8'(m: $Mutation (Vec (int)), other: Vec (int)): $Mutation (Vec (int)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), other))
}

function {:inline} $1_vector_reverse'u8'(m: $Mutation (Vec (int))): $Mutation (Vec (int)) {
    $UpdateMutation(m, ReverseVec($Dereference(m)))
}

function {:inline} $1_vector_reverse_append'u8'(m: $Mutation (Vec (int)), other: Vec (int)): $Mutation (Vec (int)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), ReverseVec(other)))
}

procedure {:inline 1} $1_vector_trim_reverse'u8'(m: $Mutation (Vec (int)), new_len: int) returns (v: (Vec (int)), m': $Mutation (Vec (int))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    v := ReverseVec(v);
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_trim'u8'(m: $Mutation (Vec (int)), new_len: int) returns (v: (Vec (int)), m': $Mutation (Vec (int))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_reverse_slice'u8'(m: $Mutation (Vec (int)), left: int, right: int) returns (m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var mid_vec: Vec (int);
    var right_vec: Vec (int);
    var v: Vec (int);
    if (left > right) {
        call $ExecFailureAbort();
        return;
    }
    if (left == right) {
        m' := m;
        return;
    }
    v := $Dereference(m);
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_vec := ReverseVec(SliceVec(v, left, right));
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
}

procedure {:inline 1} $1_vector_rotate'u8'(m: $Mutation (Vec (int)), rot: int) returns (n: int, m': $Mutation (Vec (int))) {
    var v: Vec (int);
    var len: int;
    var left_vec: Vec (int);
    var right_vec: Vec (int);
    v := $Dereference(m);
    if (!(rot >= 0 && rot <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, rot);
    right_vec := SliceVec(v, rot, LenVec(v));
    m' := $UpdateMutation(m, ConcatVec(right_vec, left_vec));
    n := LenVec(v) - rot;
}

procedure {:inline 1} $1_vector_rotate_slice'u8'(m: $Mutation (Vec (int)), left: int, rot: int, right: int) returns (n: int, m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var mid_vec: Vec (int);
    var right_vec: Vec (int);
    var mid_left_vec: Vec (int);
    var mid_right_vec: Vec (int);
    var v: Vec (int);
    v := $Dereference(m);
    if (!(left <= rot && rot <= right)) {
        call $ExecFailureAbort();
        return;
    }
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    v := $Dereference(m);
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_left_vec := SliceVec(v, left, rot);
    mid_right_vec := SliceVec(v, rot, right);
    mid_vec := ConcatVec(mid_right_vec, mid_left_vec);
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
    n := left + (right - rot);
}

procedure {:inline 1} $1_vector_insert'u8'(m: $Mutation (Vec (int)), e: int, i: int) returns (m': $Mutation (Vec (int))) {
    var left_vec: Vec (int);
    var right_vec: Vec (int);
    var v: Vec (int);
    v := $Dereference(m);
    if (!(i >= 0 && i <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    if (i == LenVec(v)) {
        m' := $UpdateMutation(m, ExtendVec(v, e));
    } else {
        left_vec := ExtendVec(SliceVec(v, 0, i), e);
        right_vec := SliceVec(v, i, LenVec(v));
        m' := $UpdateMutation(m, ConcatVec(left_vec, right_vec));
    }
}

function {:inline} $1_vector_length'u8'(v: Vec (int)): int {
    LenVec(v)
}

procedure {:inline 1} $1_vector_borrow'u8'(v: Vec (int), i: int) returns (dst: int) {
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    dst := ReadVec(v, i);
}

function {:inline} $1_vector_borrow'u8'$pure(v: Vec (int), i: int): int {
    ReadVec(v, i)
}

procedure {:inline 1} $1_vector_borrow_mut'u8'(m: $Mutation (Vec (int)), index: int)
returns (dst: $Mutation (int), m': $Mutation (Vec (int)))
{
    var v: Vec (int);
    v := $Dereference(m);
    if (!InRangeVec(v, index)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mutation(m->l, ExtendVec(m->p, index), ReadVec(v, index));
    m' := m;
}

procedure {:inline 1} $1_vector_destroy_empty'u8'(v: Vec (int)) {
    if (!IsEmptyVec(v)) {
      call $ExecFailureAbort();
    }
}

procedure {:inline 1} $1_vector_swap'u8'(m: $Mutation (Vec (int)), i: int, j: int) returns (m': $Mutation (Vec (int)))
{
    var v: Vec (int);
    v := $Dereference(m);
    if (!InRangeVec(v, i) || !InRangeVec(v, j)) {
        call $ExecFailureAbort();
        return;
    }
    m' := $UpdateMutation(m, SwapVec(v, i, j));
}

function {:inline} $1_vector_$swap'u8'(v: Vec (int), i: int, j: int): Vec (int) {
    SwapVec(v, i, j)
}

procedure {:inline 1} $1_vector_remove'u8'(m: $Mutation (Vec (int)), i: int) returns (e: int, m': $Mutation (Vec (int)))
{
    var v: Vec (int);

    v := $Dereference(m);

    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveAtVec(v, i));
}

procedure {:inline 1} $1_vector_swap_remove'u8'(m: $Mutation (Vec (int)), i: int) returns (e: int, m': $Mutation (Vec (int)))
{
    var len: int;
    var v: Vec (int);

    v := $Dereference(m);
    len := LenVec(v);
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveVec(SwapVec(v, i, len-1)));
}

function {:inline} $1_vector_contains'u8'(v: Vec (int), e: int): bool {
    $ContainsVec'u8'(v, e)
}

function {:inline} $1_vector_singleton'u8'(e: int): Vec (int) {
    MakeVec1(e)
}

procedure {:inline 1}
$1_vector_index_of'u8'(v: Vec (int), e: int) returns (res1: bool, res2: int) {
    res2 := $IndexOfVec'u8'(v, e);
    if (res2 >= 0) {
        res1 := true;
    } else {
        res1 := false;
        res2 := 0;
    }
}

procedure {:inline 1} $1_vector_take'u8'(v: Vec (int), n: int) returns (res: Vec (int)) {
    var len: int;
    len := LenVec(v);
    if (n > len) {
        call $ExecFailureAbort();
        return;
    }
    if (n == len) {
        res := v;
    } else {
        res := SliceVec(v, 0, n);
    }
}

function {:inline} $1_vector_$take'u8'(v: Vec (int), n: int): Vec (int) {
    (if n >= LenVec(v) then v else SliceVec(v, 0, n))
}

procedure {:inline 1} $1_vector_skip'u8'(v: Vec (int), n: int) returns (res: Vec (int)) {
    var len: int;
    len := LenVec(v);
    if (n >= len) {
        res := EmptyVec();
    } else {
        res := SliceVec(v, n, len);
    }
}

function {:inline} $1_vector_$skip'u8'(v: Vec (int), n: int): Vec (int) {
    (if n >= LenVec(v) then EmptyVec() else SliceVec(v, n, LenVec(v)))
}

function {:inline} $0_vector_iter_slice'u8'(v: Vec (int), start: int, end: int): Vec (int) {
    SliceVec(v, start, end)
}

// std::vector::append_pure — functional concatenation.
function {:inline} $1_vector_append_pure'u8'(v1: Vec (int), v2: Vec (int)): Vec (int) {
    ConcatVec(v1, v2)
}

// std::vector::borrow_or_unknown — total borrow. Out-of-range
// returns an uninterpreted (but deterministic) value. Never aborts.
function {:inline} $1_vector_borrow_or_unknown'u8'(v: Vec (int), i: int): int {
    ReadVec(v, i)
}

// std::vector::push_back_pure
function {:inline} $1_vector_push_back_pure'u8'(v: Vec (int), e: int): Vec (int) {
    ExtendVec(v, e)
}

// std::vector::pop_back_pure — drop last; unchanged if empty.
function {:inline} $1_vector_pop_back_pure'u8'(v: Vec (int)): Vec (int) {
    (if LenVec(v) == 0 then v else SliceVec(v, 0, LenVec(v) - 1))
}

// std::vector::push_front_pure
function {:inline} $1_vector_push_front_pure'u8'(v: Vec (int), e: int): Vec (int) {
    InsertAtVec(v, 0, e)
}

// std::vector::pop_front_pure — drop first; unchanged if empty.
function {:inline} $1_vector_pop_front_pure'u8'(v: Vec (int)): Vec (int) {
    (if LenVec(v) == 0 then v else RemoveAtVec(v, 0))
}

// std::vector::insert_pure — insert at i; unchanged if i > length.
function {:inline} $1_vector_insert_pure'u8'(v: Vec (int), e: int, i: int): Vec (int) {
    (if i > LenVec(v) then v else InsertAtVec(v, i, e))
}

// std::vector::remove_pure — remove at i; unchanged if i out of range.
function {:inline} $1_vector_remove_pure'u8'(v: Vec (int), i: int): Vec (int) {
    (if InRangeVec(v, i) then RemoveAtVec(v, i) else v)
}



// ----------------------------------------------------------------------------------
// Native Vector implementation for element type `bv8`

// Not inlined. It appears faster this way.
function $IsEqual'vec'bv8''(v1: Vec (bv8), v2: Vec (bv8)): bool {
    LenVec(v1) == LenVec(v2) &&
    (forall i: int:: InRangeVec(v1, i) ==> $IsEqual'bv8'(ReadVec(v1, i), ReadVec(v2, i)))
}

// Not inlined.
function $IsPrefix'vec'bv8''(v: Vec (bv8), prefix: Vec (bv8)): bool {
    LenVec(v) >= LenVec(prefix) &&
    (forall i: int:: InRangeVec(prefix, i) ==> $IsEqual'bv8'(ReadVec(v, i), ReadVec(prefix, i)))
}

// Not inlined.
function $IsSuffix'vec'bv8''(v: Vec (bv8), suffix: Vec (bv8)): bool {
    LenVec(v) >= LenVec(suffix) &&
    (forall i: int:: InRangeVec(suffix, i) ==> $IsEqual'bv8'(ReadVec(v, LenVec(v) - LenVec(suffix) + i), ReadVec(suffix, i)))
}

// Not inlined.
function $IsValid'vec'bv8''(v: Vec (bv8)): bool {
    $IsValid'u64'(LenVec(v)) &&
    (forall i: int:: InRangeVec(v, i) ==> $IsValid'bv8'(ReadVec(v, i)))
}

// Not inlined.
procedure {:inline 1} $0_prover_type_inv'vec'bv8''(v: Vec (bv8)) returns (res: bool) {
    res := true;
}


function {:inline} $ContainsVec'bv8'(v: Vec (bv8), e: bv8): bool {
    (exists i: int :: $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'bv8'(ReadVec(v, i), e))
}

function $IndexOfVec'bv8'(v: Vec (bv8), e: bv8): int;
axiom (forall v: Vec (bv8), e: bv8:: {$IndexOfVec'bv8'(v, e)}
    (var i := $IndexOfVec'bv8'(v, e);
     if (!$ContainsVec'bv8'(v, e)) then i == -1
     else $IsValid'u64'(i) && InRangeVec(v, i) && $IsEqual'bv8'(ReadVec(v, i), e) &&
        (forall j: int :: $IsValid'u64'(j) && j >= 0 && j < i ==> !$IsEqual'bv8'(ReadVec(v, j), e))));


function {:inline} $RangeVec'bv8'(v: Vec (bv8)): $Range {
    $Range(0, LenVec(v))
}
function {:inline} $EmptyVec'bv8'(): Vec (bv8) {
    EmptyVec()
}

function {:inline} $1_vector_empty'bv8'(): Vec (bv8) {
    EmptyVec()
}

function {:inline} $1_vector_is_empty'bv8'(v: Vec (bv8)): bool {
    IsEmptyVec(v)
}

function {:inline} $1_vector_push_back'bv8'(m: $Mutation (Vec (bv8)), val: bv8): $Mutation (Vec (bv8)) {
    $UpdateMutation(m, ExtendVec($Dereference(m), val))
}

function {:inline} $1_vector_$push_back'bv8'(v: Vec (bv8), val: bv8): Vec (bv8) {
    ExtendVec(v, val)
}

procedure {:inline 1} $1_vector_pop_back'bv8'(m: $Mutation (Vec (bv8))) returns (e: bv8, m': $Mutation (Vec (bv8))) {
    var v: Vec (bv8);
    var len: int;
    v := $Dereference(m);
    len := LenVec(v);
    if (len == 0) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, len-1);
    m' := $UpdateMutation(m, RemoveVec(v));
}

function {:inline} $1_vector_append'bv8'(m: $Mutation (Vec (bv8)), other: Vec (bv8)): $Mutation (Vec (bv8)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), other))
}

function {:inline} $1_vector_reverse'bv8'(m: $Mutation (Vec (bv8))): $Mutation (Vec (bv8)) {
    $UpdateMutation(m, ReverseVec($Dereference(m)))
}

function {:inline} $1_vector_reverse_append'bv8'(m: $Mutation (Vec (bv8)), other: Vec (bv8)): $Mutation (Vec (bv8)) {
    $UpdateMutation(m, ConcatVec($Dereference(m), ReverseVec(other)))
}

procedure {:inline 1} $1_vector_trim_reverse'bv8'(m: $Mutation (Vec (bv8)), new_len: int) returns (v: (Vec (bv8)), m': $Mutation (Vec (bv8))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    v := ReverseVec(v);
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_trim'bv8'(m: $Mutation (Vec (bv8)), new_len: int) returns (v: (Vec (bv8)), m': $Mutation (Vec (bv8))) {
    var len: int;
    v := $Dereference(m);
    if (LenVec(v) < new_len) {
        call $ExecFailureAbort();
        return;
    }
    v := SliceVec(v, new_len, LenVec(v));
    m' := $UpdateMutation(m, SliceVec($Dereference(m), 0, new_len));
}

procedure {:inline 1} $1_vector_reverse_slice'bv8'(m: $Mutation (Vec (bv8)), left: int, right: int) returns (m': $Mutation (Vec (bv8))) {
    var left_vec: Vec (bv8);
    var mid_vec: Vec (bv8);
    var right_vec: Vec (bv8);
    var v: Vec (bv8);
    if (left > right) {
        call $ExecFailureAbort();
        return;
    }
    if (left == right) {
        m' := m;
        return;
    }
    v := $Dereference(m);
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_vec := ReverseVec(SliceVec(v, left, right));
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
}

procedure {:inline 1} $1_vector_rotate'bv8'(m: $Mutation (Vec (bv8)), rot: int) returns (n: int, m': $Mutation (Vec (bv8))) {
    var v: Vec (bv8);
    var len: int;
    var left_vec: Vec (bv8);
    var right_vec: Vec (bv8);
    v := $Dereference(m);
    if (!(rot >= 0 && rot <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    left_vec := SliceVec(v, 0, rot);
    right_vec := SliceVec(v, rot, LenVec(v));
    m' := $UpdateMutation(m, ConcatVec(right_vec, left_vec));
    n := LenVec(v) - rot;
}

procedure {:inline 1} $1_vector_rotate_slice'bv8'(m: $Mutation (Vec (bv8)), left: int, rot: int, right: int) returns (n: int, m': $Mutation (Vec (bv8))) {
    var left_vec: Vec (bv8);
    var mid_vec: Vec (bv8);
    var right_vec: Vec (bv8);
    var mid_left_vec: Vec (bv8);
    var mid_right_vec: Vec (bv8);
    var v: Vec (bv8);
    v := $Dereference(m);
    if (!(left <= rot && rot <= right)) {
        call $ExecFailureAbort();
        return;
    }
    if (!(right >= 0 && right <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    v := $Dereference(m);
    left_vec := SliceVec(v, 0, left);
    right_vec := SliceVec(v, right, LenVec(v));
    mid_left_vec := SliceVec(v, left, rot);
    mid_right_vec := SliceVec(v, rot, right);
    mid_vec := ConcatVec(mid_right_vec, mid_left_vec);
    m' := $UpdateMutation(m, ConcatVec(left_vec, ConcatVec(mid_vec, right_vec)));
    n := left + (right - rot);
}

procedure {:inline 1} $1_vector_insert'bv8'(m: $Mutation (Vec (bv8)), e: bv8, i: int) returns (m': $Mutation (Vec (bv8))) {
    var left_vec: Vec (bv8);
    var right_vec: Vec (bv8);
    var v: Vec (bv8);
    v := $Dereference(m);
    if (!(i >= 0 && i <= LenVec(v))) {
        call $ExecFailureAbort();
        return;
    }
    if (i == LenVec(v)) {
        m' := $UpdateMutation(m, ExtendVec(v, e));
    } else {
        left_vec := ExtendVec(SliceVec(v, 0, i), e);
        right_vec := SliceVec(v, i, LenVec(v));
        m' := $UpdateMutation(m, ConcatVec(left_vec, right_vec));
    }
}

function {:inline} $1_vector_length'bv8'(v: Vec (bv8)): int {
    LenVec(v)
}

procedure {:inline 1} $1_vector_borrow'bv8'(v: Vec (bv8), i: int) returns (dst: bv8) {
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    dst := ReadVec(v, i);
}

function {:inline} $1_vector_borrow'bv8'$pure(v: Vec (bv8), i: int): bv8 {
    ReadVec(v, i)
}

procedure {:inline 1} $1_vector_borrow_mut'bv8'(m: $Mutation (Vec (bv8)), index: int)
returns (dst: $Mutation (bv8), m': $Mutation (Vec (bv8)))
{
    var v: Vec (bv8);
    v := $Dereference(m);
    if (!InRangeVec(v, index)) {
        call $ExecFailureAbort();
        return;
    }
    dst := $Mutation(m->l, ExtendVec(m->p, index), ReadVec(v, index));
    m' := m;
}

procedure {:inline 1} $1_vector_destroy_empty'bv8'(v: Vec (bv8)) {
    if (!IsEmptyVec(v)) {
      call $ExecFailureAbort();
    }
}

procedure {:inline 1} $1_vector_swap'bv8'(m: $Mutation (Vec (bv8)), i: int, j: int) returns (m': $Mutation (Vec (bv8)))
{
    var v: Vec (bv8);
    v := $Dereference(m);
    if (!InRangeVec(v, i) || !InRangeVec(v, j)) {
        call $ExecFailureAbort();
        return;
    }
    m' := $UpdateMutation(m, SwapVec(v, i, j));
}

function {:inline} $1_vector_$swap'bv8'(v: Vec (bv8), i: int, j: int): Vec (bv8) {
    SwapVec(v, i, j)
}

procedure {:inline 1} $1_vector_remove'bv8'(m: $Mutation (Vec (bv8)), i: int) returns (e: bv8, m': $Mutation (Vec (bv8)))
{
    var v: Vec (bv8);

    v := $Dereference(m);

    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveAtVec(v, i));
}

procedure {:inline 1} $1_vector_swap_remove'bv8'(m: $Mutation (Vec (bv8)), i: int) returns (e: bv8, m': $Mutation (Vec (bv8)))
{
    var len: int;
    var v: Vec (bv8);

    v := $Dereference(m);
    len := LenVec(v);
    if (!InRangeVec(v, i)) {
        call $ExecFailureAbort();
        return;
    }
    e := ReadVec(v, i);
    m' := $UpdateMutation(m, RemoveVec(SwapVec(v, i, len-1)));
}

function {:inline} $1_vector_contains'bv8'(v: Vec (bv8), e: bv8): bool {
    $ContainsVec'bv8'(v, e)
}

function {:inline} $1_vector_singleton'bv8'(e: bv8): Vec (bv8) {
    MakeVec1(e)
}

procedure {:inline 1}
$1_vector_index_of'bv8'(v: Vec (bv8), e: bv8) returns (res1: bool, res2: int) {
    res2 := $IndexOfVec'bv8'(v, e);
    if (res2 >= 0) {
        res1 := true;
    } else {
        res1 := false;
        res2 := 0;
    }
}

procedure {:inline 1} $1_vector_take'bv8'(v: Vec (bv8), n: int) returns (res: Vec (bv8)) {
    var len: int;
    len := LenVec(v);
    if (n > len) {
        call $ExecFailureAbort();
        return;
    }
    if (n == len) {
        res := v;
    } else {
        res := SliceVec(v, 0, n);
    }
}

function {:inline} $1_vector_$take'bv8'(v: Vec (bv8), n: int): Vec (bv8) {
    (if n >= LenVec(v) then v else SliceVec(v, 0, n))
}

procedure {:inline 1} $1_vector_skip'bv8'(v: Vec (bv8), n: int) returns (res: Vec (bv8)) {
    var len: int;
    len := LenVec(v);
    if (n >= len) {
        res := EmptyVec();
    } else {
        res := SliceVec(v, n, len);
    }
}

function {:inline} $1_vector_$skip'bv8'(v: Vec (bv8), n: int): Vec (bv8) {
    (if n >= LenVec(v) then EmptyVec() else SliceVec(v, n, LenVec(v)))
}

function {:inline} $0_vector_iter_slice'bv8'(v: Vec (bv8), start: int, end: int): Vec (bv8) {
    SliceVec(v, start, end)
}

// std::vector::append_pure — functional concatenation.
function {:inline} $1_vector_append_pure'bv8'(v1: Vec (bv8), v2: Vec (bv8)): Vec (bv8) {
    ConcatVec(v1, v2)
}

// std::vector::borrow_or_unknown — total borrow. Out-of-range
// returns an uninterpreted (but deterministic) value. Never aborts.
function {:inline} $1_vector_borrow_or_unknown'bv8'(v: Vec (bv8), i: int): bv8 {
    ReadVec(v, i)
}

// std::vector::push_back_pure
function {:inline} $1_vector_push_back_pure'bv8'(v: Vec (bv8), e: bv8): Vec (bv8) {
    ExtendVec(v, e)
}

// std::vector::pop_back_pure — drop last; unchanged if empty.
function {:inline} $1_vector_pop_back_pure'bv8'(v: Vec (bv8)): Vec (bv8) {
    (if LenVec(v) == 0 then v else SliceVec(v, 0, LenVec(v) - 1))
}

// std::vector::push_front_pure
function {:inline} $1_vector_push_front_pure'bv8'(v: Vec (bv8), e: bv8): Vec (bv8) {
    InsertAtVec(v, 0, e)
}

// std::vector::pop_front_pure — drop first; unchanged if empty.
function {:inline} $1_vector_pop_front_pure'bv8'(v: Vec (bv8)): Vec (bv8) {
    (if LenVec(v) == 0 then v else RemoveAtVec(v, 0))
}

// std::vector::insert_pure — insert at i; unchanged if i > length.
function {:inline} $1_vector_insert_pure'bv8'(v: Vec (bv8), e: bv8, i: int): Vec (bv8) {
    (if i > LenVec(v) then v else InsertAtVec(v, i, e))
}

// std::vector::remove_pure — remove at i; unchanged if i out of range.
function {:inline} $1_vector_remove_pure'bv8'(v: Vec (bv8), i: int): Vec (bv8) {
    (if InRangeVec(v, i) then RemoveAtVec(v, i) else v)
}



// ==================================================================================
// Native VecSet

// ==================================================================================
// Native TableVec

// ==================================================================================
// Native VecMap

// ==================================================================================
// Native Table

// ==================================================================================
// Native Hash

// Hash is modeled as an otherwise uninterpreted injection.
// In truth, it is not an injection since the domain has greater cardinality
// (arbitrary length vectors) than the co-domain (vectors of length 32).  But it is
// common to assume in code there are no hash collisions in practice.  Fortunately,
// Boogie is not smart enough to recognized that there is an inconsistency.
// FIXME: If we were using a reliable extensional theory of arrays, and if we could use ==
// instead of $IsEqual, we might be able to avoid so many quantified formulas by
// using a sha2_inverse function in the ensures conditions of Hash_sha2_256 to
// assert that sha2/3 are injections without using global quantified axioms.


function $1_hash_sha2(val: Vec int): Vec int;

// This says that Hash_sha2 is bijective.
axiom (forall v1,v2: Vec int :: {$1_hash_sha2(v1), $1_hash_sha2(v2)}
       $IsEqual'vec'u8''(v1, v2) <==> $IsEqual'vec'u8''($1_hash_sha2(v1), $1_hash_sha2(v2)));

procedure $1_hash_sha2_256(val: Vec int) returns (res: Vec int);
ensures res == $1_hash_sha2(val);     // returns Hash_sha2 Value
ensures $IsValid'vec'u8''(res);    // result is a legal vector of U8s.
ensures LenVec(res) == 32;               // result is 32 bytes.

// Spec version of Move native function.
function {:inline} $1_hash_$sha2_256(val: Vec int): Vec int {
    $1_hash_sha2(val)
}

// similarly for Hash_sha3
function $1_hash_sha3(val: Vec int): Vec int;

axiom (forall v1,v2: Vec int :: {$1_hash_sha3(v1), $1_hash_sha3(v2)}
       $IsEqual'vec'u8''(v1, v2) <==> $IsEqual'vec'u8''($1_hash_sha3(v1), $1_hash_sha3(v2)));

procedure $1_hash_sha3_256(val: Vec int) returns (res: Vec int);
ensures res == $1_hash_sha3(val);     // returns Hash_sha3 Value
ensures $IsValid'vec'u8''(res);    // result is a legal vector of U8s.
ensures LenVec(res) == 32;               // result is 32 bytes.

// Spec version of Move native function.
function {:inline} $1_hash_$sha3_256(val: Vec int): Vec int {
    $1_hash_sha3(val)
}

// ==================================================================================
// Native diem_account

procedure {:inline 1} $1_DiemAccount_create_signer(
  addr: int
) returns (signer: $signer) {
    // A signer is currently identical to an address.
    signer := $signer(addr);
}

procedure {:inline 1} $1_DiemAccount_destroy_signer(
  signer: $signer
) {
  return;
}

// ==================================================================================
// Native account

procedure {:inline 1} $1_Account_create_signer(
  addr: int
) returns (signer: $signer) {
    // A signer is currently identical to an address.
    signer := $signer(addr);
}

// ==================================================================================
// Native Signer

datatype $signer {
    $signer($addr: int)
}
function {:inline} $IsValid'signer'(s: $signer): bool {
    $IsValid'address'(s->$addr)
}
function {:inline} $IsEqual'signer'(s1: $signer, s2: $signer): bool {
    s1 == s2
}

procedure {:inline 1} $1_signer_borrow_address(signer: $signer) returns (res: int) {
    res := signer->$addr;
}

function {:inline} $1_signer_$borrow_address(signer: $signer): int
{
    signer->$addr
}

function $1_signer_is_txn_signer(s: $signer): bool;

function $1_signer_is_txn_signer_addr(a: int): bool;


// ==================================================================================
// Native signature

// Signature related functionality is handled via uninterpreted functions. This is sound
// currently because we verify every code path based on signature verification with
// an arbitrary interpretation.

function $1_Signature_$ed25519_validate_pubkey(public_key: Vec int): bool;
function $1_Signature_$ed25519_verify(signature: Vec int, public_key: Vec int, message: Vec int): bool;

// Needed because we do not have extensional equality:
axiom (forall k1, k2: Vec int ::
    {$1_Signature_$ed25519_validate_pubkey(k1), $1_Signature_$ed25519_validate_pubkey(k2)}
    $IsEqual'vec'u8''(k1, k2) ==> $1_Signature_$ed25519_validate_pubkey(k1) == $1_Signature_$ed25519_validate_pubkey(k2));
axiom (forall s1, s2, k1, k2, m1, m2: Vec int ::
    {$1_Signature_$ed25519_verify(s1, k1, m1), $1_Signature_$ed25519_verify(s2, k2, m2)}
    $IsEqual'vec'u8''(s1, s2) && $IsEqual'vec'u8''(k1, k2) && $IsEqual'vec'u8''(m1, m2)
    ==> $1_Signature_$ed25519_verify(s1, k1, m1) == $1_Signature_$ed25519_verify(s2, k2, m2));


procedure {:inline 1} $1_Signature_ed25519_validate_pubkey(public_key: Vec int) returns (res: bool) {
    res := $1_Signature_$ed25519_validate_pubkey(public_key);
}

procedure {:inline 1} $1_Signature_ed25519_verify(
        signature: Vec int, public_key: Vec int, message: Vec int) returns (res: bool) {
    res := $1_Signature_$ed25519_verify(signature, public_key, message);
}


// ==================================================================================
// Native bcs::serialize


// ==================================================================================
// Native Event module



procedure {:inline 1} $InitEventStore() {
}

// ============================================================================================
// Type Reflection on Type Parameters

datatype $TypeParamInfo {
    $TypeParamBool(),
    $TypeParamU8(),
    $TypeParamU16(),
    $TypeParamU32(),
    $TypeParamU64(),
    $TypeParamU128(),
    $TypeParamU256(),
    $TypeParamAddress(),
    $TypeParamSigner(),
    $TypeParamVector(e: $TypeParamInfo),
    $TypeParamStruct(a: int, m: Vec int, s: Vec int)
}



//==================================
// Begin Translation

function $TypeName(t: $TypeParamInfo): Vec int;
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamBool ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 98][1 := 111][2 := 111][3 := 108], 4)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 98][1 := 111][2 := 111][3 := 108], 4)) ==> t is $TypeParamBool);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU8 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 56], 2)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 56], 2)) ==> t is $TypeParamU8);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU16 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 49][2 := 54], 3)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 49][2 := 54], 3)) ==> t is $TypeParamU16);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU32 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 51][2 := 50], 3)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 51][2 := 50], 3)) ==> t is $TypeParamU32);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU64 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 54][2 := 52], 3)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 54][2 := 52], 3)) ==> t is $TypeParamU64);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU128 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 49][2 := 50][3 := 56], 4)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 49][2 := 50][3 := 56], 4)) ==> t is $TypeParamU128);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamU256 ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 50][2 := 53][3 := 54], 4)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 117][1 := 50][2 := 53][3 := 54], 4)) ==> t is $TypeParamU256);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamAddress ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 97][1 := 100][2 := 100][3 := 114][4 := 101][5 := 115][6 := 115], 7)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 97][1 := 100][2 := 100][3 := 114][4 := 101][5 := 115][6 := 115], 7)) ==> t is $TypeParamAddress);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamSigner ==> $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 115][1 := 105][2 := 103][3 := 110][4 := 101][5 := 114], 6)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsEqual'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 115][1 := 105][2 := 103][3 := 110][4 := 101][5 := 114], 6)) ==> t is $TypeParamSigner);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamVector ==> $IsEqual'vec'u8''($TypeName(t), ConcatVec(ConcatVec(Vec(DefaultVecMap()[0 := 118][1 := 101][2 := 99][3 := 116][4 := 111][5 := 114][6 := 60], 7), $TypeName(t->e)), Vec(DefaultVecMap()[0 := 62], 1))));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} ($IsPrefix'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 118][1 := 101][2 := 99][3 := 116][4 := 111][5 := 114][6 := 60], 7)) && $IsSuffix'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 62], 1))) ==> t is $TypeParamVector);
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} t is $TypeParamStruct ==> $IsEqual'vec'u8''($TypeName(t), ConcatVec(ConcatVec(ConcatVec(ConcatVec(ConcatVec(Vec(DefaultVecMap()[0 := 48][1 := 120], 2), MakeVec1(t->a)), Vec(DefaultVecMap()[0 := 58][1 := 58], 2)), t->m), Vec(DefaultVecMap()[0 := 58][1 := 58], 2)), t->s)));
axiom (forall t: $TypeParamInfo :: {$TypeName(t)} $IsPrefix'vec'u8''($TypeName(t), Vec(DefaultVecMap()[0 := 48][1 := 120], 2)) ==> t is $TypeParamVector);


// Given Types for Type Parameters

datatype #0 {
    #0($id: $2_object_UID)
}
function {:inline} $2_object_borrow_uid'#0'(obj: #0): $2_object_UID {
    obj->$id
}
function {:inline} $IsEqual'#0'(x1: #0, x2: #0): bool { x1 == x2 }
function {:inline} $IsValid'#0'(x: #0): bool { true }
procedure {:inline 1} $0_prover_type_inv'#0'(x: #0) returns (res: bool) { res := true; }
var #0_info: $TypeParamInfo;
datatype #1 {
    #1($id: $2_object_UID)
}
function {:inline} $2_object_borrow_uid'#1'(obj: #1): $2_object_UID {
    obj->$id
}
function {:inline} $IsEqual'#1'(x1: #1, x2: #1): bool { x1 == x2 }
function {:inline} $IsValid'#1'(x: #1): bool { true }
procedure {:inline 1} $0_prover_type_inv'#1'(x: #1) returns (res: bool) { res := true; }
var #1_info: $TypeParamInfo;

var $global_var__'#0_#1' : #1 where $IsValid'#1'($global_var__'#0_#1');
// fun ghost::havoc_global<#0, #1> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/ghost.move:29:1+32
procedure {:inline 1} $0_ghost_havoc_global'#0_#1'() returns ()
{
    havoc $global_var__'#0_#1';
}

// struct tx_context::TxContext at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:18:1+474
datatype $2_tx_context_TxContext {
    $2_tx_context_TxContext($sender: int, $tx_hash: Vec (int), $epoch: int, $epoch_timestamp_ms: int, $ids_created: int)
}
function {:inline} $Update'$2_tx_context_TxContext'_sender(s: $2_tx_context_TxContext, x: int): $2_tx_context_TxContext {
    $2_tx_context_TxContext(x, s->$tx_hash, s->$epoch, s->$epoch_timestamp_ms, s->$ids_created)
}
function {:inline} $Update'$2_tx_context_TxContext'_tx_hash(s: $2_tx_context_TxContext, x: Vec (int)): $2_tx_context_TxContext {
    $2_tx_context_TxContext(s->$sender, x, s->$epoch, s->$epoch_timestamp_ms, s->$ids_created)
}
function {:inline} $Update'$2_tx_context_TxContext'_epoch(s: $2_tx_context_TxContext, x: int): $2_tx_context_TxContext {
    $2_tx_context_TxContext(s->$sender, s->$tx_hash, x, s->$epoch_timestamp_ms, s->$ids_created)
}
function {:inline} $Update'$2_tx_context_TxContext'_epoch_timestamp_ms(s: $2_tx_context_TxContext, x: int): $2_tx_context_TxContext {
    $2_tx_context_TxContext(s->$sender, s->$tx_hash, s->$epoch, x, s->$ids_created)
}
function {:inline} $Update'$2_tx_context_TxContext'_ids_created(s: $2_tx_context_TxContext, x: int): $2_tx_context_TxContext {
    $2_tx_context_TxContext(s->$sender, s->$tx_hash, s->$epoch, s->$epoch_timestamp_ms, x)
}
function $IsValid'$2_tx_context_TxContext'(s: $2_tx_context_TxContext): bool {
    $IsValid'address'(s->$sender)
      && $IsValid'vec'u8''(s->$tx_hash)
      && $IsValid'u64'(s->$epoch)
      && $IsValid'u64'(s->$epoch_timestamp_ms)
      && $IsValid'u64'(s->$ids_created)
}
function {:inline} $IsEqual'$2_tx_context_TxContext'(s1: $2_tx_context_TxContext, s2: $2_tx_context_TxContext): bool {
    $IsEqual'address'(s1->$sender, s2->$sender)
    && $IsEqual'vec'u8''(s1->$tx_hash, s2->$tx_hash)
    && $IsEqual'u64'(s1->$epoch, s2->$epoch)
    && $IsEqual'u64'(s1->$epoch_timestamp_ms, s2->$epoch_timestamp_ms)
    && $IsEqual'u64'(s1->$ids_created, s2->$ids_created)}
procedure {:inline 1} $0_prover_type_inv'$2_tx_context_TxContext'(s: $2_tx_context_TxContext) returns (res: bool) {
    res := true;
    return;
}

// fun tx_context::sender [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:35:1+69
function {:inline} $2_tx_context_sender$pure(_$t0: $2_tx_context_TxContext) returns ($ret0: int)
{
    (var $t1 := $2_tx_context_native_sender();
    $t1)
}

// fun tx_context::sender [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:35:1+69
procedure {:inline 1} $2_tx_context_sender(_$t0: $2_tx_context_TxContext) returns ($ret0: int)
{
    // declare local variables
    var $t1: int;
    var $t0: $2_tx_context_TxContext;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := tx_context::native_sender() at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:36:5+15
    assume {:print "$at(151,1205,1220)"} true;
    $t1 := $2_tx_context_native_sender();
    assume $IsValid'address'($t1);

    // return $t1 at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:36:5+15
    assume {:print "$at(151,1205,1220)"} true;
    $ret0 := $t1;
    return;

}

// fun tx_context::digest [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:44:1+70
function {:inline} $2_tx_context_digest$pure(_$t0: $2_tx_context_TxContext) returns ($ret0: Vec (int))
{
    (var $t1 := _$t0->$tx_hash;
    $t1)
}

// fun tx_context::digest [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:44:1+70
procedure {:inline 1} $2_tx_context_digest(_$t0: $2_tx_context_TxContext) returns ($ret0: Vec (int))
{
    // declare local variables
    var $t1: Vec (int);
    var $t0: $2_tx_context_TxContext;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := get_field<tx_context::TxContext>.tx_hash($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:45:5+13
    assume {:print "$at(151,1455,1468)"} true;
    $t1 := $t0->$tx_hash;

    // return $t1 at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/tx_context.move:45:5+13
    $ret0 := $t1;
    return;

}

// struct string::String at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/move-stdlib/sources/string.move:18:1+69
datatype $1_string_String {
    $1_string_String($content: int)
}
function {:inline} $IsValid'$1_string_String'(s: $1_string_String): bool {
    true
}
function {:inline} $IsEqual'$1_string_String'(s1: $1_string_String, s2: $1_string_String): bool {
    s1 == s2
}
procedure {:inline 1} $0_prover_type_inv'$1_string_String'(s: $1_string_String) returns (res: bool) {
    res := true;
    return;
}

// struct object::ID at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:67:1+390
datatype $2_object_ID {
    $2_object_ID($bytes: int)
}
function {:inline} $Update'$2_object_ID'_bytes(s: $2_object_ID, x: int): $2_object_ID {
    $2_object_ID(x)
}
function $IsValid'$2_object_ID'(s: $2_object_ID): bool {
    $IsValid'address'(s->$bytes)
}
function {:inline} $IsEqual'$2_object_ID'(s1: $2_object_ID, s2: $2_object_ID): bool {
    s1 == s2
}
procedure {:inline 1} $0_prover_type_inv'$2_object_ID'(s: $2_object_ID) returns (res: bool) {
    res := true;
    return;
}

// struct object::UID at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:81:1+43
datatype $2_object_UID {
    $2_object_UID($id: $2_object_ID)
}
function {:inline} $Update'$2_object_UID'_id(s: $2_object_UID, x: $2_object_ID): $2_object_UID {
    $2_object_UID(x)
}
function $IsValid'$2_object_UID'(s: $2_object_UID): bool {
    $IsValid'$2_object_ID'(s->$id)
}
function {:inline} $IsEqual'$2_object_UID'(s1: $2_object_UID, s2: $2_object_UID): bool {
    s1 == s2
}
procedure {:inline 1} $0_prover_type_inv'$2_object_UID'(s: $2_object_UID) returns (res: bool) {
    res := true;
    return;
}

// fun object::new [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:233:1+114
procedure {:inline 1} $2_object_new(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: $2_object_UID, $ret1: $Mutation ($2_tx_context_TxContext))
{
    // declare local variables
    var $t1: int;
    var $t2: $2_object_ID;
    var $t3: $2_object_UID;
    var $t0: $Mutation ($2_tx_context_TxContext);
    var $temp_0'$2_object_UID': $2_object_UID;
    var $temp_0'$2_tx_context_TxContext': $2_tx_context_TxContext;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[ctx]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:233:1+1
    assume {:print "$at(132,7118,7119)"} true;
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(75,21,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // $t1 := tx_context::fresh_object_address($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:235:25+26
    assume {:print "$at(132,7195,7221)"} true;
    call $t1,$t0 := $2_tx_context_fresh_object_address($t0);

    // $t2 := pack object::ID($t1) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:235:13+40
    assume {:print "$at(132,7183,7223)"} true;
    $t2 := $2_object_ID($t1);

    // $t3 := pack object::UID($t2) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:234:5+65
    assume {:print "$at(132,7165,7230)"} true;
    $t3 := $2_object_UID($t2);

    // trace_return[0]($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:234:5+65
    assume {:print "$track_return(75,21,0,$2_object_UID):", $t3} $t3 == $t3;

    // trace_local[ctx]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:234:5+65
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(75,21,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // return $t3 at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:234:5+65
    $ret0 := $t3;
    $ret1 := $t0;
    return;

}

// fun object::id<memory::Memory> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:251:1+61
function {:inline} $2_object_id'$0_memory_Memory'$pure(_$t0: $0_memory_Memory) returns ($ret0: $2_object_ID)
{
    (var $t1 := $2_object_borrow_uid'$0_memory_Memory'(_$t0);
    (var $t2 := $t1->$id;
    $t2))
}

// fun object::id<memory::Memory> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:251:1+61
procedure {:inline 1} $2_object_id'$0_memory_Memory'(_$t0: $0_memory_Memory) returns ($ret0: $2_object_ID)
{
    // declare local variables
    var $t1: $2_object_UID;
    var $t2: $2_object_ID;
    var $t0: $0_memory_Memory;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := object::borrow_uid<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:252:5+15
    assume {:print "$at(132,7758,7773)"} true;
    $t1 := $2_object_borrow_uid'$0_memory_Memory'($t0);

    // $t2 := get_field<object::UID>.id($t1) at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:252:5+18
    assume {:print "$at(132,7758,7776)"} true;
    $t2 := $t1->$id;

    // return $t2 at /Users/mini/.move/https___github_com_asymptotic-code_sui_git_next/crates/sui-framework/packages/sui-framework/sources/object.move:252:5+18
    $ret0 := $t2;
    return;

}

// fun event_spec::emit_spec<memory::MemoryCreated> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+68
procedure $2_event_emit'$0_memory_MemoryCreated'$opaque(_$t0: $0_memory_MemoryCreated) returns ();

procedure {:inline 1} $2_event_emit'$0_memory_MemoryCreated'(_$t0: $0_memory_MemoryCreated) returns ()
{
    // declare local variables
    var $t1: bool;
    var $t0: $0_memory_MemoryCreated;
    var $temp_0'$0_memory_MemoryCreated': $0_memory_MemoryCreated;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := prover::type_inv<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    $t1 := true;

    // prover::ensures($t1) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    assert {:msg "assert_failed(28,134,135): prover::ensures does not hold"} $t1;

    // trace_local[event]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    assume {:print "$track_local(105,0,0,$0_memory_MemoryCreated):", $t0} $t0 == $t0;

    // event::emit<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:8:5+11
    assume {:print "$at(28,188,199)"} true;
    call $2_event_emit'$0_memory_MemoryCreated'$opaque($t0);

    // return () at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:8:5+11
    assume {:print "$at(28,188,199)"} true;
    return;

}

// fun event_spec::emit_spec<#0> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+68
procedure $2_event_emit'#0'$opaque(_$t0: #0) returns ();

procedure {:inline 1} $2_event_emit'#0'(_$t0: #0) returns ()
{
    // declare local variables
    var $t1: bool;
    var $t0: #0;
    var $temp_0'#0': #0;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := prover::type_inv<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    $t1 := true;

    // prover::ensures($t1) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    assert {:msg "assert_failed(28,134,135): prover::ensures does not hold"} $t1;

    // trace_local[event]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:7:1+1
    assume {:print "$at(28,134,135)"} true;
    assume {:print "$track_local(105,0,0,#0):", $t0} $t0 == $t0;

    // event::emit<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:8:5+11
    assume {:print "$at(28,188,199)"} true;
    call $2_event_emit'#0'$opaque($t0);

    // return () at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/event.move:8:5+11
    assume {:print "$at(28,188,199)"} true;
    return;

}

// fun prover::drop_spec<#0> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:69:1+39
procedure $0_prover_drop'#0'$opaque(_$t0: #0) returns ();

procedure {:inline 1} $0_prover_drop'#0'(_$t0: #0) returns ()
{
    // declare local variables
    var $t1: bool;
    var $t0: #0;
    var $temp_0'#0': #0;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t1 := prover::type_inv<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:69:1+1
    assume {:print "$at(4,1376,1377)"} true;
    $t1 := true;

    // prover::ensures($t1) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:69:1+1
    assume {:print "$at(4,1376,1377)"} true;
    assert {:msg "assert_failed(4,1376,1377): prover::ensures does not hold"} $t1;

    // trace_local[x]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:69:1+1
    assume {:print "$at(4,1376,1377)"} true;
    assume {:print "$track_local(110,15,0,#0):", $t0} $t0 == $t0;

    // prover::drop<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:70:5+7
    assume {:print "$at(4,1405,1412)"} true;
    call $0_prover_drop'#0'$opaque($t0);

    // return () at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:70:12+1
    assume {:print "$at(4,1412,1413)"} true;
    return;

}

// fun prover::ref_spec<#0> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+140
procedure $0_prover_ref'#0'$opaque(_$t0: #0) returns ($ret0: #0);

procedure {:inline 1} $0_prover_ref'#0'(_$t0: #0) returns ($ret0: #0)
{
    // declare local variables
    var $t1: #0;
    var $t2: #0;
    var $t3: bool;
    var $t4: #0;
    var $t5: #0;
    var $t6: bool;
    var $t7: bool;
    var $t0: #0;
    var $temp_0'#0': #0;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t3 := prover::type_inv<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+1
    assume {:print "$at(4,1180,1181)"} true;
    $t3 := true;

    // prover::ensures($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+1
    assume {:print "$at(4,1180,1181)"} true;
    assert {:msg "assert_failed(4,1180,1181): prover::ensures does not hold"} $t3;

    // trace_local[x]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+1
    assume {:print "$at(4,1180,1181)"} true;
    assume {:print "$track_local(110,13,0,#0):", $t0} $t0 == $t0;

    // $t4 := prover::val<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:56:17+7
    assume {:print "$at(4,1224,1231)"} true;
    call $t4 := $0_prover_val'#0'($t0);

    // trace_local[old_x#1#0]($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:56:9+5
    assume {:print "$at(4,1216,1221)"} true;
    assume {:print "$track_local(110,13,1,#0):", $t4} $t4 == $t4;

    // $t5 := prover::ref<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:58:18+6
    assume {:print "$at(4,1251,1257)"} true;
    call $t5 := $0_prover_ref'#0'$opaque($t0);

    // $t5 := havoc[val]() at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+140
    assume {:print "$at(4,1180,1320)"} true;
    havoc $t5;

    // assume WellFormed($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:55:1+140
    assume $IsValid'#0'($t5);

    // trace_local[result#1#0]($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:58:9+6
    assume {:print "$at(4,1242,1248)"} true;
    assume {:print "$track_local(110,13,2,#0):", $t5} $t5 == $t5;

    // $t6 := ==($t5, $t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:60:20+2
    assume {:print "$at(4,1279,1281)"} true;
    $t6 := $IsEqual'#0'($t5, $t4);

    // prover::requires($t6) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:60:5+24
    call $0_prover_requires($t6);

    // prover::drop<#0>($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:61:5+11
    assume {:print "$at(4,1294,1305)"} true;
    call $0_prover_drop'#0'($t4);

    // trace_return[0]($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:63:5+6
    assume {:print "$at(4,1312,1318)"} true;
    assume {:print "$track_return(110,13,0,#0):", $t5} $t5 == $t5;

    // $t7 := prover::type_inv<#0>($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:64:1+1
    assume {:print "$at(4,1319,1320)"} true;
    $t7 := true;

    // prover::requires($t7) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:64:1+1
    assume {:print "$at(4,1319,1320)"} true;
    call $0_prover_requires($t7);

    // return $t5 at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:63:5+6
    assume {:print "$at(4,1312,1318)"} true;
    $ret0 := $t5;
    return;

}

// fun prover::val_spec<#0> [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:44:1+93
function $0_prover_val'#0'$opaque(_$t0: #0) returns ($ret0: #0);

procedure {:inline 1} $0_prover_val'#0'(_$t0: #0) returns ($ret0: #0)
{
    // declare local variables
    var $t1: #0;
    var $t2: bool;
    var $t3: #0;
    var $t4: bool;
    var $t5: bool;
    var $t0: #0;
    var $temp_0'#0': #0;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // $t2 := prover::type_inv<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:44:1+1
    assume {:print "$at(4,1028,1029)"} true;
    $t2 := true;

    // prover::ensures($t2) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:44:1+1
    assume {:print "$at(4,1028,1029)"} true;
    assert {:msg "assert_failed(4,1028,1029): prover::ensures does not hold"} $t2;

    // trace_local[x]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:44:1+1
    assume {:print "$at(4,1028,1029)"} true;
    assume {:print "$track_local(110,11,0,#0):", $t0} $t0 == $t0;

    // $t3 := prover::val<#0>($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:45:18+6
    assume {:print "$at(4,1073,1079)"} true;
    $t3 := $0_prover_val'#0'$opaque($t0);

    // assume WellFormed($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:44:1+93
    assume {:print "$at(4,1028,1121)"} true;
    assume $IsValid'#0'($t3);

    // trace_local[result#1#0]($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:45:9+6
    assume {:print "$at(4,1064,1070)"} true;
    assume {:print "$track_local(110,11,1,#0):", $t3} $t3 == $t3;

    // $t4 := ==($t3, $t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:47:20+2
    assume {:print "$at(4,1101,1103)"} true;
    $t4 := $IsEqual'#0'($t3, $t0);

    // prover::requires($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:47:5+20
    call $0_prover_requires($t4);

    // trace_return[0]($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:49:5+6
    assume {:print "$at(4,1113,1119)"} true;
    assume {:print "$track_return(110,11,0,#0):", $t3} $t3 == $t3;

    // $t5 := prover::type_inv<#0>($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:50:1+1
    assume {:print "$at(4,1120,1121)"} true;
    $t5 := true;

    // prover::requires($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:50:1+1
    assume {:print "$at(4,1120,1121)"} true;
    call $0_prover_requires($t5);

    // return $t3 at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/prover/sources/prover.move:49:5+6
    assume {:print "$at(4,1113,1119)"} true;
    $ret0 := $t3;
    return;

}

// struct memory::BlobRef at ./../memory/sources/memory.move:35:1+317
datatype $0_memory_BlobRef {
    $0_memory_BlobRef($blob_id: $1_string_String, $namespace: $1_string_String, $kind: $1_string_String, $created_at_ms: int)
}
function {:inline} $Update'$0_memory_BlobRef'_blob_id(s: $0_memory_BlobRef, x: $1_string_String): $0_memory_BlobRef {
    $0_memory_BlobRef(x, s->$namespace, s->$kind, s->$created_at_ms)
}
function {:inline} $Update'$0_memory_BlobRef'_namespace(s: $0_memory_BlobRef, x: $1_string_String): $0_memory_BlobRef {
    $0_memory_BlobRef(s->$blob_id, x, s->$kind, s->$created_at_ms)
}
function {:inline} $Update'$0_memory_BlobRef'_kind(s: $0_memory_BlobRef, x: $1_string_String): $0_memory_BlobRef {
    $0_memory_BlobRef(s->$blob_id, s->$namespace, x, s->$created_at_ms)
}
function {:inline} $Update'$0_memory_BlobRef'_created_at_ms(s: $0_memory_BlobRef, x: int): $0_memory_BlobRef {
    $0_memory_BlobRef(s->$blob_id, s->$namespace, s->$kind, x)
}
function $IsValid'$0_memory_BlobRef'(s: $0_memory_BlobRef): bool {
    $IsValid'$1_string_String'(s->$blob_id)
      && $IsValid'$1_string_String'(s->$namespace)
      && $IsValid'$1_string_String'(s->$kind)
      && $IsValid'u64'(s->$created_at_ms)
}
function {:inline} $IsEqual'$0_memory_BlobRef'(s1: $0_memory_BlobRef, s2: $0_memory_BlobRef): bool {
    $IsEqual'$1_string_String'(s1->$blob_id, s2->$blob_id)
    && $IsEqual'$1_string_String'(s1->$namespace, s2->$namespace)
    && $IsEqual'$1_string_String'(s1->$kind, s2->$kind)
    && $IsEqual'u64'(s1->$created_at_ms, s2->$created_at_ms)}
procedure {:inline 1} $0_prover_type_inv'$0_memory_BlobRef'(s: $0_memory_BlobRef) returns (res: bool) {
    res := true;
    return;
}

// struct memory::Memory at ./../memory/sources/memory.move:46:1+335
datatype $0_memory_Memory {
    $0_memory_Memory($id: $2_object_UID, $owner: int, $entries: Vec ($0_memory_BlobRef), $authorized: Vec (int))
}
function {:inline} $Update'$0_memory_Memory'_id(s: $0_memory_Memory, x: $2_object_UID): $0_memory_Memory {
    $0_memory_Memory(x, s->$owner, s->$entries, s->$authorized)
}
function {:inline} $Update'$0_memory_Memory'_owner(s: $0_memory_Memory, x: int): $0_memory_Memory {
    $0_memory_Memory(s->$id, x, s->$entries, s->$authorized)
}
function {:inline} $Update'$0_memory_Memory'_entries(s: $0_memory_Memory, x: Vec ($0_memory_BlobRef)): $0_memory_Memory {
    $0_memory_Memory(s->$id, s->$owner, x, s->$authorized)
}
function {:inline} $Update'$0_memory_Memory'_authorized(s: $0_memory_Memory, x: Vec (int)): $0_memory_Memory {
    $0_memory_Memory(s->$id, s->$owner, s->$entries, x)
}
function $IsValid'$0_memory_Memory'(s: $0_memory_Memory): bool {
    $IsValid'$2_object_UID'(s->$id)
      && $IsValid'address'(s->$owner)
      && $IsValid'vec'$0_memory_BlobRef''(s->$entries)
      && $IsValid'vec'address''(s->$authorized)
}
function {:inline} $IsEqual'$0_memory_Memory'(s1: $0_memory_Memory, s2: $0_memory_Memory): bool {
    $IsEqual'$2_object_UID'(s1->$id, s2->$id)
    && $IsEqual'address'(s1->$owner, s2->$owner)
    && $IsEqual'vec'$0_memory_BlobRef''(s1->$entries, s2->$entries)
    && $IsEqual'vec'address''(s1->$authorized, s2->$authorized)}
function {:inline} $2_object_borrow_uid'$0_memory_Memory'(obj: $0_memory_Memory): $2_object_UID {
    obj->$id
}
var $0_memory_Memory_$memory: $Memory $0_memory_Memory;
procedure {:inline 1} $0_prover_type_inv'$0_memory_Memory'(s: $0_memory_Memory) returns (res: bool) {
    res := true;
    return;
}

// struct memory::MemoryCreated at ./../memory/sources/memory.move:56:1+85
datatype $0_memory_MemoryCreated {
    $0_memory_MemoryCreated($memory_id: $2_object_ID, $owner: int)
}
function {:inline} $Update'$0_memory_MemoryCreated'_memory_id(s: $0_memory_MemoryCreated, x: $2_object_ID): $0_memory_MemoryCreated {
    $0_memory_MemoryCreated(x, s->$owner)
}
function {:inline} $Update'$0_memory_MemoryCreated'_owner(s: $0_memory_MemoryCreated, x: int): $0_memory_MemoryCreated {
    $0_memory_MemoryCreated(s->$memory_id, x)
}
function $IsValid'$0_memory_MemoryCreated'(s: $0_memory_MemoryCreated): bool {
    $IsValid'$2_object_ID'(s->$memory_id)
      && $IsValid'address'(s->$owner)
}
function {:inline} $IsEqual'$0_memory_MemoryCreated'(s1: $0_memory_MemoryCreated, s2: $0_memory_MemoryCreated): bool {
    s1 == s2
}
procedure {:inline 1} $0_prover_type_inv'$0_memory_MemoryCreated'(s: $0_memory_MemoryCreated) returns (res: bool) {
    res := true;
    return;
}

// fun memory::new [baseline] at ./../memory/sources/memory.move:88:1+297
procedure {:inline 1} $0_memory_new$impl(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: $0_memory_Memory, $ret1: $Mutation ($2_tx_context_TxContext))
{
    // declare local variables
    var $t1: $0_memory_Memory;
    var $t2: int;
    var $t3: $2_tx_context_TxContext;
    var $t4: int;
    var $t5: $2_object_UID;
    var $t6: Vec ($0_memory_BlobRef);
    var $t7: Vec (int);
    var $t8: $0_memory_Memory;
    var $t9: $2_object_ID;
    var $t10: $0_memory_MemoryCreated;
    var $t0: $Mutation ($2_tx_context_TxContext);
    var $temp_0'$0_memory_Memory': $0_memory_Memory;
    var $temp_0'$2_tx_context_TxContext': $2_tx_context_TxContext;
    var $temp_0'address': int;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[ctx]($t0) at ./../memory/sources/memory.move:88:1+1
    assume {:print "$at(255,3235,3236)"} true;
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(135,0,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // $t3 := read_ref($t0) at ./../memory/sources/memory.move:89:17+3
    assume {:print "$at(255,3297,3300)"} true;
    $t3 := $Dereference($t0);

    // $t4 := tx_context::sender($t3) at ./../memory/sources/memory.move:89:17+12
    $t4 := $2_tx_context_sender$pure($t3);
    assume $IsValid'address'($t4);

    // trace_local[owner#1#0]($t4) at ./../memory/sources/memory.move:89:9+5
    assume {:print "$at(255,3289,3294)"} true;
    assume {:print "$track_local(135,0,2,address):", $t4} $t4 == $t4;

    // $t5 := object::new($t0) at ./../memory/sources/memory.move:91:13+16
    assume {:print "$at(255,3349,3365)"} true;
    call $t5,$t0 := $2_object_new($t0);

    // $t6 := vector::empty<memory::BlobRef>() at ./../memory/sources/memory.move:93:18+8
    assume {:print "$at(255,3399,3407)"} true;
    $t6 := $1_vector_empty'$0_memory_BlobRef'();

    // $t7 := [] at ./../memory/sources/memory.move:94:21+8
    assume {:print "$at(255,3429,3437)"} true;
    $t7 := $EmptyVec'address'();
    assume $IsValid'vec'address''($t7);

    // $t8 := pack memory::Memory($t5, $t4, $t6, $t7) at ./../memory/sources/memory.move:90:18+116
    assume {:print "$at(255,3328,3444)"} true;
    $t8 := $0_memory_Memory($t5, $t4, $t6, $t7);

    // trace_local[memory#1#0]($t8) at ./../memory/sources/memory.move:90:9+6
    assume {:print "$track_local(135,0,1,$0_memory_Memory):", $t8} $t8 == $t8;

    // $t9 := object::id<memory::Memory>($t8) at ./../memory/sources/memory.move:96:44+19
    assume {:print "$at(255,3489,3508)"} true;
    $t9 := $2_object_id'$0_memory_Memory'$pure($t8);
    assume $IsValid'$2_object_ID'($t9);

    // $t10 := pack memory::MemoryCreated($t9, $t4) at ./../memory/sources/memory.move:96:17+55
    assume {:print "$at(255,3462,3517)"} true;
    $t10 := $0_memory_MemoryCreated($t9, $t4);

    // event::emit<memory::MemoryCreated>($t10) at ./../memory/sources/memory.move:96:5+68
    call $2_event_emit'$0_memory_MemoryCreated'($t10);

    // trace_return[0]($t8) at ./../memory/sources/memory.move:97:5+6
    assume {:print "$at(255,3524,3530)"} true;
    assume {:print "$track_return(135,0,0,$0_memory_Memory):", $t8} $t8 == $t8;

    // trace_local[ctx]($t0) at ./../memory/sources/memory.move:97:5+6
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(135,0,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // return $t8 at ./../memory/sources/memory.move:97:5+6
    $ret0 := $t8;
    $ret1 := $t0;
    return;

}

// fun memory::owner [baseline] at ./../memory/sources/memory.move:163:1+63
procedure {:inline 1} $0_memory_owner(_$t0: $0_memory_Memory) returns ($ret0: int)
{
    // declare local variables
    var $t1: int;
    var $t0: $0_memory_Memory;
    var $temp_0'$0_memory_Memory': $0_memory_Memory;
    var $temp_0'address': int;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[memory]($t0) at ./../memory/sources/memory.move:163:1+1
    assume {:print "$at(255,6035,6036)"} true;
    assume {:print "$track_local(135,6,0,$0_memory_Memory):", $t0} $t0 == $t0;

    // $t1 := get_field<memory::Memory>.owner($t0) at ./../memory/sources/memory.move:164:5+12
    assume {:print "$at(255,6084,6096)"} true;
    $t1 := $t0->$owner;

    // trace_return[0]($t1) at ./../memory/sources/memory.move:164:5+12
    assume {:print "$track_return(135,6,0,address):", $t1} $t1 == $t1;

    // return $t1 at ./../memory/sources/memory.move:164:5+12
    $ret0 := $t1;
    return;

}

// fun memory::entry_count [baseline] at ./../memory/sources/memory.move:167:1+76
procedure {:inline 1} $0_memory_entry_count(_$t0: $0_memory_Memory) returns ($ret0: int)
{
    // declare local variables
    var $t1: Vec ($0_memory_BlobRef);
    var $t2: int;
    var $t0: $0_memory_Memory;
    var $temp_0'$0_memory_Memory': $0_memory_Memory;
    var $temp_0'u64': int;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[memory]($t0) at ./../memory/sources/memory.move:167:1+1
    assume {:print "$at(255,6100,6101)"} true;
    assume {:print "$track_local(135,7,0,$0_memory_Memory):", $t0} $t0 == $t0;

    // $t1 := get_field<memory::Memory>.entries($t0) at ./../memory/sources/memory.move:168:5+14
    assume {:print "$at(255,6151,6165)"} true;
    $t1 := $t0->$entries;

    // $t2 := vector::length<memory::BlobRef>($t1) at ./../memory/sources/memory.move:168:5+23
    $t2 := $1_vector_length'$0_memory_BlobRef'($t1);

    // trace_return[0]($t2) at ./../memory/sources/memory.move:168:5+23
    assume {:print "$at(255,6151,6174)"} true;
    assume {:print "$track_return(135,7,0,u64):", $t2} $t2 == $t2;

    // return $t2 at ./../memory/sources/memory.move:168:5+23
    $ret0 := $t2;
    return;

}

// fun memory_specs::new_spec [baseline] at ./sources/memory_specs.move:42:1+179
procedure $0_memory_new$opaque(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: $0_memory_Memory, $ret1: $Mutation ($2_tx_context_TxContext));

procedure {:inline 1} $0_memory_new(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: $0_memory_Memory, $ret1: $Mutation ($2_tx_context_TxContext))
{
    // declare local variables
    var $t1: $0_memory_Memory;
    var $t2: $0_memory_Memory;
    var $t3: int;
    var $t4: $2_tx_context_TxContext;
    var $t5: int;
    var $t6: bool;
    var $t7: int;
    var $t8: int;
    var $t9: bool;
    var $t0: $Mutation ($2_tx_context_TxContext);
    var $mut_save_0: $Mutation ($2_tx_context_TxContext);
    var $temp_0'$0_memory_Memory': $0_memory_Memory;
    var $temp_0'$2_tx_context_TxContext': $2_tx_context_TxContext;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[ctx]($t0) at ./sources/memory_specs.move:42:1+1
    assume {:print "$at(260,1891,1892)"} true;
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(145,1,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // $t2 := memory::new($t0) at ./sources/memory_specs.move:43:13+16
    assume {:print "$at(260,1954,1970)"} true;
    $mut_save_0 := $t0;
    call $t2,$t0 := $0_memory_new$opaque($t0);
    $t0 := $UpdateMutation($mut_save_0, $Dereference($t0));

    // $t2 := havoc[val]() at ./sources/memory_specs.move:42:1+179
    assume {:print "$at(260,1891,2070)"} true;
    havoc $t2;

    // assume WellFormed($t2) at ./sources/memory_specs.move:42:1+179
    assume $IsValid'$0_memory_Memory'($t2);

    // $t0 := havoc[mut]() at ./sources/memory_specs.move:42:1+179
    havoc $temp_0'$2_tx_context_TxContext';
    $t0 := $UpdateMutation($t0, $temp_0'$2_tx_context_TxContext');

    // assume WellFormed($t0) at ./sources/memory_specs.move:42:1+179
    assume $IsValid'$2_tx_context_TxContext'($Dereference($t0));

    // trace_local[m#1#0]($t2) at ./sources/memory_specs.move:43:9+1
    assume {:print "$at(260,1950,1951)"} true;
    assume {:print "$track_local(145,1,1,$0_memory_Memory):", $t2} $t2 == $t2;

    // $t3 := memory::owner($t2) at ./sources/memory_specs.move:44:13+17
    assume {:print "$at(260,1984,2001)"} true;
    call $t3 := $0_memory_owner($t2);

    // $t4 := read_ref($t0) at ./sources/memory_specs.move:44:34+3
    assume {:print "$at(260,2005,2008)"} true;
    $t4 := $Dereference($t0);

    // $t5 := tx_context::sender($t4) at ./sources/memory_specs.move:44:34+12
    $t5 := $2_tx_context_sender$pure($t4);
    assume $IsValid'address'($t5);

    // $t6 := ==($t3, $t5) at ./sources/memory_specs.move:44:31+2
    assume {:print "$at(260,2002,2004)"} true;
    $t6 := $IsEqual'address'($t3, $t5);

    // prover::requires($t6) at ./sources/memory_specs.move:44:5+42
    call $0_prover_requires($t6);

    // $t7 := memory::entry_count($t2) at ./sources/memory_specs.move:45:13+23
    assume {:print "$at(260,2032,2055)"} true;
    call $t7 := $0_memory_entry_count($t2);

    // $t8 := 0 at ./sources/memory_specs.move:45:40+1
    assume {:print "$at(260,2059,2060)"} true;
    $t8 := 0;
    assume $IsValid'u64'($t8);

    // $t9 := ==($t7, $t8) at ./sources/memory_specs.move:45:37+2
    $t9 := $IsEqual'u64'($t7, $t8);

    // prover::requires($t9) at ./sources/memory_specs.move:45:5+37
    call $0_prover_requires($t9);

    // trace_return[0]($t2) at ./sources/memory_specs.move:46:5+1
    assume {:print "$at(260,2067,2068)"} true;
    assume {:print "$track_return(145,1,0,$0_memory_Memory):", $t2} $t2 == $t2;

    // trace_local[ctx]($t0) at ./sources/memory_specs.move:46:5+1
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(145,1,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // return $t2 at ./sources/memory_specs.move:46:5+1
    $ret0 := $t2;
    $ret1 := $t0;
    return;

}

// fun memory_specs::new_spec [verification] at ./sources/memory_specs.move:42:1+179
procedure {:timeLimit 240} $0_memory_new$spec_no_abort_check$verify(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: $0_memory_Memory, $ret1: $Mutation ($2_tx_context_TxContext))
{
    // declare local variables
    var $t1: $0_memory_Memory;
    var $t2: $0_memory_Memory;
    var $t3: int;
    var $t4: $2_tx_context_TxContext;
    var $t5: int;
    var $t6: bool;
    var $t7: int;
    var $t8: int;
    var $t9: bool;
    var $t0: $Mutation ($2_tx_context_TxContext);
    var $mut_save_0: $Mutation ($2_tx_context_TxContext);
    var $temp_0'$0_memory_Memory': $0_memory_Memory;
    var $temp_0'$2_tx_context_TxContext': $2_tx_context_TxContext;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // verification entrypoint assumptions
    call $InitVerification();
    assume $t0->l == $Param(0);

    // bytecode translation starts here
    // assume WellFormed($t0) at ./sources/memory_specs.move:42:1+1
    assume {:print "$at(260,1891,1892)"} true;
    assume $IsValid'$2_tx_context_TxContext'($Dereference($t0));

    // trace_local[ctx]($t0) at ./sources/memory_specs.move:42:1+1
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(145,1,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // $t2 := memory::new($t0) at ./sources/memory_specs.move:43:13+16
    assume {:print "$at(260,1954,1970)"} true;
    $mut_save_0 := $t0;
    call $t2,$t0 := $0_memory_new$opaque($t0);
    $t0 := $UpdateMutation($mut_save_0, $Dereference($t0));

    // $t2 := havoc[val]() at ./sources/memory_specs.move:42:1+179
    assume {:print "$at(260,1891,2070)"} true;
    havoc $t2;

    // assume WellFormed($t2) at ./sources/memory_specs.move:42:1+179
    assume $IsValid'$0_memory_Memory'($t2);

    // $t0 := havoc[mut]() at ./sources/memory_specs.move:42:1+179
    havoc $temp_0'$2_tx_context_TxContext';
    $t0 := $UpdateMutation($t0, $temp_0'$2_tx_context_TxContext');

    // assume WellFormed($t0) at ./sources/memory_specs.move:42:1+179
    assume $IsValid'$2_tx_context_TxContext'($Dereference($t0));

    // trace_local[m#1#0]($t2) at ./sources/memory_specs.move:43:9+1
    assume {:print "$at(260,1950,1951)"} true;
    assume {:print "$track_local(145,1,1,$0_memory_Memory):", $t2} $t2 == $t2;

    // $t3 := memory::owner($t2) at ./sources/memory_specs.move:44:13+17
    assume {:print "$at(260,1984,2001)"} true;
    call $t3 := $0_memory_owner($t2);

    // $t4 := read_ref($t0) at ./sources/memory_specs.move:44:34+3
    assume {:print "$at(260,2005,2008)"} true;
    $t4 := $Dereference($t0);

    // $t5 := tx_context::sender($t4) at ./sources/memory_specs.move:44:34+12
    $t5 := $2_tx_context_sender$pure($t4);
    assume $IsValid'address'($t5);

    // $t6 := ==($t3, $t5) at ./sources/memory_specs.move:44:31+2
    assume {:print "$at(260,2002,2004)"} true;
    $t6 := $IsEqual'address'($t3, $t5);

    // prover::requires($t6)no_abort check at ./sources/memory_specs.move:44:5+42
    call $0_prover_requires($t6);
    assert {:msg "assert_failed(260,1976,2018): code should not abort"} !$abort_flag;

    // $t7 := memory::entry_count($t2) at ./sources/memory_specs.move:45:13+23
    assume {:print "$at(260,2032,2055)"} true;
    call $t7 := $0_memory_entry_count($t2);

    // $t8 := 0 at ./sources/memory_specs.move:45:40+1
    assume {:print "$at(260,2059,2060)"} true;
    $t8 := 0;
    assume $IsValid'u64'($t8);

    // $t9 := ==($t7, $t8) at ./sources/memory_specs.move:45:37+2
    $t9 := $IsEqual'u64'($t7, $t8);

    // prover::requires($t9)no_abort check at ./sources/memory_specs.move:45:5+37
    call $0_prover_requires($t9);
    assert {:msg "assert_failed(260,2024,2061): code should not abort"} !$abort_flag;

    // trace_return[0]($t2) at ./sources/memory_specs.move:46:5+1
    assume {:print "$at(260,2067,2068)"} true;
    assume {:print "$track_return(145,1,0,$0_memory_Memory):", $t2} $t2 == $t2;

    // trace_local[ctx]($t0) at ./sources/memory_specs.move:46:5+1
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(145,1,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // return $t2 at ./sources/memory_specs.move:46:5+1
    $ret0 := $t2;
    $ret1 := $t0;
    return;

}

// fun tx_context_spec::fresh_object_address_spec [baseline] at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+196
procedure $2_tx_context_fresh_object_address$opaque(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: int, $ret1: $Mutation ($2_tx_context_TxContext));

procedure {:inline 1} $2_tx_context_fresh_object_address(_$t0: $Mutation ($2_tx_context_TxContext)) returns ($ret0: int, $ret1: $Mutation ($2_tx_context_TxContext))
{
    // declare local variables
    var $t1: $2_tx_context_TxContext;
    var $t2: int;
    var $t3: $2_tx_context_TxContext;
    var $t4: int;
    var $t5: $2_tx_context_TxContext;
    var $t6: Vec (int);
    var $t7: Vec (int);
    var $t8: bool;
    var $t0: $Mutation ($2_tx_context_TxContext);
    var $mut_save_0: $Mutation ($2_tx_context_TxContext);
    var $temp_0'$2_tx_context_TxContext': $2_tx_context_TxContext;
    var $temp_0'address': int;
    var $abort_if_cond: bool;
    $t0 := _$t0;

    // bytecode translation starts here
    // trace_local[ctx]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+1
    assume {:print "$at(34,383,384)"} true;
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(155,0,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // $t3 := read_ref($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:23:26+3
    assume {:print "$at(34,470,473)"} true;
    $t3 := $Dereference($t0);

    // trace_local[old_ctx#1#0]($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:23:9+7
    assume {:print "$track_local(155,0,1,$2_tx_context_TxContext):", $t3} $t3 == $t3;

    // $t4 := tx_context::fresh_object_address($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:24:18+25
    assume {:print "$at(34,493,518)"} true;
    $mut_save_0 := $t0;
    call $t4,$t0 := $2_tx_context_fresh_object_address$opaque($t0);
    $t0 := $UpdateMutation($mut_save_0, $Dereference($t0));

    // $t4 := havoc[val]() at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+196
    assume {:print "$at(34,383,579)"} true;
    havoc $t4;

    // assume WellFormed($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+196
    assume $IsValid'address'($t4);

    // $t0 := havoc[mut]() at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+196
    havoc $temp_0'$2_tx_context_TxContext';
    $t0 := $UpdateMutation($t0, $temp_0'$2_tx_context_TxContext');

    // assume WellFormed($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:22:1+196
    assume $IsValid'$2_tx_context_TxContext'($Dereference($t0));

    // trace_local[result#1#0]($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:24:9+6
    assume {:print "$at(34,484,490)"} true;
    assume {:print "$track_local(155,0,2,address):", $t4} $t4 == $t4;

    // $t5 := read_ref($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:25:13+3
    assume {:print "$at(34,532,535)"} true;
    $t5 := $Dereference($t0);

    // $t6 := tx_context::digest($t5) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:25:13+12
    $t6 := $2_tx_context_digest$pure($t5);
    assume $IsValid'vec'u8''($t6);

    // $t7 := tx_context::digest($t3) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:25:29+16
    assume {:print "$at(34,548,564)"} true;
    $t7 := $2_tx_context_digest$pure($t3);
    assume $IsValid'vec'u8''($t7);

    // $t8 := ==($t6, $t7) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:25:26+2
    assume {:print "$at(34,545,547)"} true;
    $t8 := $IsEqual'vec'u8''($t6, $t7);

    // prover::requires($t8) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:25:5+41
    call $0_prover_requires($t8);

    // trace_return[0]($t4) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:26:5+6
    assume {:print "$at(34,571,577)"} true;
    assume {:print "$track_return(155,0,0,address):", $t4} $t4 == $t4;

    // trace_local[ctx]($t0) at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:26:5+6
    $temp_0'$2_tx_context_TxContext' := $Dereference($t0);
    assume {:print "$track_local(155,0,0,$2_tx_context_TxContext):", $temp_0'$2_tx_context_TxContext'} $temp_0'$2_tx_context_TxContext' == $temp_0'$2_tx_context_TxContext';

    // return $t4 at /Users/mini/.move/https___github_com_asymptotic-code_sui-prover_git_main/packages/sui-specs/sources/sui-framework/tx_context.move:26:5+6
    $ret0 := $t4;
    $ret1 := $t0;
    return;

}

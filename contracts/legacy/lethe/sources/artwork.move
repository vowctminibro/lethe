/// Lethe — AI art collectible on Sui.
///
/// Each Artwork is an owned NFT. The artwork image itself lives on Walrus;
/// this object embeds the Walrus `image_blob_id` on-chain, which is what makes
/// Walrus load-bearing for the collection — ownership and the storage pointer
/// are inseparable. `traits` is the deterministic trait selection (rarity is a
/// pure function of it, recomputed off-chain).
module lethe::artwork {
    use std::string::String;
    use sui::event;

    /// An owned AI art collectible.
    public struct Artwork has key, store {
        id: UID,
        /// Walrus blob id of the generated image.
        image_blob_id: String,
        /// The locked, assembled generation prompt.
        prompt: String,
        /// Trait selection, e.g. "species:fox;color:mint;accessory:crown;background:pink".
        traits: String,
        creator: address,
        created_at_ms: u64,
    }

    public struct ArtworkMinted has copy, drop {
        artwork_id: ID,
        creator: address,
        image_blob_id: String,
        created_at_ms: u64,
    }

    /// Mint an Artwork owned by the caller. Designed to be sponsorable via
    /// Enoki (no Clock / shared-object args → simple gasless allowlist entry).
    public entry fun mint(
        image_blob_id: String,
        prompt: String,
        traits: String,
        created_at_ms: u64,
        ctx: &mut TxContext,
    ) {
        let creator = ctx.sender();
        let id = object::new(ctx);
        let artwork_id = id.to_inner();

        let art = Artwork {
            id,
            image_blob_id,
            prompt,
            traits,
            creator,
            created_at_ms,
        };

        event::emit(ArtworkMinted {
            artwork_id,
            creator,
            image_blob_id: art.image_blob_id,
            created_at_ms,
        });

        transfer::public_transfer(art, creator);
    }

    // ─── Read helpers ───────────────────────────────────────────────────
    public fun image_blob_id(a: &Artwork): String { a.image_blob_id }
    public fun prompt(a: &Artwork): String { a.prompt }
    public fun traits(a: &Artwork): String { a.traits }
    public fun creator(a: &Artwork): address { a.creator }
    public fun created_at_ms(a: &Artwork): u64 { a.created_at_ms }
}

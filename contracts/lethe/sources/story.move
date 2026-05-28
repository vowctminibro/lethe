module lethe::story {
    use std::string::String;
    use std::vector;
    use sui::object::UID;
    use sui::object;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::clock::Clock;
    use sui::event;
    use sui::clock::timestamp_ms;

    // ─── Errors ────────────────────────────────────────────────────────

    const ENotAuthor: u64 = 1;

    // ─── Objects ───────────────────────────────────────────────────────

    /// A Story NFT, owned by its author. Each chapter's prose + scene image
    /// live on Walrus; this object holds the ownership record and the
    /// ordered list of chapter blob references — the persistence backbone
    /// of the storytelling app.
    public struct Story has key, store {
        id: UID,
        author: address,
        title: String,
        world: String,
        chapters: vector<Chapter>,
        created_ms: u64,
    }

    public struct Chapter has store, copy, drop {
        index: u64,
        text_blob_id: String,
        image_blob_id: String,
        summary: String,
        created_ms: u64,
    }

    // ─── Events ────────────────────────────────────────────────────────

    public struct StoryCreated has copy, drop {
        story_id: ID,
        author: address,
        title: String,
        world: String,
        created_ms: u64,
    }

    public struct ChapterAdded has copy, drop {
        story_id: ID,
        author: address,
        index: u64,
        text_blob_id: String,
        chapter_count: u64,
        created_ms: u64,
    }

    // ─── Entry Functions ───────────────────────────────────────────────

    /// Mint a new Story NFT with its opening chapter. Transfers ownership
    /// to the caller.
    public entry fun create_story(
        title: vector<u8>,
        world: vector<u8>,
        first_text_blob: vector<u8>,
        first_image_blob: vector<u8>,
        first_summary: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let id = object::new(ctx);
        let story_id_inner = object::uid_to_inner(&id);
        let author = tx_context::sender(ctx);
        let ts = timestamp_ms(clock);

        let title_str = std::string::utf8(title);
        let world_str = std::string::utf8(world);

        let mut chapters = vector[];
        vector::push_back(&mut chapters, Chapter {
            index: 0,
            text_blob_id: std::string::utf8(first_text_blob),
            image_blob_id: std::string::utf8(first_image_blob),
            summary: std::string::utf8(first_summary),
            created_ms: ts,
        });

        let story = Story {
            id,
            author,
            title: title_str,
            world: world_str,
            chapters,
            created_ms: ts,
        };

        event::emit(StoryCreated {
            story_id: story_id_inner,
            author,
            title: title_str,
            world: world_str,
            created_ms: ts,
        });

        transfer::public_transfer(story, author);
    }

    /// Append a chapter to an existing Story. Only the author may extend it.
    public entry fun add_chapter(
        story: &mut Story,
        text_blob: vector<u8>,
        image_blob: vector<u8>,
        summary: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == story.author, ENotAuthor);

        let ts = timestamp_ms(clock);
        let index = vector::length(&story.chapters);
        let text_str = std::string::utf8(text_blob);

        vector::push_back(&mut story.chapters, Chapter {
            index,
            text_blob_id: text_str,
            image_blob_id: std::string::utf8(image_blob),
            summary: std::string::utf8(summary),
            created_ms: ts,
        });

        event::emit(ChapterAdded {
            story_id: object::uid_to_inner(&story.id),
            author: story.author,
            index,
            text_blob_id: text_str,
            chapter_count: vector::length(&story.chapters),
            created_ms: ts,
        });
    }

    // ─── Read Functions ────────────────────────────────────────────────

    public fun chapter_count(story: &Story): u64 {
        vector::length(&story.chapters)
    }

    public fun author(story: &Story): address {
        story.author
    }
}

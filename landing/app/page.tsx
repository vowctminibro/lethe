export default function Home() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <Architecture />
      <CodeExample />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-accent grid place-items-center font-bold">λ</div>
        <span className="font-semibold text-lg">Lethe</span>
        <span className="text-xs text-inkdim ml-2 px-2 py-0.5 rounded border border-border">
          Sui Overflow 2026
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <a href="https://github.com/vowctminibro/lethe" className="text-inkdim hover:text-ink transition">
          GitHub
        </a>
        <a href="#quickstart" className="text-inkdim hover:text-ink transition">
          Quickstart
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="inline-flex items-center gap-2 text-xs text-accent-soft mb-6">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Walrus Track · Live on Sui testnet
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
        Persistent memory<br />
        for <span className="text-accent">Sui games.</span>
      </h1>
      <p className="text-xl text-inkdim max-w-2xl mb-10 leading-relaxed">
        Your NPCs remember every player across sessions.
        Three lines of code. Backed by Walrus.
      </p>
      <div className="font-mono text-sm bg-panel border border-border rounded-lg p-4 max-w-xl mb-4">
        <span className="text-inkdim">$</span> <span className="text-ok">pnpm add</span>{" "}
        <span className="text-accent-soft">@lethe/sdk</span>
        <span className="text-inkdim text-xs ml-3">// npm package — coming soon · github.com/vowctminibro/lethe</span>
      </div>
      <div className="flex gap-3 text-sm">
        <a
          href="#quickstart"
          className="px-5 py-2.5 rounded-md bg-accent text-white font-medium hover:bg-accent-soft transition"
        >
          Quickstart
        </a>
        <a
          href="https://github.com/vowctminibro/lethe"
          className="px-5 py-2.5 rounded-md border border-border hover:border-accent transition"
        >
          View on GitHub
        </a>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Install",
      desc: "Add the SDK to your Sui game project. Works with Unity, React, or any TypeScript runtime.",
    },
    {
      n: "02",
      title: "Wire your NPC",
      desc: "Create an NPC instance. Call remember() when something matters. Call recall() to retrieve.",
    },
    {
      n: "03",
      title: "Ship",
      desc: "Memories persist on Walrus + Sui. Players keep their history across sessions, devices, and game updates.",
    },
  ];
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
      <h2 className="text-3xl font-bold mb-2">How it works</h2>
      <p className="text-inkdim mb-12">Three steps. No backend to manage.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.n} className="bg-panel border border-border rounded-lg p-6">
            <div className="text-accent font-mono text-sm mb-3">{s.n}</div>
            <div className="font-semibold text-lg mb-2">{s.title}</div>
            <div className="text-inkdim text-sm leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
      <h2 className="text-3xl font-bold mb-2">Stack</h2>
      <p className="text-inkdim mb-12">Every layer is Sui-native.</p>
      <div className="font-mono text-sm bg-panel border border-border rounded-lg p-8 leading-loose">
        <div className="text-inkdim">[ Your Game ]</div>
        <div className="text-inkdim pl-4">↓ npc.remember() / npc.recall()</div>
        <div className="text-accent">[ @lethe/sdk ]</div>
        <div className="text-inkdim pl-4">↓ HTTP</div>
        <div className="text-accent">[ memory-service ]</div>
        <div className="text-inkdim text-xs pl-4">Run as sidecar today. Hosted endpoint in v0.2.</div>
        <div className="text-inkdim pl-4">↓ blobs</div>
        <div className="text-accent-soft">[ Walrus ] ← decentralized blob storage</div>
        <div className="text-inkdim pl-4">↓ refs</div>
        <div className="text-accent-soft">[ Sui Move ] ← on-chain NPC objects</div>
      </div>
    </section>
  );
}

function CodeExample() {
  return (
    <section id="quickstart" className="max-w-6xl mx-auto px-6 py-20 border-t border-border">
      <h2 className="text-3xl font-bold mb-2">Quickstart</h2>
      <p className="text-inkdim mb-12">A complete NPC memory loop in 3 lines.</p>
      <div className="bg-panel border border-border rounded-lg p-6 font-mono text-sm overflow-x-auto">
        <pre className="leading-relaxed">
          <span className="text-inkdim">{"// 1. Connect"}</span>
          {"\n"}
          <span className="text-accent">{"const"}</span> lethe = <span className="text-accent">{"new"}</span> Lethe({"{"} network: <span className="text-ok">{"'sui-testnet'"}</span>{" }"});
          {"\n\n"}
          <span className="text-inkdim">{"// 2. Get your NPC"}</span>
          {"\n"}
          <span className="text-accent">{"const"}</span> npc = lethe.npc(<span className="text-ok">{"'khun-tum'"}</span>);
          {"\n\n"}
          <span className="text-inkdim">{"// 3. Remember + recall"}</span>
          {"\n"}
          <span className="text-accent">{"await"}</span> npc.remember(playerWallet, {"{"} event: <span className="text-ok">{"'stole 100 gold'"}</span>{" }"});
          {"\n"}
          <span className="text-accent">{"const"}</span> memories = <span className="text-accent">{"await"}</span> npc.recall(playerWallet);
        </pre>
      </div>
      <p className="text-inkdim text-sm mt-4">
        Full API:{" "}
        <a
          href="https://github.com/vowctminibro/lethe#api"
          className="text-accent-soft hover:underline"
        >
          github.com/vowctminibro/lethe
        </a>
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-border text-sm text-inkdim">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          Built solo for{" "}
          <a href="https://overflow.sui.io" className="text-accent-soft hover:underline">
            Sui Overflow 2026
          </a>
          {" "}· Walrus Track
        </div>
        <div className="flex gap-6">
          <a href="https://github.com/vowctminibro/lethe" className="hover:text-ink transition">
            GitHub
          </a>
          <a href="https://x.com/VowIMTX" className="hover:text-ink transition">
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
# Walrus Testnet Endpoints

Last updated: 2026-05-18

## Verified Testnet Endpoints

### Publisher (upload blobs)
```
https://publisher.walrus-testnet.walrus.space/v1/blobs
```

### Aggregator (read blobs)
```
https://aggregator.walrus-testnet.walrus.space/v1/blobs
```

## Source References
- Mysten Labs X @WalrusProtocol — Swift code example
- SealTrust API docs (docs.sealtrust.app/api-reference) — REST usage examples
- Flutter Walrus integration (medium.com/@immadominion, Apr 2026)
- OneTube project (github.com/YuseiWhite/one-tube) — uses 60+ testnet publishers/aggregators
- Sui TypeScript SDK docs (sdk.mystenlabs.com/walrus)

## Uptime Note
OneTube README states "60+ Walrus Testnet publishers/aggregators" — multiple redundant endpoints for failover. The primary canonical endpoints above are confirmed across 5+ independent sources.

## Mainnet Endpoints (for reference)
```
https://publisher.walrus.walrus.space/v1/blobs
https://aggregator.walrus.walrus.space/v1/blobs
```
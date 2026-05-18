# Unity 6000.x — Lethe SDK integration notes

> Assumptions: Unity 6000.3.15f1 (macOS), C# / JsonUtility, Lethe memory service on localhost:3001.

---

## 1. Modular packages

Unity 6 ships a **minimal default module set**. Apps that use these need explicit `Packages/manifest.json` entries:

| Module | manifest entry | Used for |
|--------|---------------|----------|
| UI | `com.unity.modules.ui` | Text, Button, Canvas |
| HTTP client | `com.unity.modules.unitywebrequest` | UnityWebRequest |
| JSON serialization | `com.unity.modules.jsonserialize` | JsonUtility |
| IMGUI debug | `com.unity.modules.imgui` | OnGUI overlays |
| Physics raycast | `com.unity.modules.physics` | Physics.Raycast |

**Full entry** (all Lethe demo-game needs):

```json
{
  "dependencies": {
    "com.unity.modules.ai": "1.0.0",
    "com.unity.modules.androidjni": "1.0.0",
    "com.unity.modules.animation": "1.0.0",
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.uielements": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0",
    "com.unity.modules.imgui": "1.0.0"
  }
}
```

Without these, `UnityEngine.UI` types (Text, Canvas, Button) **will not compile** even if you have `using UnityEngine.UI;` — Unity simply never resolves the assembly.

---

## 2. UnityEngine.UI.dll missing bug

**Confirmed on:** Unity 6000.3.15f1 (macOS 26.5, Unity Hub)

The `Text`/`Button`/`Canvas` component types live in `UnityEngine.UI.dll`. This DLL is **NOT shipped with the base Editor install** — it only exists inside template project caches.

**Known working paths** (Unity 6000.3.15f1):

```
/Applications/Unity/Hub/Editor/6000.3.15f1/Unity.app/Contents/Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.3d-high-end-17.0.7/ScriptAssemblies/UnityEngine.UI.dll

/Applications/Unity/Hub/Editor/6000.3.15f1/Unity.app/Contents/Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.3d-cross-platform-17.0.14/ScriptAssemblies/UnityEngine.UI.dll

/Applications/Unity/Hub/Editor/6000.3.15f1/Unity.app/Contents/Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.2d-cross-platform-2d-6.1.2/ScriptAssemblies/UnityEngine.UI.dll
```

**Workaround** — copy from any template cache to your project:

```bash
cp "/Applications/Unity/Hub/Editor/6000.3.15f1/Unity.app/Contents/Resources/PackageManager/ProjectTemplates/libcache/com.unity.template.3d-high-end-17.0.7/ScriptAssemblies/UnityEngine.UI.dll" \
   ~/Projects/lethe/demo-game/Assets/Plugins/UnityEngine.UI.dll
```

Then compile. The DLL gets included in your `Assembly-CSharp.dll` output automatically.

**Why this happens:** In Unity 6000, the built-in UI module is resolved via `com.unity.modules.ui` in the manifest. The compiler (Bee) should reference `UnityEngine.UI.dll` from the Editor's internal managed assemblies. However, in 6000.3.15f1, the Bee DAG does not include `UnityEngine.UI.dll` in the assembly reference list unless the `com.unity.modules.ui` package is explicitly declared. Even when declared, the DLL itself may not be emitted to the build output — it lives only in the template caches. The `Assets/Plugins` copy is the reliable workaround.

**Future fix (when `@lethe/unity` package ships):**
- Option A: Bundle `UnityEngine.UI.dll` in the package under `Runtime/`
- Option B: Document the workaround clearly in the package README
- Option C: Use a custom `asmdef` with `precompiledReferences` pointing to the DLL path

---

## 3. JsonUtility `@event` field handling

`event` is a **C# reserved keyword**. C# allows `@event` as a field name escape.

**Serialization (C# → JSON):**  
`JsonUtility.ToJson` correctly outputs `"event"` (drops the `@` prefix) — verified in Lethe demo-game `TestJsonUtility.cs`.

**Deserialization (JSON → C#):**  
`JsonUtility.FromJson` of a `"event"` key into a `@event` field has been unreliable in Unity 6000.x. The parsed value often comes back empty.

**Mitigation used in Lethe SDK:**

```csharp
using System.Text.RegularExpressions;

private static readonly Regex EventRegex =
    new Regex("\"@?event\"\\s*:\\s*\"([^\"\\\\]*(?:\\\\.[^\"\\\\]*)*)\"",
              RegexOptions.Compiled);

/// <summary>
/// Extracts the latest event value from raw Lethe recall JSON.
/// Matches both "event" (service response) and "@event" (Sui storage) for compatibility.
/// </summary>
public static string ExtractLatestEvent(string rawJson)
{
    if (string.IsNullOrEmpty(rawJson)) return null;
    var matches = EventRegex.Matches(rawJson);
    if (matches.Count == 0) return null;
    return matches[matches.Count - 1].Groups[1].Value;
}
```

**Service response format** (confirmed from `localhost:3001`):

```json
{
  "events": [{
    "blobId": "U16MlYB1XaJjFxBwwhG_WnI6lc3L_ONRvN3La8UoBiw",
    "timestampMs": 1779096962176,
    "content": {
      "v": 1,
      "npcId": "khun-tum",
      "playerWallet": "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077",
      "event": "stole 100 gold from the merchant",   // ← plain "event" key
      "timestamp": 1779096950435
    }
  }],
  "count": 1,
  "suiObjectId": "0xd1d07e1546e01c501a732ff9984e702246f56852dd5f6f687e0f72382d7808e4"
}
```

**Note:** Sui storage uses `"@event"` (the field name is stored with the `@` prefix on-chain). The regex handles both forms.

---

## 4. File checklist for `@lethe/unity` package

When packaging the Lethe Unity SDK:

```
LetheUnitySDK/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── Runtime/
│   ├── Scripts/
│   │   ├── LetheClient.cs          # HTTP + UDP client, regex workaround
│   │   ├── NPCController.cs        # NPC trigger → Remember → dialogue
│   │   └── PlayerController.cs      # WASD + raycast encounter trigger
│   └── Plugins/
│       └── UnityEngine.UI.dll       # Bundled DLL (workaround for 6000.3.15)
├── Documentation~
│   ├── getting-started.md
│   ├── api-reference.md
│   └── manifest-entries.md         # This file
├── Samples~
│   └── KhunTumDemo/
│       ├── Editor/
│       │   ├── CreateKhunTumScene.cs
│       │   ├── AddScenesToBuild.cs
│       │   └── RunSmokeTest.cs
│       └── Scenes/
│           └── KhunTumEncounter.unity
└── Tests/
    ├── TestJsonUtility.cs           # @event serialization verification
    └── TestLetheClient.cs           # Unit tests
```

**Minimum package.json dependencies:**
```json
{
  "dependencies": {
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.modules.jsonserialize": "1.0.0"
  }
}
```

---

## 5. Compatibility matrix

| Unity version | UI DLL fix needed? | @event regex needed? | Notes |
|---|---|---|---|
| 2022.3 LTS | No (ships in Editor) | Yes (reserved keyword) | Standard Unity |
| 6000.0.x | Yes (Assets/Plugins copy) | Yes | New modular system |
| 6000.3.x | Yes (Assets/Plugins copy) | Yes | Same as 6000.0 |

---

## 6. Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `error CS0246: The type or namespace name 'Text' could not be found` | `UnityEngine.UI` not resolved | Add `com.unity.modules.ui` to manifest + copy DLL to Assets/Plugins |
| `error CS0246: The type or namespace name 'UnityWebRequest' could not be found` | `UnityEngine.Networking` not resolved | Add `com.unity.modules.unitywebrequest` to manifest |
| `@event field deserializes as empty string` | JsonUtility limitation | Use `LetheJson.ExtractLatestEvent(raw)` instead |
| `Cannot create a new scene additively with an untitled scene unsaved` | EditorSceneManager API misuse in batchmode | Use `NewSceneMode.Single` in headless; handle untitled scenes by closing them first |
| `executeMethod method X threw exception` | Scene state / API preconditions not met | Check scene count and dirty state before calling scene APIs in batchmode |
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using System.Text.RegularExpressions;
using System;

namespace Lethe
{
    [Serializable]
    public class MemoryContent
    {
        public int v;
        public string npcId;
        public string playerWallet;
        // NOTE: @event deserializes as empty with JsonUtility due to @ prefix.
        // Access via LetheClient.ExtractEvent(rawJson) instead.
        public string _eventRaw;
        public long timestamp;
    }

    [Serializable]
    public class RecalledMemory
    {
        public string blobId;
        public long timestampMs;
        public MemoryContent content;
        public string error;
    }

    [Serializable]
    public class RecallResponse
    {
        public RecalledMemory[] events;
        public int count;
        public string suiObjectId;
    }

    [Serializable]
    public class RememberEvent
    {
        // NOTE: @ prefix needed for C# keyword escape but JsonUtility.ToJson
        // correctly outputs "event" (dropping @). Verified in TestJsonUtility.
        public string @event;
        public long timestamp;
    }

    [Serializable]
    public class RememberRequest
    {
        public string playerWallet;
        public RememberEvent @event;
    }

    [Serializable]
    public class RememberResponse
    {
        public bool ok;
        public string blobId;
        public string txDigest;
    }

    public static class LetheJson
    {
        // The Lethe service returns "event" (not "@event") in JSON. The regex also
        // handles "@event" for compatibility if Sui storage ever uses that form.
        private static readonly Regex EventRegex =
            new Regex("\"@?event\"\\s*:\\s*\"([^\"\\\\]*(?:\\\\.[^\"\\\\]*)*)\"",
                     RegexOptions.Compiled);

        public static string ExtractEvent(string rawJson)
        {
            if (string.IsNullOrEmpty(rawJson)) return null;
            var m = EventRegex.Match(rawJson);
            if (m.Success) return m.Groups[1].Value;
            return null;
        }

        public static string ExtractLatestEvent(string rawJson)
        {
            if (string.IsNullOrEmpty(rawJson)) return null;
            var matches = EventRegex.Matches(rawJson);
            if (matches.Count == 0) return null;
            // Last match = most recent event
            return matches[matches.Count - 1].Groups[1].Value;
        }
    }

    public class LetheClient
    {
        public string ServiceUrl = "http://localhost:3001";
        public string NpcId = "khun-tum";

        /// <summary>Fetch recalled memories for playerWallet. Use LetheJson.ExtractLatestEvent(raw)
        /// to safely read the @event field (JsonUtility cannot deserialize @-prefixed keys).</summary>
        public IEnumerator Recall(string playerWallet,
            Action<RecallResponse, string> onSuccess,
            Action<string> onError)
        {
            string url = $"{ServiceUrl}/npc/{NpcId}/recall/{playerWallet}";
            using (var req = UnityWebRequest.Get(url))
            {
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        string raw = req.downloadHandler.text;
                        var parsed = JsonUtility.FromJson<RecallResponse>(raw);
                        // Pass raw JSON so caller can extract @event field
                        onSuccess?.Invoke(parsed, raw);
                    }
                    catch (Exception e)
                    {
                        onError?.Invoke("Parse error: " + e.Message);
                    }
                }
                else
                {
                    onError?.Invoke(req.error);
                }
            }
        }

        public IEnumerator Remember(string playerWallet, string eventText,
            Action<RememberResponse> onSuccess,
            Action<string> onError)
        {
            var body = new RememberRequest
            {
                playerWallet = playerWallet,
                @event = new RememberEvent
                {
                    @event = eventText,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                }
            };

            // JsonUtility.ToJson correctly outputs "event" (not "@event") — verified.
            string json = JsonUtility.ToJson(body);
            string url = $"{ServiceUrl}/npc/{NpcId}/remember";

            using (var req = new UnityWebRequest(url, "POST"))
            {
                byte[] raw = Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(raw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    try
                    {
                        var parsed = JsonUtility.FromJson<RememberResponse>(req.downloadHandler.text);
                        onSuccess?.Invoke(parsed);
                    }
                    catch (Exception e)
                    {
                        onError?.Invoke("Parse error: " + e.Message);
                    }
                }
                else
                {
                    onError?.Invoke(req.error + " | " + req.downloadHandler?.text);
                }
            }
        }
    }
}
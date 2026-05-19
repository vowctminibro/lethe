using UnityEditor;
using UnityEngine;
using Lethe;
using System.Text;
using System.IO;

public class TestJsonUtility
{
    public static void Run()
    {
        string log = "/tmp/unity-json-test.log";
        var sw = File.AppendText(log);
        sw.WriteLine("[JSON-TEST] Starting @event round-trip test...");

        // ── Test RecallResponse deserialization ────────────────────────────
        string sampleRecall = @"
            ""events"": [
                {
                    ""blobId"": ""U16MlYB1XaJjFxBwwhG_WnI6lc3L_ONRvN3La8UoBiw"",
                    ""timestampMs"": 1779096962176,
                    ""content"": {
                        ""v"": 1,
                        ""npcId"": ""khun-tum"",
                        ""playerWallet"": ""0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077"",
                        ""@event"": ""SDK e2e test event 1779104135534"",
                        ""timestamp"": 1779104135534
                    },
                    ""error"": null
                }
            ],
            ""count"": 1,
            ""suiObjectId"": ""0x1234""
        }";
        sw.WriteLine("[JSON-TEST] Sample: " + sampleRecall);

        try
        {
            var parsed = JsonUtility.FromJson<RecallResponse>(sampleRecall);
            sw.WriteLine("[JSON-TEST] Parsed count=" + parsed.count);

            // Use LetheJson.ExtractLatestEvent since @event cannot be read via JsonUtility
            string extractedEvent = LetheJson.ExtractLatestEvent(sampleRecall);
            sw.WriteLine("[JSON-TEST] Extracted @event = " + extractedEvent);

            if (!string.IsNullOrEmpty(extractedEvent))
            {
                Debug.Log("[JSON-TEST] PASS: @event extracted = " + extractedEvent);
                sw.WriteLine("[JSON-TEST] PASS: @event extracted OK = " + extractedEvent);
            }
            else
            {
                Debug.LogError("[JSON-TEST] FAIL: @event extraction returned null");
                sw.WriteLine("[JSON-TEST] FAIL: @event extraction returned null");
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError("[JSON-TEST] FAIL RecallResponse: " + ex.Message);
            sw.WriteLine("[JSON-TEST] FAIL RecallResponse: " + ex.Message);
        }

        // ── Test RememberRequest serialization ────────────────────────────
        sw.WriteLine("[JSON-TEST] Test RememberRequest serialization...");
        try
        {
            var req = new RememberRequest
            {
                playerWallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077",
                @event = new RememberEvent { @event = "met the traveler", timestamp = 1779104135534 }
            };
            string json = JsonUtility.ToJson(req);
            sw.WriteLine("[JSON-TEST] JsonUtility.ToJson output: " + json);

            // Check: should contain "event" not "@event"
            if (json.Contains("\"@event\""))
            {
                Debug.LogError("[JSON-TEST] FAIL: JsonUtility.ToJson produced \"@event\" instead of \"event\"");
                sw.WriteLine("[JSON-TEST] FAIL: produces @event instead of event");
            }
            else if (json.Contains("\"event\""))
            {
                Debug.Log("[JSON-TEST] PASS: JsonUtility.ToJson produces \"event\" key (correct)");
                sw.WriteLine("[JSON-TEST] PASS: produces 'event' key OK");
            }
            else
            {
                Debug.LogWarning("[JSON-TEST] WARN: neither @event nor event found in output: " + json);
                sw.WriteLine("[JSON-TEST] WARN: weird output: " + json);
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError("[JSON-TEST] FAIL RememberRequest: " + ex.Message);
            sw.WriteLine("[JSON-TEST] FAIL RememberRequest: " + ex.Message);
        }

        sw.Close();
        EditorApplication.Exit(0);
    }
}
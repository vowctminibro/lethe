using UnityEditor;
using UnityEngine;
using Lethe;
using System.IO;

public class RunSmokeTest
{
    public static void Run()
    {
        string logPath = "/tmp/unity-smoke-tight.log";
        var sw = File.AppendText(logPath);
        bool pass = true;

        sw.WriteLine("[SMOKE] Starting tightened smoke test...");

        // ── Sui testnet ──────────────────────────────────────────────────
        sw.WriteLine("[SMOKE] Test 1: Sui testnet...");
        try
        {
            using (var req = new UnityEngine.Networking.UnityWebRequest(
                "https://fullnode.testnet.sui.io", "POST"))
            {
                string payload = "{\"jsonrpc\":\"2.0\",\"method\":\"sui_getTotalTransactionNumber\",\"params\":[],\"id\":1}";
                req.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(
                    System.Text.Encoding.UTF8.GetBytes(payload));
                req.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 15;
                req.SendWebRequest();
                while (!req.isDone) { }
                if (req.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    sw.WriteLine("[SMOKE] OK Sui testnet reachable");
                }
                else
                {
                    sw.WriteLine("[SMOKE] FAIL Sui RPC: " + req.error);
                    pass = false;
                }
            }
        }
        catch (System.Exception ex)
        {
            sw.WriteLine("[SMOKE] FAIL Sui RPC exception: " + ex.Message);
            pass = false;
        }

        // ── Lethe recall + strict assertions ──────────────────────────────
        sw.WriteLine("[SMOKE] Test 2: Lethe recall + strict assertions...");
        try
        {
            string wallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
            string raw = null;
            RecallResponse resp = null;

            using (var req = UnityEngine.Networking.UnityWebRequest.Get(
                "http://localhost:3001/npc/khun-tum/recall/" + wallet))
            {
                req.timeout = 15;
                req.SendWebRequest();
                while (!req.isDone) { }

                if (req.result != UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    sw.WriteLine("[SMOKE] FAIL Lethe recall HTTP: " + req.error + " code=" + req.responseCode);
                    pass = false;
                }
                else
                {
                    raw = req.downloadHandler.text;
                    resp = JsonUtility.FromJson<RecallResponse>(raw);
                }
            }

            if (resp != null)
            {
                sw.WriteLine("[SMOKE] Parsed: count=" + resp.count +
                    " events.Length=" + (resp.events != null ? resp.events.Length : -1));

                // Assertion 1: count >= 1
                if (resp.count < 1)
                {
                    Debug.LogError("[SMOKE] ASSERT FAIL: resp.count < 1 (got " + resp.count + ")");
                    sw.WriteLine("[SMOKE] ASSERT FAIL: resp.count < 1");
                    pass = false;
                }
                else sw.WriteLine("[SMOKE] PASS count >= 1");

                // Assertion 2: events != null AND Length >= 1
                if (resp.events == null || resp.events.Length < 1)
                {
                    Debug.LogError("[SMOKE] ASSERT FAIL: events null or empty");
                    sw.WriteLine("[SMOKE] ASSERT FAIL: events null or empty");
                    pass = false;
                }
                else sw.WriteLine("[SMOKE] PASS events not null, Length >= 1");

                // Assertion 3: latest event has valid @event content (via LetheJson workaround)
                if (!string.IsNullOrEmpty(raw))
                {
                    string latestEvent = LetheJson.ExtractLatestEvent(raw);
                    if (string.IsNullOrEmpty(latestEvent))
                    {
                        Debug.LogError("[SMOKE] ASSERT FAIL: no valid @event content in recall response");
                        sw.WriteLine("[SMOKE] ASSERT FAIL: no valid @event in recall");
                        pass = false;
                    }
                    else
                    {
                        sw.WriteLine("[SMOKE] PASS latest @event: " + latestEvent);
                    }
                }
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError("[SMOKE] FAIL Lethe recall exception: " + ex.Message);
            sw.WriteLine("[SMOKE] FAIL exception: " + ex.Message);
            pass = false;
        }

        sw.WriteLine(pass ? "[SMOKE] ALL PASS" : "[SMOKE] SOME FAIL");
        sw.Close();
        Debug.Log(pass ? "[SMOKE] ALL PASS" : "[SMOKE] SOME FAIL");
        EditorApplication.Exit(pass ? 0 : 1);
    }
}
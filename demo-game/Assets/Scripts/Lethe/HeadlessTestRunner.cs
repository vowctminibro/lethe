using UnityEngine;
using System.IO;

namespace Lethe.SmokeTest
{
    public class HeadlessTestRunner
    {
        // Called via -executeMethod Lethe.SmokeTest.HeadlessTestRunner.Run
        static void Run()
        {
            string log = "/tmp/unity-smoke-output.log";
            var sw = File.AppendText(log);
            sw.WriteLine("[LETHE SMOKE TEST] Headless runner starting...");

            // Test 1: Sui testnet via HTTPS
            sw.WriteLine("[LETHE SMOKE TEST] Test 1: Sui testnet...");
            try
            {
                using (var req = new UnityEngine.Networking.UnityWebRequest("https://fullnode.testnet.sui.io", "POST"))
                {
                    string payload = "{\"jsonrpc\":\"2.0\",\"method\":\"sui_getTotalTransactionNumber\",\"params\":[],\"id\":1}";
                    req.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(payload));
                    req.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                    req.SetRequestHeader("Content-Type", "application/json");
                    req.timeout = 15;
                    req.SendWebRequest();
                    while (!req.isDone) { }
                    if (req.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        sw.WriteLine("[LETHE SMOKE TEST] OK Sui testnet reachable");
                    }
                    else
                    {
                        sw.WriteLine("[LETHE SMOKE TEST] FAIL Sui RPC: " + req.error);
                    }
                }
            }
            catch (System.Exception ex)
            {
                sw.WriteLine("[LETHE SMOKE TEST] FAIL Sui RPC exception: " + ex.Message);
            }

            // Test 2: Lethe via localhost:3001
            sw.WriteLine("[LETHE SMOKE TEST] Test 2: Lethe localhost:3001...");
            try
            {
                using (var req = UnityEngine.Networking.UnityWebRequest.Get("http://localhost:3001/health"))
                {
                    req.timeout = 10;
                    req.SendWebRequest();
                    while (!req.isDone) { }
                    if (req.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        sw.WriteLine("[LETHE SMOKE TEST] OK Lethe localhost:3001: " + req.downloadHandler.text);
                    }
                    else
                    {
                        sw.WriteLine("[LETHE SMOKE TEST] FAIL Lethe localhost: " + req.error + " code=" + req.responseCode);
                    }
                }
            }
            catch (System.Exception ex)
            {
                sw.WriteLine("[LETHE SMOKE TEST] FAIL Lethe localhost exception: " + ex.Message);
            }

            // Test 3: Lethe recall via localhost
            sw.WriteLine("[LETHE SMOKE TEST] Test 3: Lethe recall...");
            try
            {
                string wallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
                using (var req = UnityEngine.Networking.UnityWebRequest.Get("http://localhost:3001/npc/khun-tum/recall/" + wallet))
                {
                    req.timeout = 15;
                    req.SendWebRequest();
                    while (!req.isDone) { }
                    if (req.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                    {
                        string text = req.downloadHandler.text;
                        sw.WriteLine("[LETHE SMOKE TEST] OK Recall (" + text.Length + " chars)");
                    }
                    else
                    {
                        sw.WriteLine("[LETHE SMOKE TEST] FAIL Recall: " + req.error + " code=" + req.responseCode);
                    }
                }
            }
            catch (System.Exception ex)
            {
                sw.WriteLine("[LETHE SMOKE TEST] FAIL Recall exception: " + ex.Message);
            }

            sw.WriteLine("[LETHE SMOKE TEST] COMPLETE");
            sw.Close();
            Application.Quit();
        }
    }
}
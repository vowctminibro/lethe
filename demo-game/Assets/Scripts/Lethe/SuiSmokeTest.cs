using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace Lethe.SmokeTest
{
    public class SuiSmokeTest : MonoBehaviour
    {
        // Dev: localhost:3001 (memory-service running on this machine)
        // Prod: http://testnet-rpc.lethe.io (dev server, HTTP only - no TLS cert yet)
        private string LetheRpcUrl = "http://localhost:3001";
        private string SuiRpcUrl = "https://fullnode.testnet.sui.io";
        private bool testComplete = false;
        private string testResult = "";

        void Start()
        {
            Debug.Log("[LETHE SMOKE TEST] Starting...");
            StartCoroutine(RunAllTests());
        }

        IEnumerator RunAllTests()
        {
            yield return TestLetheHealth();
            yield return TestSuiRpcConnection();
            yield return TestLetheRecall();
            yield return TestSuiGetObjects();

            Debug.Log("[LETHE SMOKE TEST] COMPLETE — " + testResult);
            testComplete = true;
        }

        IEnumerator TestLetheHealth()
        {
            Debug.Log("[LETHE SMOKE TEST] Testing Lethe RPC health...");
            using (var req = UnityWebRequest.Get(LetheRpcUrl + "/health"))
            {
                req.timeout = 10;
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    string text = req.downloadHandler.text;
                    Debug.Log("[LETHE SMOKE TEST] OK Lethe RPC (" + text.Length + " chars): " + text);
                    testResult += "LetheRPC:OK ";
                }
                else
                {
                    Debug.LogWarning("[LETHE SMOKE TEST] FAIL Lethe RPC: " + req.error + " | " + req.responseCode);
                    testResult += "LetheRPC:FAIL ";
                }
            }
        }

        IEnumerator TestSuiRpcConnection()
        {
            Debug.Log("[LETHE SMOKE TEST] Testing Sui testnet RPC...");
            string payload = "{\"jsonrpc\":\"2.0\",\"method\":\"sui_getTotalTransactionNumber\",\"params\":[],\"id\":1}";
            using (var req = new UnityWebRequest(SuiRpcUrl, "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(payload));
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 15;
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    string text = req.downloadHandler.text;
                    Debug.Log("[LETHE SMOKE TEST] OK Sui testnet reachable (" + req.responseCode + ")");
                    testResult += "SuiRPC:OK ";
                }
                else
                {
                    Debug.LogWarning("[LETHE SMOKE TEST] FAIL Sui RPC: " + req.error);
                    testResult += "SuiRPC:FAIL ";
                }
            }
        }

        IEnumerator TestLetheRecall()
        {
            Debug.Log("[LETHE SMOKE TEST] Testing Lethe recall...");
            string wallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
            string recallUrl = LetheRpcUrl + "/npc/khun-tum/recall/" + wallet;
            using (var req = UnityWebRequest.Get(recallUrl))
            {
                req.timeout = 15;
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    string text = req.downloadHandler.text;
                    Debug.Log("[LETHE SMOKE TEST] OK Recall (" + text.Length + " chars)");
                    testResult += "Recall:OK ";
                }
                else
                {
                    Debug.LogWarning("[LETHE SMOKE TEST] FAIL Recall: " + req.error + " | " + req.responseCode);
                    testResult += "Recall:FAIL ";
                }
            }
        }

        IEnumerator TestSuiGetObjects()
        {
            Debug.Log("[LETHE SMOKE TEST] Testing Sui getObject (NPC on-chain)...");
            string payload = "{\"jsonrpc\":\"2.0\",\"method\":\"sui_getObject\",\"params\":[\"0x5f8a5e40ef89e32c61b9d2f7e35e28b2c12f31a6\",{\"showContent\":true}],\"id\":1}";
            using (var req = new UnityWebRequest(SuiRpcUrl, "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(payload));
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");
                req.timeout = 15;
                yield return req.SendWebRequest();
                if (req.result == UnityWebRequest.Result.Success)
                {
                    string text = req.downloadHandler.text;
                    Debug.Log("[LETHE SMOKE TEST] OK Sui getObject");
                    testResult += "GetObjects:OK ";
                }
                else
                {
                    Debug.LogWarning("[LETHE SMOKE TEST] FAIL Sui getObject: " + req.error);
                    testResult += "GetObjects:FAIL ";
                }
            }
        }

        void OnGUI()
        {
            if (!testComplete) return;
            GUILayout.BeginArea(new Rect(10, 10, 700, 300));
            GUILayout.Label("[LETHE SMOKE TEST] Results: " + testResult);
            GUILayout.EndArea();
        }
    }
}

using System.Net.Http;
using System.Threading.Tasks;
using UnityEngine;

namespace Lethe.SmokeTest
{
    public class HeadlessSmokeTest
    {
        public static async Task<int> Run()
        {
            int exitCode = 0;
            var http = new HttpClient { Timeout = System.TimeSpan.FromSeconds(20) };

            // Test 1: Lethe RPC health
            Debug.Log("[LETHE SMOKE TEST] Testing Lethe RPC...");
            try
            {
                var health = await http.GetStringAsync("https://testnet-rpc.lethe.io/health");
                Debug.Log("[LETHE SMOKE TEST] OK Lethe RPC: " + health);
            }
            catch (System.Exception ex)
            {
                Debug.LogError("[LETHE SMOKE TEST] FAIL Lethe RPC: " + ex.Message);
                exitCode = 1;
            }

            // Test 2: Sui testnet RPC
            Debug.Log("[LETHE SMOKE TEST] Testing Sui testnet...");
            try
            {
                var payload = "{\"jsonrpc\":\"2.0\",\"method\":\"sui_getTotalTransactionNumber\",\"params\":[],\"id\":1}";
                var content = new System.Net.Http.StringContent(payload, System.Text.Encoding.UTF8, "application/json");
                var resp = await http.PostAsync("https://fullnode.testnet.sui.io", content);
                var body = await resp.Content.ReadAsStringAsync();
                Debug.Log("[LETHE SMOKE TEST] OK Sui testnet: " + body.Substring(0, System.Math.Min(100, body.Length)));
            }
            catch (System.Exception ex)
            {
                Debug.LogError("[LETHE SMOKE TEST] FAIL Sui RPC: " + ex.Message);
                exitCode = 1;
            }

            // Test 3: Lethe recall
            Debug.Log("[LETHE SMOKE TEST] Testing Lethe recall...");
            try
            {
                string wallet = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
                var recall = await http.GetStringAsync($"https://testnet-rpc.lethe.io/recall?wallet={wallet}&npcId=khun-tum");
                Debug.Log("[LETHE SMOKE TEST] OK Recall (" + recall.Length + " chars)");
            }
            catch (System.Exception ex)
            {
                Debug.LogError("[LETHE SMOKE TEST] FAIL Recall: " + ex.Message);
                exitCode = 1;
            }

            Debug.Log("[LETHE SMOKE TEST] COMPLETE");
            return exitCode;
        }
    }
}